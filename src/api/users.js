import { request } from "./client";

export function getMe() {
  return request("/users/me");
}

/**
 * @param {Record<string, unknown>} body
 */
export function createUser(body) {
  return request("/users", { method: "POST", body });
}

export function listUsers() {
  return request("/users");
}

/**
 * @param {number} userId
 * @param {Record<string, unknown>} body
 */
export function updateUser(userId, body) {
  return request(`/users/${userId}`, { method: "PATCH", body });
}

/**
 * @param {number} userId
 * @param {{ new_password: string }} body
 */
export function setUserPassword(userId, body) {
  return request(`/users/${userId}/password`, { method: "PATCH", body });
}
