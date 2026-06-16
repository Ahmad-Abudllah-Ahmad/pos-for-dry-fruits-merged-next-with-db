import { request } from "./client";

/**
 * @param {number} workspaceId
 */
export function listEmployees(workspaceId) {
  return request(`/workspaces/${workspaceId}/employees`);
}

/**
 * @param {number} workspaceId
 * @param {Record<string, unknown>} body
 */
export function createEmployee(workspaceId, body) {
  return request(`/workspaces/${workspaceId}/employees`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 * @param {number} employeeId
 * @param {Record<string, unknown>} body
 */
export function updateEmployee(workspaceId, employeeId, body) {
  return request(`/workspaces/${workspaceId}/employees/${employeeId}`, { method: "PATCH", body });
}

/**
 * @param {number} workspaceId
 * @param {number} employeeId
 */
export function deleteEmployee(workspaceId, employeeId) {
  return request(`/workspaces/${workspaceId}/employees/${employeeId}`, { method: "DELETE" });
}
