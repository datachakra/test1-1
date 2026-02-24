import crypto from 'crypto'

/**
 * SecretVault - In-memory encrypted credential storage
 *
 * Provides secure temporary storage for credentials during provisioning.
 * All secrets are encrypted with AES-256-CBC and stored only in memory.
 * The vault is destroyed when provisioning completes.
 */
export class SecretVault {
  private secrets: Map<string, string> = new Map()
  private encryptionKey: Buffer
  private isDestroyed: boolean = false

  constructor() {
    // Generate random encryption key (AES-256 requires 32 bytes)
    this.encryptionKey = crypto.randomBytes(32)
  }

  /**
   * Store a secret value with encryption
   */
  async store(key: string, value: string): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('Vault has been destroyed')
    }

    const iv = crypto.randomBytes(16) // Initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv)

    let encrypted = cipher.update(value, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Store format: iv:encrypted_value
    this.secrets.set(key, `${iv.toString('hex')}:${encrypted}`)
  }

  /**
   * Retrieve and decrypt a secret value
   */
  async retrieve(key: string): Promise<string | null> {
    if (this.isDestroyed) {
      throw new Error('Vault has been destroyed')
    }

    const stored = this.secrets.get(key)
    if (!stored) return null

    const [ivHex, encrypted] = stored.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Resolve template references like {{secrets.xxx}}
   * Used in provisioning plan execution
   */
  async resolve(reference: string): Promise<string> {
    if (this.isDestroyed) {
      throw new Error('Vault has been destroyed')
    }

    // Handle {{secrets.xxx}} format
    const match = reference.match(/\{\{secrets\.(\w+)\}\}/)
    if (!match) return reference

    const value = await this.retrieve(match[1])
    if (!value) {
      throw new Error(`Secret '${match[1]}' not found in vault`)
    }

    return value
  }

  /**
   * List all stored secret keys (not values)
   */
  listKeys(): string[] {
    if (this.isDestroyed) {
      throw new Error('Vault has been destroyed')
    }
    return Array.from(this.secrets.keys())
  }

  /**
   * Check if a secret exists
   */
  has(key: string): boolean {
    return this.secrets.has(key)
  }

  /**
   * Delete a specific secret
   */
  delete(key: string): boolean {
    return this.secrets.delete(key)
  }

  /**
   * Clear all secrets and destroy the vault
   * IMPORTANT: This is irreversible
   */
  destroy(): void {
    // Clear all secrets
    this.secrets.clear()

    // Overwrite encryption key with zeros
    this.encryptionKey.fill(0)

    this.isDestroyed = true
  }

  /**
   * Get vault status
   */
  getStatus(): { secretCount: number; isDestroyed: boolean } {
    return {
      secretCount: this.secrets.size,
      isDestroyed: this.isDestroyed
    }
  }
}

/**
 * Utility: Generate a secure random password
 */
export function generatePassword(length: number = 32): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const random = crypto.randomBytes(length)
  let password = ''

  for (let i = 0; i < length; i++) {
    password += charset[random[i] % charset.length]
  }

  return password
}

/**
 * Utility: Mask a secret value for display
 */
export function maskSecret(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars) {
    return '*'.repeat(value.length)
  }
  return value.slice(0, visibleChars) + '*'.repeat(value.length - visibleChars)
}
