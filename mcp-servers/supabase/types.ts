/**
 * ShipMe Supabase MCP Server - Type Definitions
 */

export interface SupabaseMCPConfig {
  accessToken: string
  organizationId?: string
}

export interface CreateProjectParams {
  name: string
  region?: string
  db_password: string
  plan?: 'free' | 'pro'
}

export interface CreateProjectResult {
  success: boolean
  project_id?: string
  project_ref?: string
  url?: string
  api_url?: string
  anon_key?: string
  service_role_key?: string
  db_connection_string?: string
  dashboard_url?: string
  error?: string
}

export interface ExecuteSQLParams {
  project_ref: string
  sql: string
}

export interface ExecuteSQLResult {
  success: boolean
  rows_affected?: number
  error?: string
}

export interface ConfigureAuthProviderParams {
  project_ref: string
  provider: 'google' | 'github' | 'gitlab' | 'bitbucket' | 'azure'
  client_id: string
  client_secret: string
  redirect_uri?: string
}

export interface ConfigureAuthProviderResult {
  success: boolean
  provider?: string
  message?: string
  error?: string
}

export interface GetProjectInfoParams {
  project_ref: string
}

export interface GetProjectInfoResult {
  success: boolean
  project_id?: string
  project_ref?: string
  name?: string
  url?: string
  api_url?: string
  region?: string
  status?: string
  created_at?: string
  error?: string
}

export interface SupabaseAPIError {
  message: string
  code?: string
  status?: number
}
