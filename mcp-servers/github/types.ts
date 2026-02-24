/**
 * Type definitions for GitHub MCP Server
 */

export interface CreateRepositoryInput {
  name: string
  description: string
  private?: boolean
  template_owner?: string
  template_repo?: string
}

export interface CreateRepositoryResult {
  success: boolean
  repo_url?: string
  clone_url?: string
  ssh_url?: string
  owner?: string
  repo_name?: string
  error?: string
}

export interface CreateSecretInput {
  owner: string
  repo: string
  secret_name: string
  secret_value: string
}

export interface CreateSecretResult {
  success: boolean
  secret_name?: string
  message?: string
  error?: string
}

export interface PushFilesInput {
  owner: string
  repo: string
  files: Array<{
    path: string
    content: string
  }>
  message?: string
}

export interface PushFilesResult {
  success: boolean
  commit_sha?: string
  files_pushed?: number
  message?: string
  error?: string
}
