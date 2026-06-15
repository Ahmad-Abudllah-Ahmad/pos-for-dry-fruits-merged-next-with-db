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
 * @param {{ page?: number; pageSize?: number; itemId?: number | null; isActive?: boolean | null }} [filters]
 */
export function listSubledgersPage(workspaceId, filters = {}) {
  const qs = new URLSearchParams();
  if (filters.page != null) qs.set("page", String(filters.page));
  if (filters.pageSize != null) qs.set("page_size", String(filters.pageSize));
  if (filters.itemId != null) qs.set("item_id", String(filters.itemId));
  if (filters.isActive != null) qs.set("is_active", String(filters.isActive));
  const q = qs.toString();
  return request(`/workspaces/${workspaceId}/subledgers/paged${q ? `?${q}` : ""}`);
}

/**
 * @param {number} workspaceId
 * @param {number} subledgerId
 * @param {Record<string, unknown>} body
 */
export function updateSubledger(workspaceId, subledgerId, body) {
  return request(`/workspaces/${workspaceId}/subledgers/${subledgerId}`, { method: "PATCH", body });
}

/**
 * @param {number} workspaceId
 * @param {number} subledgerId
 */
export function deleteSubledger(workspaceId, subledgerId) {
  return request(`/workspaces/${workspaceId}/subledgers/${subledgerId}`, { method: "DELETE" });
}
