import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse, serializeDecimal } from "@/lib/api-helpers";

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const { hashed_password, ...userResponse } = auth.user;
  return jsonResponse(serializeDecimal(userResponse));
}
