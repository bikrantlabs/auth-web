import "server-only";

import { cookies } from "next/headers";

import { env } from "@/lib/env";

import { ACCESS_TOKEN_COOKIE_KEY } from "../cookie-config";
import { ApiError } from "./errors";

type Query = Record<string, string | number | boolean | undefined | null>;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Query;
  body?: unknown;
  headers?: HeadersInit;
  // Next.js caching
  tags?: string[];
  revalidate?: number | false;
  cache?: RequestCache;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: Query) {
  const baseUrl = env.API_URL.endsWith("/") ? env.API_URL : `${env.API_URL}/`;
  const relativePath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(relativePath, baseUrl);

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    query,
    body,
    headers,
    tags,
    revalidate,
    cache,
    signal,
  } = opts;

  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE_KEY)?.value;
  const isFormData = body instanceof FormData;

  const res = await fetch(buildUrl(path, query), {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined &&
        !isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body:
      body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    cache,
    next: { tags, revalidate },
    signal: signal ?? AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const errBody: unknown = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(
    path: string,
    body?: unknown,
    opts?: Omit<RequestOptions, "method" | "body">,
  ) => request<T>(path, { ...opts, method: "POST", body }),
  put: <T>(
    path: string,
    body?: unknown,
    opts?: Omit<RequestOptions, "method" | "body">,
  ) => request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T>(
    path: string,
    body?: unknown,
    opts?: Omit<RequestOptions, "method" | "body">,
  ) => request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
