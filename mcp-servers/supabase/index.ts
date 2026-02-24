#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import type {
  SupabaseMCPConfig,
  CreateProjectParams,
  CreateProjectResult,
  ExecuteSQLParams,
  ExecuteSQLResult,
  ConfigureAuthProviderParams,
  ConfigureAuthProviderResult,
  GetProjectInfoParams,
  GetProjectInfoResult
} from './types.js'
import { withRetry, fetchWithRetrySupport } from '../shared/retry.js'

/**
 * ShipMe Supabase MCP Server
 *
 * Provides tools for Supabase project management, database operations, and auth configuration.
 * Adapted from ShipMe v1.0 Supabase provisioning code.
 */

const SUPABASE_API_URL = 'https://api.supabase.com/v1'

class SupabaseMCPServer {
  private server: Server
  private accessToken: string
  private organizationId?: string

  constructor(config: SupabaseMCPConfig) {
    this.accessToken = config.accessToken
    this.organizationId = config.organizationId

    this.server = new Server(
      {
        name: 'shipme-supabase-mcp',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    )

    this.setupHandlers()
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_project',
          description: 'Create a new Supabase project with database and API keys',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Project name (will be slugified for the project reference)'
              },
              region: {
                type: 'string',
                description: 'AWS region (e.g., us-east-1, eu-west-1, ap-southeast-1)',
                default: 'us-east-1'
              },
              db_password: {
                type: 'string',
                description: 'Database password (min 12 characters, include numbers and special chars)'
              },
              plan: {
                type: 'string',
                enum: ['free', 'pro'],
                description: 'Pricing plan',
                default: 'free'
              }
            },
            required: ['name', 'db_password']
          }
        },
        {
          name: 'execute_sql',
          description: 'Execute SQL statements on a Supabase project (migrations, schema changes)',
          inputSchema: {
            type: 'object',
            properties: {
              project_ref: {
                type: 'string',
                description: 'Supabase project reference ID'
              },
              sql: {
                type: 'string',
                description: 'SQL statement(s) to execute. Can be multiple statements separated by semicolons.'
              }
            },
            required: ['project_ref', 'sql']
          }
        },
        {
          name: 'configure_auth_provider',
          description: 'Configure an OAuth authentication provider (Google, GitHub, etc.)',
          inputSchema: {
            type: 'object',
            properties: {
              project_ref: {
                type: 'string',
                description: 'Supabase project reference ID'
              },
              provider: {
                type: 'string',
                enum: ['google', 'github', 'gitlab', 'bitbucket', 'azure'],
                description: 'OAuth provider to configure'
              },
              client_id: {
                type: 'string',
                description: 'OAuth application client ID'
              },
              client_secret: {
                type: 'string',
                description: 'OAuth application client secret'
              },
              redirect_uri: {
                type: 'string',
                description: 'Optional redirect URI (defaults to Supabase auth callback)'
              }
            },
            required: ['project_ref', 'provider', 'client_id', 'client_secret']
          }
        },
        {
          name: 'get_project_info',
          description: 'Get information about a Supabase project (status, URL, API keys)',
          inputSchema: {
            type: 'object',
            properties: {
              project_ref: {
                type: 'string',
                description: 'Supabase project reference ID'
              }
            },
            required: ['project_ref']
          }
        }
      ]
    }))

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      try {
        switch (name) {
          case 'create_project':
            return await this.createProject(args as unknown as CreateProjectParams)
          case 'execute_sql':
            return await this.executeSQL(args as unknown as ExecuteSQLParams)
          case 'configure_auth_provider':
            return await this.configureAuthProvider(args as unknown as ConfigureAuthProviderParams)
          case 'get_project_info':
            return await this.getProjectInfo(args as unknown as GetProjectInfoParams)
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: errorMessage
              })
            }
          ]
        }
      }
    })
  }

  private async createProject(params: CreateProjectParams) {
    const { name, region = 'us-east-1', db_password, plan = 'free' } = params

    // Validate password strength
    if (db_password.length < 12) {
      throw new Error('Database password must be at least 12 characters')
    }

    // Get organization ID (use provided or fetch first available)
    let orgId = this.organizationId
    if (!orgId) {
      const orgsResponse = await withRetry(
        () => fetchWithRetrySupport(`${SUPABASE_API_URL}/organizations`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }),
        { label: 'Supabase org fetch' }
      )

      const orgs = await orgsResponse.json() as Array<{ id: string; name: string }>
      if (orgs.length === 0) {
        throw new Error('No organizations found. Create one at https://supabase.com/dashboard')
      }

      orgId = orgs[0].id
      console.error(`Using organization: ${orgs[0].name} (${orgId})`)
    }

    // Create project (with retry for transient errors)
    const createResponse = await withRetry(
      () => fetchWithRetrySupport(`${SUPABASE_API_URL}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          organization_id: orgId,
          region,
          db_pass: db_password,
          plan
        })
      }),
      { label: 'Supabase project creation' }
    )

    const project = await createResponse.json() as { id: string; name: string; status: string }

    // Wait for project to initialize (typically takes 30-60 seconds)
    console.error(`Waiting for project ${project.id} to initialize...`)
    await this.waitForProjectReady(project.id)

    // Get API keys (with retry — sometimes available slightly after ACTIVE_HEALTHY)
    let anonKey = ''
    let serviceRoleKey = ''

    try {
      const keysResponse = await withRetry(
        () => fetchWithRetrySupport(
          `${SUPABASE_API_URL}/projects/${project.id}/api-keys`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        ),
        { label: 'Supabase API keys fetch' }
      )

      const keys = await keysResponse.json() as Array<{ name: string; api_key: string }>
      anonKey = keys.find((k) => k.name === 'anon')?.api_key || ''
      serviceRoleKey = keys.find((k) => k.name === 'service_role')?.api_key || ''
    } catch (err) {
      console.error('Warning: Failed to fetch API keys:', err)
    }

    const result: CreateProjectResult = {
      success: true,
      project_id: project.id,
      project_ref: project.id,
      url: `https://${project.id}.supabase.co`,
      api_url: `https://${project.id}.supabase.co`,
      anon_key: anonKey,
      service_role_key: serviceRoleKey,
      db_connection_string: `postgresql://postgres:${db_password}@db.${project.id}.supabase.co:5432/postgres`,
      dashboard_url: `https://supabase.com/dashboard/project/${project.id}`
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    }
  }

  private async executeSQL(params: ExecuteSQLParams) {
    const { project_ref, sql } = params

    const response = await fetch(
      `${SUPABASE_API_URL}/projects/${project_ref}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
      }
    )

    if (!response.ok) {
      const error = await response.json() as { message?: string }
      throw new Error(error.message || 'Failed to execute SQL')
    }

    const data = await response.json() as { rows_affected?: number }

    const result: ExecuteSQLResult = {
      success: true,
      rows_affected: data.rows_affected || 0
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    }
  }

  private async configureAuthProvider(params: ConfigureAuthProviderParams) {
    const { project_ref, provider, client_id, client_secret, redirect_uri } = params

    // Build auth config
    const authConfig: any = {
      [provider]: {
        enabled: true,
        client_id,
        secret: client_secret
      }
    }

    if (redirect_uri) {
      authConfig[provider].redirect_uri = redirect_uri
    }

    const response = await fetch(
      `${SUPABASE_API_URL}/projects/${project_ref}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(authConfig)
      }
    )

    if (!response.ok) {
      const error = await response.json() as { message?: string }
      throw new Error(error.message || 'Failed to configure auth provider')
    }

    const result: ConfigureAuthProviderResult = {
      success: true,
      provider,
      message: `${provider} OAuth provider configured successfully`
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    }
  }

  private async getProjectInfo(params: GetProjectInfoParams) {
    const { project_ref } = params

    const response = await fetch(
      `${SUPABASE_API_URL}/projects/${project_ref}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      const error = await response.json() as { message?: string }
      throw new Error(error.message || 'Failed to get project info')
    }

    const project = await response.json() as {
      id: string
      name: string
      region: string
      status: string
      created_at: string
    }

    const result: GetProjectInfoResult = {
      success: true,
      project_id: project.id,
      project_ref: project.id,
      name: project.name,
      url: `https://${project.id}.supabase.co`,
      api_url: `https://${project.id}.supabase.co`,
      region: project.region,
      status: project.status,
      created_at: project.created_at
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    }
  }

  /**
   * Wait for project to be ready (polls status endpoint)
   */
  private async waitForProjectReady(projectId: string, maxWaitTime: number = 120000): Promise<void> {
    const startTime = Date.now()
    const pollInterval = 5000 // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(
          `${SUPABASE_API_URL}/projects/${projectId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (response.ok) {
          const project = await response.json() as { status: string }
          if (project.status === 'ACTIVE_HEALTHY') {
            console.error(`✓ Project ${projectId} is ready!`)
            return
          }
          console.error(`  Status: ${project.status}...`)
        }
      } catch (error) {
        // Continue polling
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error(`Project ${projectId} did not become ready within ${maxWaitTime / 1000}s`)
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('ShipMe Supabase MCP Server running on stdio')
  }
}

// Start the server
const accessToken = process.env.SUPABASE_ACCESS_TOKEN
if (!accessToken) {
  console.error('Error: SUPABASE_ACCESS_TOKEN environment variable is required')
  console.error('Get your access token from: https://supabase.com/dashboard/account/tokens')
  process.exit(1)
}

const organizationId = process.env.SUPABASE_ORG_ID // Optional

const server = new SupabaseMCPServer({ accessToken, organizationId })
server.run().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
