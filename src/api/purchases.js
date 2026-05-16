import { request } from "./client";

/**
 * @param {number} workspaceId
 * @param {Record<string, unknown>} body
 */
export function createPurchase(workspaceId, body) {
  return request(`/workspaces/${workspaceId}/purchases`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 * @param {number} purchaseId
 */
export function getPurchase(workspaceId, purchaseId) {
  return request(`/workspaces/${workspaceId}/purchases/${purchaseId}`);
}

/**
 * @param {number} workspaceId
 * @param {number} purchaseId
 * @param {Record<string, unknown>} body
 */
export function updatePurchase(workspaceId, purchaseId, body) {
  return request(`/workspaces/${workspaceId}/purchases/${purchaseId}`, { method: "PATCH", body });
}

/**
 * @param {number} workspaceId
 * @param {number} purchaseId
 * @param {Record<string, unknown>} body
 */
export function addPurchaseItem(workspaceId, purchaseId, body) {
  return request(`/workspaces/${workspaceId}/purchases/${purchaseId}/items`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 * @param {number} purchaseId
 * @param {{ items: Array<Record<string, unknown>> }} body
 */
export function addPurchaseItemsBatch(workspaceId, purchaseId, body) {
  return request(`/workspaces/${workspaceId}/purchases/${purchaseId}/items/batch`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 * @param {number} purchaseId
 * @param {number} purchaseItemId
 * @param {Record<string, unknown>} body
 */
export function updatePurchaseItem(workspaceId, purchaseId, purchaseItemId, body) {
  return request(`/workspaces/${workspaceId}/purchases/${purchaseId}/items/${purchaseItemId}`, { method: "PATCH", body });
}

/**
 * @param {number} workspaceId
 * @param {number} purchaseId
 * @param {number} purchaseItemId
 */
export function deletePurchaseItem(workspaceId, purchaseId, purchaseItemId) {
  return request(`/workspaces/${workspaceId}/purchases/${purchaseId}/items/${purchaseItemId}`, { method: "DELETE" });
}

/**
 * @param {number} workspaceId
 * @param {number} purchaseId
 */
export function finalizePurchase(workspaceId, purchaseId) {
  return request(`/workspaces/${workspaceId}/purchases/${purchaseId}/finalize`, { method: "POST" });
}

/**
 * @param {number} workspaceId
 * @param {number} purchaseId
 */
export function deletePurchase(workspaceId, purchaseId) {
  return request(`/workspaces/${workspaceId}/purchases/${purchaseId}`, { method: "DELETE" });
}

/**
 * @param {number} workspaceId
 */
export function listPurchases(workspaceId) {
  return request(`/workspaces/${workspaceId}/purchases`);
}

/**
 * @param {number} workspaceId
 * @param {number} purchaseId
 * @param {{ amount: string | number; payment_method?: string | null; note?: string | null }} body
 */
export function addPurchasePayment(workspaceId, purchaseId, body) {
  return request(`/workspaces/${workspaceId}/purchases/${purchaseId}/payments`, { method: "POST", body });
}
