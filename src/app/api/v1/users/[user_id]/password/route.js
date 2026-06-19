import prisma from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const { user_id } = await params;
  const userId = parseInt(user_id, 10);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse("User not found", 404);

  const body = await parseBody(request);
  if (!body || !body.new_password) return errorResponse("new_password is required", 400);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { hashed_password: hashPassword(body.new_password) },
  });
  const { hashed_password, ...userResponse } = updated;
  return jsonResponse(serializeDecimal(userResponse));
}
