// utils/retryLogic.ts - Error Handling & Retry Logic

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context: string = "Operation"
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.delayMs;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`🔄 ${context} - Attempt ${attempt}/${config.maxRetries}`);
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.error(
        `❌ ${context} - Attempt ${attempt} failed:`,
        error instanceof Error ? error.message : error
      );

      if (attempt < config.maxRetries) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await sleep(delay);
        delay *= config.backoffMultiplier;
      }
    }
  }

  throw new Error(
    `${context} failed after ${config.maxRetries} attempts. Last error: ${lastError?.message}`
  );
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

/**
 * Check if error is recoverable (can be retried)
 */
export function isRecoverableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  
  // Network errors, timeouts, rate limits are recoverable
  const recoverablePatterns = [
    "network",
    "timeout",
    "rate limit",
    "503",
    "502",
    "429",
    "econnreset",
    "enotfound",
  ];
  
  return recoverablePatterns.some((pattern) => message.includes(pattern));
}

/**
 * Wrap agent execution with error handling
 */
export async function executeAgentSafely<T>(
  agentFn: () => Promise<T>,
  agentName: string,
  onProgress?: (step: string, progress: number) => void
): Promise<T> {
  try {
    onProgress?.(`Running ${agentName}`, 0);
    const result = await retryWithBackoff(agentFn, DEFAULT_RETRY_CONFIG, agentName);
    onProgress?.(`${agentName} completed`, 100);
    return result;
  } catch (error) {
    console.error(`🔴 ${agentName} failed permanently:`, error);
    throw new Error(`${agentName} failed: ${getErrorMessage(error)}`);
  }
}
