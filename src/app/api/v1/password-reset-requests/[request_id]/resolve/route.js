import prisma from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const { request_id } = await params;
  const requestId = parseInt(request_id, 10);

  const resetRequest = await prisma.passwordResetRequest.findUnique({ where: { id: requestId } });
  if (!resetRequest) return errorResponse("Password reset request not found", 404);
  if (resetRequest.status === "resolved") return errorResponse("Password reset request is already resolved", 409);

  const body = await parseBody(request);
  if (!body || !body.new_password) return errorResponse("new_password is required", 400);

  const user = await prisma.user.findUnique({ where: { id: resetRequest.user_id } });
  if (!user) return errorResponse("User not found", 404);

  await prisma.user.update({
    where: { id: resetRequest.user_id },
    data: { hashed_password: hashPassword(body.new_password) },
  });

  const updated = await prisma.passwordResetRequest.update({
    where: { id: requestId },
    data: { status: "resolved", resolved_by_id: auth.user.id, resolved_at: new Date() },
  });

  return jsonResponse(serializeDecimal(updated));
}
