import { API_V1 } from "./config";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

/**
 * @typedef {{ method?: string; body?: unknown; headers?: Record<string, string> }} RequestOptions
 */

class ApiError extends Error {
  /** @param {number} status @param {string} message @param {unknown} [body] */
  constructor(status, message, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export const BASE_URL = "/api/v1";

/**
 * @param {string} path
 * @param {RequestOptions & { token?: string | null }} [options]
 */
export async function request(path, options = {}) {
  const { method = "GET", body, headers = {} } = options;
  const token =
    "token" in options
      ? options.token
      : useAuthStore.getState().accessToken;

  const h = { ...headers };
  if (body !== undefined && body !== null && !h["Content-Type"]) {
    h["Content-Type"] = "application/json";
  }
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_V1}${path}`, {
    method,
    headers: h,
    body: body === undefined || body === null ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    let msg = res.statusText;
    if (typeof data === "object" && data && "detail" in data) {
      const d = /** @type {{ detail: unknown }} */ (data).detail;
      if (Array.isArray(d)) {
        msg = d.map((e) => (typeof e === "object" && e && "msg" in e ? e.msg : String(e))).join(", ");
      } else {
        msg = String(d);
      }
    }
    if (res.status === 401) {
      useAuthStore.getState().clearSession();
      useWorkspaceStore.getState().clear();
    }
    throw new ApiError(res.status, msg || "Request failed", data);
  }

  return data;
}

export { ApiError };
