import { supabase } from "@/integrations/supabase/client";

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryableStatuses?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffFactor: 2,
  retryableStatuses: [429, 500, 502, 503, 504],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDelay(attempt: number, opts: Required<RetryOptions>): number {
  const jitter = Math.random() * 200;
  const delay = Math.min(
    opts.initialDelayMs * Math.pow(opts.backoffFactor, attempt) + jitter,
    opts.maxDelayMs
  );
  return delay;
}

export async function invokeWithRetry<T = unknown>(
  functionName: string,
  body: Record<string, unknown>,
  options?: RetryOptions
): Promise<{ data: T; error: null } | { data: null; error: Error }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
      });

      if (error) {
        const status = (error as any)?.status ?? (error as any)?.code;
        const isRetryable =
          typeof status === "number" && opts.retryableStatuses.includes(status);

        if (isRetryable && attempt < opts.maxRetries) {
          const delay = getDelay(attempt, opts);
          console.warn(
            `[EdgeRetry] ${functionName} attempt ${attempt + 1} failed (status ${status}), retrying in ${Math.round(delay)}ms...`
          );
          await sleep(delay);
          continue;
        }

        return { data: null, error: new Error(error.message || String(error)) };
      }

      return { data: data as T, error: null };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < opts.maxRetries) {
        const delay = getDelay(attempt, opts);
        console.warn(
          `[EdgeRetry] ${functionName} attempt ${attempt + 1} threw, retrying in ${Math.round(delay)}ms...`,
          lastError.message
        );
        await sleep(delay);
      }
    }
  }

  return {
    data: null,
    error: lastError ?? new Error(`${functionName} failed after ${opts.maxRetries} retries`),
  };
}
