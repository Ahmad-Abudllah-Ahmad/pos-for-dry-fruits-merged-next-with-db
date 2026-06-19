import { NextResponse } from "next/server";

if (typeof BigInt.prototype.toJSON !== "function") {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

export function jsonResponse(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(detail, status = 400) {
  return NextResponse.json({ detail }, { status });
}

export async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function getSearchParams(request) {
  return new URL(request.url).searchParams;
}

/** Convert Decimal fields to numbers for JSON serialization */
export function serializeDecimal(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "object" && typeof obj.toNumber === "function") {
    return parseFloat(obj.toString());
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeDecimal);
  }
  if (typeof obj === "object" && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeDecimal(value);
    }
    return result;
  }
  return obj;
}

/** Format a purchase slip for API response (adds paid_amount, remaining_amount) */
export function formatPurchaseResponse(purchase) {
  const p = serializeDecimal(purchase);
  const paidAmount = (p.payments || []).reduce((sum, pay) => sum + (pay.amount || 0), 0);
  const remaining = Math.max(0, (p.total_amount || 0) - paidAmount);
  return { ...p, paid_amount: paidAmount, remaining_amount: remaining };
}

/** Format a ledger entry for API response (adds remaining_amount) */
export function formatLedgerResponse(entry) {
  const e = serializeDecimal(entry);
  const remaining = Math.max(0, (e.total_amount || 0) - (e.paid_amount || 0));
  return { ...e, remaining_amount: remaining, dealer_name: e.seller_name, dealer_phone: e.seller_phone, note: e.notes };
}
