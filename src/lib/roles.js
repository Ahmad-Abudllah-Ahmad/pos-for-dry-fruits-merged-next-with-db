/** @param {{ role?: string } | null | undefined} u */
export function isAdminUser(u) {
  return u?.role === "Admin";
}

export const ROLES = {
  ADMIN: "Admin",
  USER: "user",
};
