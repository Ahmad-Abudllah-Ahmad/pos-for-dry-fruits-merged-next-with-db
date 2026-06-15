import { request } from "./client";

/**
 * @param {number} workspaceId
 * @param {{ item_id: number; subledger_id?: number | null; quantity?: number | null; quantity_grams: number; direction?: "warehouse_to_shop" | "shop_to_warehouse" }} body
 */
export function createTransfer(workspaceId, body) {
  return request(`/workspaces/${workspaceId}/inventory/transfers`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 * @param {{ direction: "warehouse_to_shop" | "shop_to_warehouse"; items: Array<{ item_id: number; subledger_id?: number | null; quantity?: number | null; quantity_grams: number }> }} body
 */
export function createTransferBatch(workspaceId, body) {
  return request(`/workspaces/${workspaceId}/inventory/transfers/batch`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 */
export function listMovements(workspaceId) {
  return request(`/workspaces/${workspaceId}/inventory/movements`);
}

/**
 * @param {number} workspaceId
 * @param {"shop"|"warehouse"|null|undefined} locationType
 */
export function listStock(workspaceId, locationType) {
  const q =
    locationType === "shop" || locationType === "warehouse"
      ? `?location_type=${locationType}`
      : "";
  return request(`/workspaces/${workspaceId}/inventory/stock${q}`);
}

/**
 * @param {number} workspaceId
 * @param {{ locationType?: "shop" | "warehouse" | null; page?: number; pageSize?: number }} [filters]
 */
export function listStockPage(workspaceId, filters = {}) {
  const qs = new URLSearchParams();
  if (filters.locationType === "shop" || filters.locationType === "warehouse") {
    qs.set("location_type", filters.locationType);
  }
  if (filters.page != null) qs.set("page", String(filters.page));
  if (filters.pageSize != null) qs.set("page_size", String(filters.pageSize));
  const q = qs.toString();
  return request(`/workspaces/${workspaceId}/inventory/stock/paged${q ? `?${q}` : ""}`);
}

/**
 * @param {number} workspaceId
 */
export function getInventoryAnalytics(workspaceId) {
  return request(`/workspaces/${workspaceId}/inventory/analytics`);
}
