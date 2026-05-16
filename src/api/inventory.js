import { request } from "./client";

/**
 * @param {number} workspaceId
 * @param {{ item_id: number; quantity_grams: number; direction?: "warehouse_to_shop" | "shop_to_warehouse" }} body
 */
export function createTransfer(workspaceId, body) {
  return request(`/workspaces/${workspaceId}/inventory/transfers`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 * @param {{ direction: "warehouse_to_shop" | "shop_to_warehouse"; items: Array<{ item_id: number; quantity_grams: number }> }} body
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
 */
export function getInventoryAnalytics(workspaceId) {
  return request(`/workspaces/${workspaceId}/inventory/analytics`);
}
