import { jsonResponse } from "@/lib/api-helpers";

export async function GET() {
  return jsonResponse({
    status: "ok",
    service: "POS Backend",
    version: "0.1.0",
  });
}
