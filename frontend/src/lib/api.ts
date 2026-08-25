/**
 * Typed API client for the Django backend.
 *
 * - Unwraps the standard { success, message, data } envelope.
 * - Injects the JWT access token; on 401 retries once via /auth/refresh.
 * - Throws ApiError with a user-friendly message (already produced by the
 *   backend's exception handler).
 */

const BASE = "/api/v1";

export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: { code: string; details: Array<{ field?: string | null; message: string }> };
}

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors: Record<string, string>;

  constructor(status: number, message: string, code = "ERROR", details: Array<{ field?: string | null; message: string }> = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = {};
    for (const detail of details) {
      if (detail.field) {
        this.fieldErrors[detail.field] ??= detail.message;
        if (!this.message || this.message === "Request failed") {
          this.message = detail.message;
        }
      }
    }
  }
}

const STORAGE = {
  access: "wandersync.access",
  refresh: "wandersync.refresh",
};

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE.access);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(STORAGE.access, access);
  localStorage.setItem(STORAGE.refresh, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE.access);
  localStorage.removeItem(STORAGE.refresh);
}

export function hasSession(): boolean {
  return Boolean(localStorage.getItem(STORAGE.refresh));
}

async function refreshTokens(): Promise<boolean> {
  const refresh = localStorage.getItem(STORAGE.refresh);
  if (!refresh) return false;
  try {
    const response = await fetch(`${BASE}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) {
      clearTokens();
      return false;
    }
    const body = (await response.json()) as { access?: string; refresh?: string };
    if (!body.access) return false;
    setTokens(body.access, body.refresh ?? refresh);
    return true;
  } catch {
    return false;
  }
}

async function rawRequest<T>(
  path: string,
  options: RequestInit & { retried?: boolean } = {},
): Promise<Envelope<T>> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Network error — is the server running?", "NETWORK_ERROR");
  }

  // Single transparent refresh attempt on expired access tokens.
  if (response.status === 401 && !options.retried && hasSession()) {
    if (await refreshTokens()) {
      return rawRequest<T>(path, { ...options, retried: true });
    }
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    /* non-JSON body */
  }
  const envelope = (payload ?? {}) as Envelope<T>;
  if (!response.ok || envelope.success === false) {
    throw new ApiError(
      response.status,
      envelope.message ?? "Something went wrong. Please try again.",
      envelope.error?.code,
      envelope.error?.details,
    );
  }
  return envelope;
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const envelope = await rawRequest<T>(path, { method: "GET" });
    return envelope.data;
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    const envelope = await rawRequest<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return envelope.data;
  },
  async patch<T>(path: string, body: unknown): Promise<T> {
    const envelope = await rawRequest<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return envelope.data;
  },
  async delete<T>(path: string): Promise<T> {
    const envelope = await rawRequest<T>(path, { method: "DELETE" });
    return envelope.data;
  },
  /**
   * Authenticated binary download (PDF/ICS/CSV). Returns the raw Response so
   * callers can stream it to disk; rejects with ApiError on errors.
   */
  async download(path: string, filename: string): Promise<void> {
    const headers = new Headers();
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    let response: Response;
    try {
      response = await fetch(`${BASE}${path}`, { headers });
    } catch {
      throw new ApiError(0, "Network error — could not start the download.", "NETWORK_ERROR");
    }
    if (!response.ok) {
      throw new ApiError(response.status, "The download failed.", "DOWNLOAD_ERROR");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },
};
