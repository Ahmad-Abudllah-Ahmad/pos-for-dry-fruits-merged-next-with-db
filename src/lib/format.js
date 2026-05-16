/** @param {string|number} d */
export function money(d) {
  if (d === null || d === undefined) return "—";
  const n = typeof d === "string" ? parseFloat(d) : Number(d);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(n);
}

/** @param {number} grams @param {"gram"|"kg"} [displayUnit] */
export function formatWeight(grams, displayUnit = "gram") {
  if (grams == null) return "—";
  if (displayUnit === "kg") {
    return `${(grams / 1000).toFixed(3)} kg`;
  }
  return `${grams.toLocaleString()} g`;
}
