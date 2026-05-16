import { request } from "./client";

/**
 * @param {number} workspaceId
 * @param {Record<string, unknown>} body
 */
export function createSubledger(workspaceId, body) {
  return request(`/workspaces/${workspaceId}/subledgers`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 * @param {{ itemId?: number | null; isActive?: boolean | null }} [filters]
 */
export function listSubledgers(workspaceId, filters = {}) {
  const qs = new URLSearchParams();
  if (filters.itemId != null) qs.set("item_id", String(filters.itemId));
  if (filters.isActive != null) qs.set("is_active", String(filters.isActive));
  const q = qs.toString();
  return request(`/workspaces/${workspaceId}/subledgers${q ? `?${q}` : ""}`);
}

/**
 * @param {number} workspaceId
 * @param {number} subledgerId
 * @param {Record<string, unknown>} body
 */
export function updateSubledger(workspaceId, subledgerId, body) {
  return request(`/workspaces/${workspaceId}/subledgers/${subledgerId}`, { method: "PATCH", body });
}
