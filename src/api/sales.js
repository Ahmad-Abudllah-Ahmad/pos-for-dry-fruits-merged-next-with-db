import { request } from "./client";

/**
 * @param {number} workspaceId
 * @param {Record<string, unknown>} [body] — discount_amount optional; defaults on server
 */
export function createSale(workspaceId, body) {
  return request(`/workspaces/${workspaceId}/sales`, { method: "POST", body: body ?? {} });
}

/**
 * @param {number} workspaceId
 * @param {number} saleId
 * @param {{ item_id: number; subledger_id?: number | null; quantity_grams: number; unit_price: string | number }} body
 */
export function addSaleItem(workspaceId, saleId, body) {
  return request(`/workspaces/${workspaceId}/sales/${saleId}/items`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 * @param {number} saleId
 * @param {number} saleItemId
 * @param {{ item_id: number; subledger_id?: number | null; quantity_grams: number; unit_price: string | number }} body
 */
export function updateSaleItem(workspaceId, saleId, saleItemId, body) {
  return request(`/workspaces/${workspaceId}/sales/${saleId}/items/${saleItemId}`, { method: "PATCH", body });
}

/**
 * @param {number} workspaceId
 * @param {number} saleId
 * @param {number} saleItemId
 */
export function deleteSaleItem(workspaceId, saleId, saleItemId) {
  return request(`/workspaces/${workspaceId}/sales/${saleId}/items/${saleItemId}`, { method: "DELETE" });
}

/**
 * @param {number} workspaceId
 * @param {number} saleId
 * @param {{ discount_amount: string | number }} body
 */
export function updateSaleDiscount(workspaceId, saleId, body) {
  return request(`/workspaces/${workspaceId}/sales/${saleId}/discount`, { method: "PATCH", body });
}

/**
 * @param {number} workspaceId
 * @param {number} saleId
 */
export function finalizeSale(workspaceId, saleId) {
  return request(`/workspaces/${workspaceId}/sales/${saleId}/finalize`, { method: "POST" });
}

/**
 * @param {number} workspaceId
 * @param {number} saleId
 */
export function getSale(workspaceId, saleId) {
  return request(`/workspaces/${workspaceId}/sales/${saleId}`);
}

/**
 * @param {number} workspaceId
 * @param {number} saleId
 */
export function deleteSale(workspaceId, saleId) {
  return request(`/workspaces/${workspaceId}/sales/${saleId}`, { method: "DELETE" });
}

/**
 * @param {number} workspaceId
 */
export function listSales(workspaceId) {
  return request(`/workspaces/${workspaceId}/sales`);
}
