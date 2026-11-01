import { ApiError } from "./errors";

/**
 * Statuses worth a second attempt: the server stumbled, the request did not.
 * 4xx responses are answers, not hiccups, so they are never retried.
 */
export const RETRYABLE_STATUS_CODES = [500, 502, 503, 504];

export type RetryOptions = {
  /** Extra attempts after the first one. Defaults to 2 (3 tries total). */
  retryCount?: number;
  /** Delay between attempts, in milliseconds. Defaults to 300. */
  retryDelay?: number;
  /**
   * Only retry when the error carries one of these HTTP status codes.
   *
   * Omit to retry on any error.
   *
   * Errors with no status (network failures, timeouts, DNS errors) are always
   * retried, even when this is set: they cannot be classified, and they are
   * the most common reason to retry in the first place.
   */
  retryOn?: number | number[];
};

const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY = 300;

export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.status;

  if (typeof error !== "object" || error === null) return undefined;

  const err = error as { status?: unknown; statusCode?: unknown };

  if (typeof err.status === "number") return err.status;
  if (typeof err.statusCode === "number") return err.statusCode;

  return undefined;
}

function shouldRetry(error: unknown, retryOn: RetryOptions["retryOn"]) {
  if (retryOn === undefined) return true;

  const status = getErrorStatus(error);

  // Unclassifiable error (transport failure): retry it.
  if (status === undefined) return true;

  const allowed = Array.isArray(retryOn) ? retryOn : [retryOn];
  return allowed.includes(status);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs an async operation, retrying it when it fails.
 *
 * Only wrap operations that are safe to repeat. Retrying a non-idempotent
 * write (registering an account, sending a code) can duplicate the effect.
 *
 * @example
 * const res = await withRetry(() => authApi.refreshTokens({ refreshToken }), {
 *   retryOn: RETRYABLE_STATUS_CODES,
 * });
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelay = DEFAULT_RETRY_DELAY,
    retryOn,
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= retryCount || !shouldRetry(error, retryOn)) {
        throw error;
      }

      attempt += 1;
      await sleep(retryDelay);
    }
  }
}
