import { request } from "./client";

/**
 * @param {number} workspaceId
 * @param {Record<string, unknown>} body
 */
export function createExpense(workspaceId, body) {
  return request(`/workspaces/${workspaceId}/expenses`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 */
export function listExpenses(workspaceId) {
  return request(`/workspaces/${workspaceId}/expenses`);
}

/**
 * @param {number} workspaceId
 * @param {number} expenseId
 */
export function getExpense(workspaceId, expenseId) {
  return request(`/workspaces/${workspaceId}/expenses/${expenseId}`);
}

/**
 * @param {number} workspaceId
 * @param {number} expenseId
 * @param {Record<string, unknown>} body
 */
export function updateExpense(workspaceId, expenseId, body) {
  return request(`/workspaces/${workspaceId}/expenses/${expenseId}`, { method: "PATCH", body });
}

/**
 * @param {number} workspaceId
 * @param {number} expenseId
 */
export function finalizeExpense(workspaceId, expenseId) {
  return request(`/workspaces/${workspaceId}/expenses/${expenseId}/finalize`, { method: "POST" });
}

/**
 * @param {number} workspaceId
 * @param {number} expenseId
 */
export function deleteExpense(workspaceId, expenseId) {
  return request(`/workspaces/${workspaceId}/expenses/${expenseId}`, { method: "DELETE" });
}
