#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js'
import { Octokit } from '@octokit/rest'
import sodium from 'libsodium-wrappers'

/**
 * ShipMe GitHub MCP Server
 *
 * Provides tools for GitHub repository management during infrastructure provisioning.
 * Adapted from ShipMe v1.0 GitHub provisioning code.
 */

interface GitHubMCPConfig {
  token: string
}

class GitHubMCPServer {
  private server: Server
  private octokit: Octokit

  constructor(config: GitHubMCPConfig) {
    this.octokit = new Octokit({ auth: config.token })

    this.server = new Server(
      {
        name: 'shipme-github-mcp',
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
          name: 'create_repository',
          description: 'Create a new GitHub repository. Can optionally use a template repository.',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Repository name'
              },
              description: {
                type: 'string',
                description: 'Repository description'
              },
              private: {
                type: 'boolean',
                description: 'Whether the repository should be private',
                default: false
              },
              template_owner: {
                type: 'string',
                description: 'Template repository owner (optional)'
              },
              template_repo: {
                type: 'string',
                description: 'Template repository name (optional)'
              }
            },
            required: ['name', 'description']
          }
        },
        {
          name: 'create_secret',
          description: 'Add an encrypted secret to a GitHub repository for use in Actions',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner username'
              },
              repo: {
                type: 'string',
                description: 'Repository name'
              },
              secret_name: {
                type: 'string',
                description: 'Name of the secret (e.g., SUPABASE_URL)'
              },
              secret_value: {
                type: 'string',
                description: 'Value of the secret'
              }
            },
            required: ['owner', 'repo', 'secret_name', 'secret_value']
          }
        },
        {
          name: 'push_files',
          description: 'Push files to a GitHub repository',
          inputSchema: {
            type: 'object',
            properties: {
              owner: {
                type: 'string',
                description: 'Repository owner username'
              },
              repo: {
                type: 'string',
                description: 'Repository name'
              },
              files: {
                type: 'array',
                description: 'Array of files to push',
                items: {
                  type: 'object',
                  properties: {
                    path: {
                      type: 'string',
                      description: 'File path in repository'
                    },
                    content: {
                      type: 'string',
                      description: 'File content'
                    }
                  },
                  required: ['path', 'content']
                }
              },
              message: {
                type: 'string',
                description: 'Commit message',
                default: '🚀 Update from ShipMe'
              }
            },
            required: ['owner', 'repo', 'files']
          }
        }
      ]
    }))

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params

      try {
        switch (name) {
          case 'create_repository':
            return await this.createRepository(args)
          case 'create_secret':
            return await this.createSecret(args)
          case 'push_files':
            return await this.pushFiles(args)
          default:
            throw new Error(`Unknown tool: ${name}`)
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message
              })
            }
          ]
        }
      }
    })
  }

  private async createRepository(args: any) {
    const { name, description, private: isPrivate, template_owner, template_repo } = args

    // Get authenticated user
    const { data: user } = await this.octokit.users.getAuthenticated()

    let repo

    if (template_owner && template_repo) {
      // Create from template
      const { data } = await this.octokit.repos.createUsingTemplate({
        template_owner,
        template_repo,
        name,
        description,
        private: isPrivate ?? false,
        include_all_branches: false
      })
      repo = data
    } else {
      // Create empty repository
      const { data } = await this.octokit.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate ?? false,
        auto_init: true,
        gitignore_template: 'Node'
      })
      repo = data
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            repo_url: repo.html_url,
            clone_url: repo.clone_url,
            ssh_url: repo.ssh_url,
            owner: user.login,
            repo_name: name
          }, null, 2)
        }
      ]
    }
  }

  private async createSecret(args: any) {
    const { owner, repo, secret_name, secret_value } = args

    // Get repository public key for encryption
    const { data: publicKey } = await this.octokit.actions.getRepoPublicKey({
      owner,
      repo
    })

    // Encrypt the secret value using libsodium
    await sodium.ready
    const binkey = sodium.from_base64(publicKey.key, sodium.base64_variants.ORIGINAL)
    const binsec = sodium.from_string(secret_value)
    const encBytes = sodium.crypto_box_seal(binsec, binkey)
    const encrypted_value = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)

    // Create or update the secret
    await this.octokit.actions.createOrUpdateRepoSecret({
      owner,
      repo,
      secret_name,
      encrypted_value,
      key_id: publicKey.key_id
    })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            secret_name,
            message: `Secret '${secret_name}' created successfully`
          }, null, 2)
        }
      ]
    }
  }

  private async pushFiles(args: any) {
    const { owner, repo, files, message = '🚀 Update from ShipMe' } = args

    // Get the default branch ref
    const { data: refData } = await this.octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/main'
    })

    // Get the commit that the ref points to
    const { data: commitData } = await this.octokit.git.getCommit({
      owner,
      repo,
      commit_sha: refData.object.sha
    })

    // Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file: { path: string; content: string }) => {
        const { data } = await this.octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64'
        })
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: data.sha
        }
      })
    )

    // Create a tree
    const { data: treeData } = await this.octokit.git.createTree({
      owner,
      repo,
      tree: blobs,
      base_tree: commitData.tree.sha
    })

    // Create a commit
    const { data: newCommit } = await this.octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: treeData.sha,
      parents: [refData.object.sha]
    })

    // Update the ref to point to the new commit
    await this.octokit.git.updateRef({
      owner,
      repo,
      ref: 'heads/main',
      sha: newCommit.sha
    })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            commit_sha: newCommit.sha,
            files_pushed: files.length,
            message: `Pushed ${files.length} file(s) to ${owner}/${repo}`
          }, null, 2)
        }
      ]
    }
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    console.error('ShipMe GitHub MCP Server running on stdio')
  }
}

// Start the server
const token = process.env.GITHUB_TOKEN
if (!token) {
  console.error('Error: GITHUB_TOKEN environment variable is required')
  process.exit(1)
}

const server = new GitHubMCPServer({ token })
server.run().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
