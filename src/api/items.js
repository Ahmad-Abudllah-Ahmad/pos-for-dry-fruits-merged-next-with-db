import { request } from "./client";

/**
 * @param {number} workspaceId
 * @param {Record<string, unknown>} body
 */
export function createItem(workspaceId, body) {
  return request(`/workspaces/${workspaceId}/items`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 * @param {boolean | null} [isActive]
 */
export function listItems(workspaceId, isActive) {
  const q = isActive === null || isActive === undefined ? "" : `?is_active=${isActive}`;
  return request(`/workspaces/${workspaceId}/items${q}`);
}

/**
 * @param {number} workspaceId
 * @param {number} itemId
 * @param {Record<string, unknown>} body
 */
export function updateItem(workspaceId, itemId, body) {
  return request(`/workspaces/${workspaceId}/items/${itemId}`, { method: "PATCH", body });
}

/**
 * @param {number} workspaceId
 * @param {number} itemId
 */
export function deleteItem(workspaceId, itemId) {
  return request(`/workspaces/${workspaceId}/items/${itemId}`, { method: "DELETE" });
}
