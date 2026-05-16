/** @param {Record<string, string> | null | undefined} n */
export function getItemName(n) {
  if (!n || typeof n !== "object") return "-";
  const en = typeof n.en === "string" ? n.en.trim() : "";
  const ur = typeof n.ur === "string" ? n.ur.trim() : "";
  return en || ur || "-";
}
