/**
 * Enterprise-grade request retry logic with exponential backoff
 * Handles network failures, timeouts, and transient errors
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeoutMs: number;
  retryableStatusCodes: number[];
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  timeoutMs: 30000, // 30 seconds
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // Client timeout, rate limit, server errors
};

class RetryableError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = true
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

/**
 * Determines if an error is retryable
 */
function isRetryable(error: any, statusCode?: number, config: RetryConfig = DEFAULT_CONFIG): boolean {
  // Network errors are always retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Timeout errors are retryable
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return true;
  }
  
  // Check status codes
  if (statusCode && config.retryableStatusCodes.includes(statusCode)) {
    return true;
  }
  
  return false;
}

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
  return Math.min(delay + jitter, config.maxDelayMs);
}

/**
 * Execute fetch with automatic retry logic
 */
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit & { timeout?: number } = {},
  customConfig: Partial<RetryConfig> = {}
): Promise<T> {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  let lastError: Error | null = null;
  let lastStatusCode: number | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const timeoutMs = options.timeout || config.timeoutMs;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        lastStatusCode = response.status;

        // Handle successful response
        if (response.ok) {
          const data = await response.json();
          return data;
        }

        // Handle error responses
        const errorText = await response.text();
        
        if (isRetryable(null, response.status, config)) {
          lastError = new RetryableError(
            `HTTP ${response.status}: ${errorText}`,
            response.status,
            true
          );
          
          if (attempt < config.maxRetries) {
            const delay = calculateDelay(attempt, config);
            console.warn(
              `í´„ Request failed (attempt ${attempt + 1}/${config.maxRetries + 1}), ` +
              `retrying in ${delay.toFixed(0)}ms: ${url}`
            );
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      lastError = error;

      // Check if retryable
      if (!isRetryable(error, lastStatusCode || undefined, config) || attempt === config.maxRetries) {
        console.error(`âŒ Request failed after ${attempt + 1} attempts: ${url}`, error);
        throw error;
      }

      // Retry with exponential backoff
      const delay = calculateDelay(attempt, config);
      console.warn(
        `í´„ Request failed (attempt ${attempt + 1}/${config.maxRetries + 1}), ` +
        `retrying in ${delay.toFixed(0)}ms: ${url}`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${config.maxRetries + 1} attempts`);
}

/**
 * Create a fetch wrapper with retry logic for a specific service
 */
export function createRetryableFetch(customConfig: Partial<RetryConfig> = {}) {
  return <T,>(url: string, options?: RequestInit) =>
    fetchWithRetry<T>(url, options, customConfig);
}

/**
 * Retry an async function with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  customConfig: Partial<RetryConfig> = {}
): Promise<T> {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (!isRetryable(error) || attempt === config.maxRetries) {
        throw error;
      }

      const delay = calculateDelay(attempt, config);
      console.warn(
        `í´„ Operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}), ` +
        `retrying in ${delay.toFixed(0)}ms`
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
