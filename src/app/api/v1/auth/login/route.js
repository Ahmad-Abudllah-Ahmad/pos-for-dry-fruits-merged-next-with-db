import prisma from "@/lib/prisma";
import { verifyPassword, createAccessToken } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function POST(request) {
  const body = await parseBody(request);
  if (!body) return errorResponse("Invalid request body", 400);

  const { phone_number, password } = body;
  if (!phone_number || !password) {
    return errorResponse("phone_number and password are required", 400);
  }

  const user = await prisma.user.findUnique({ where: { phone_number } });
  if (!user || !verifyPassword(password, user.hashed_password)) {
    return errorResponse("Invalid phone number or password", 401);
  }

  if (!user.is_active) {
    return errorResponse("User account is inactive", 403);
  }

  const token = createAccessToken(String(user.id), { role: user.role });
  const { hashed_password, ...userResponse } = user;

  return jsonResponse({
    access_token: token,
    token_type: "bearer",
    user: serializeDecimal(userResponse),
  });
}
