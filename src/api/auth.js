import { request } from "./client";

/**
 * @param {{ phone_number: string; password: string }} body
 */
export function login(body) {
  return request("/auth/login", { method: "POST", body, token: null });
}

/**
 * @param {Record<string, unknown>} body
 */
export function bootstrapAdmin(body) {
  return request("/auth/bootstrap-admin", { method: "POST", body, token: null });
}
