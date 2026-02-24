/**
 * Retry utility with exponential backoff for MCP server API calls.
 * Retries on transient HTTP errors (429, 502, 503, 504) by default.
 */

export class RetryableError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelayMs?: number
    retryOn?: number[]
    label?: string
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    retryOn = [429, 502, 503, 504],
    label = 'API call'
  } = options

  let lastError: Error = new Error('No attempts made')

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      const status = err.status || err.statusCode

      if (attempt < maxRetries && (!status || retryOn.includes(status))) {
        const delay = initialDelayMs * Math.pow(2, attempt)
        console.error(`[Retry] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`)
        await new Promise(r => setTimeout(r, delay))
        continue
      }

      throw err
    }
  }

  throw lastError
}

/**
 * Wrapper for fetch that throws RetryableError with the HTTP status code,
 * enabling withRetry to make status-based retry decisions.
 */
export async function fetchWithRetrySupport(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, options)
  if (!response.ok) {
    const body = await response.text()
    let message: string
    try {
      const json = JSON.parse(body)
      message = json.message || json.error || body
    } catch {
      message = body
    }
    throw new RetryableError(message, response.status)
  }
  return response
}
