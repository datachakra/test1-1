/**
 * ShipMe Netlify MCP Server - Type Definitions
 */

export interface NetlifyMCPConfig {
  accessToken: string
}

export interface CreateSiteParams {
  name: string
  repo?: string // Optional GitHub repo in format "owner/repo"
}

export interface CreateSiteResult {
  success: boolean
  site_id?: string
  site_name?: string
  url?: string
  admin_url?: string
  deploy_url?: string
  error?: string
}

export interface ConfigureEnvVarsParams {
  site_id: string
  env_vars: Record<string, string>
}

export interface ConfigureEnvVarsResult {
  success: boolean
  vars_set?: number
  message?: string
  error?: string
}

export interface DeploySiteParams {
  site_id: string
  directory?: string
  branch?: string
}

export interface DeploySiteResult {
  success: boolean
  deploy_id?: string
  deploy_url?: string
  state?: string
  build_id?: string
  message?: string
  error?: string
}

export interface GetSiteInfoParams {
  site_id: string
}

export interface GetSiteInfoResult {
  success: boolean
  site_id?: string
  site_name?: string
  url?: string
  admin_url?: string
  state?: string
  created_at?: string
  updated_at?: string
  build_settings?: any
  error?: string
}

export interface NetlifyAPIError {
  message: string
  code?: string
  status?: number
}
