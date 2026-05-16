import { request } from "./client";

/**
 * @param {Record<string, unknown>} body
 */
export function createWorkspace(body) {
  return request("/workspaces", { method: "POST", body });
}

export function listWorkspaces() {
  return request("/workspaces");
}

export function getMyWorkspaces() {
  return request("/workspaces/mine");
}

/**
 * @param {number} workspaceId
 * @param {Record<string, unknown>} body
 */
export function addWorkspaceMember(workspaceId, body) {
  return request(`/workspaces/${workspaceId}/members`, { method: "POST", body });
}

/**
 * @param {number} workspaceId
 */
export function listWorkspaceMembers(workspaceId) {
  return request(`/workspaces/${workspaceId}/members`);
}
