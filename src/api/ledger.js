import { request } from "./client";

/**
 * @param {number} workspaceId
 * @param {Record<string, unknown>} body
 */
export function createLedger(workspaceId, body) {
  return request(`/workspaces/${workspaceId}/ledger`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 */
export function listLedger(workspaceId) {
  return request(`/workspaces/${workspaceId}/ledger`);
}

/**
 * @param {number} workspaceId
 * @param {number} ledgerId
 */
export function getLedger(workspaceId, ledgerId) {
  return request(`/workspaces/${workspaceId}/ledger/${ledgerId}`);
}

/**
 * @param {number} workspaceId
 * @param {number} ledgerId
 * @param {Record<string, unknown>} body
 */
export function updateLedger(workspaceId, ledgerId, body) {
  return request(`/workspaces/${workspaceId}/ledger/${ledgerId}`, { method: "PATCH", body });
}

/**
 * @param {number} workspaceId
 * @param {number} ledgerId
 * @param {{ items: Array<Record<string, unknown>> }} body
 */
export function addLedgerItemsBatch(workspaceId, ledgerId, body) {
  return request(`/workspaces/${workspaceId}/ledger/${ledgerId}/items/batch`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 * @param {number} ledgerId
 * @param {number} ledgerItemId
 * @param {Record<string, unknown>} body
 */
export function updateLedgerItem(workspaceId, ledgerId, ledgerItemId, body) {
  return request(`/workspaces/${workspaceId}/ledger/${ledgerId}/items/${ledgerItemId}`, { method: "PATCH", body });
}

/**
 * @param {number} workspaceId
 * @param {number} ledgerId
 * @param {number} ledgerItemId
 */
export function deleteLedgerItem(workspaceId, ledgerId, ledgerItemId) {
  return request(`/workspaces/${workspaceId}/ledger/${ledgerId}/items/${ledgerItemId}`, { method: "DELETE" });
}

/**
 * @param {number} workspaceId
 * @param {number} ledgerId
 */
export function finalizeLedger(workspaceId, ledgerId) {
  return request(`/workspaces/${workspaceId}/ledger/${ledgerId}/finalize`, { method: "POST" });
}

/**
 * @param {number} workspaceId
 * @param {number} ledgerId
 */
export function deleteLedger(workspaceId, ledgerId) {
  return request(`/workspaces/${workspaceId}/ledger/${ledgerId}`, { method: "DELETE" });
}

/**
 * @param {number} workspaceId
 * @param {number} ledgerId
 * @param {{ amount: string | number; payment_method?: string | null; note?: string | null }} body
 */
export function addLedgerPayment(workspaceId, ledgerId, body) {
  return request(`/workspaces/${workspaceId}/ledger/${ledgerId}/payments`, { method: "POST", body });
}
