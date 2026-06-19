import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonResponse, errorResponse, serializeDecimal } from "@/lib/api-helpers";

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const { user_id } = await params;
  const userId = parseInt(user_id, 10);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse("User not found", 404);
  if (user.is_active) return errorResponse("User is already active", 409);

  const existing = await prisma.user.findFirst({
    where: {
      id: { not: userId },
      OR: [{ cnic_number: user.cnic_number }, { phone_number: user.phone_number }],
    },
  });
  if (existing) return errorResponse("CNIC number or phone number already exists", 409);

  const updated = await prisma.user.update({ where: { id: userId }, data: { is_active: true } });
  const { hashed_password, ...userResponse } = updated;
  return jsonResponse(serializeDecimal(userResponse));
}
