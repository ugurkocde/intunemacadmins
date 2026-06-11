import {
  HTTP_BACKOFF_MS,
  HTTP_RETRIES,
  HTTP_TIMEOUT_MS,
  USER_AGENT,
} from "../config";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
  }
}

interface FetchOptions {
  headers?: Record<string, string>;
  method?: string;
  body?: string;
  timeoutMs?: number;
  retries?: number;
}

export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const retries = options.retries ?? HTTP_RETRIES;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        body: options.body,
        headers: { "User-Agent": USER_AGENT, ...options.headers },
        redirect: "follow",
        signal: AbortSignal.timeout(options.timeoutMs ?? HTTP_TIMEOUT_MS),
      });
      // Retry on 429/5xx; other non-2xx are permanent for our sources.
      if (response.ok) return response;
      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        lastError = new HttpError(response.status, url);
      } else {
        throw new HttpError(response.status, url);
      }
    } catch (error) {
      if (error instanceof HttpError && attempt >= retries) throw error;
      lastError = error;
      if (attempt >= retries) break;
    }
    await sleep(HTTP_BACKOFF_MS[Math.min(attempt, HTTP_BACKOFF_MS.length - 1)]);
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function fetchText(
  url: string,
  options: FetchOptions = {},
): Promise<string> {
  const response = await fetchWithRetry(url, options);
  return response.text();
}

export async function fetchJson<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const response = await fetchWithRetry(url, options);
  return (await response.json()) as T;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
