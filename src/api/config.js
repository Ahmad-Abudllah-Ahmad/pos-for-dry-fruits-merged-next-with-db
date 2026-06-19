export const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL) ||
  "";

export const API_V1 = `${API_BASE}/api/v1`;
