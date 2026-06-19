import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const { user_id } = await params;
  const userId = parseInt(user_id, 10);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse("User not found", 404);

  const body = await parseBody(request);
  if (!body) return errorResponse("Invalid request body", 400);

  const updates = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.address !== undefined) updates.address = body.address;
  if (body.cnic_number !== undefined) updates.cnic_number = body.cnic_number;
  if (body.phone_number !== undefined) updates.phone_number = body.phone_number;

  if (updates.cnic_number || updates.phone_number) {
    const existing = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [
          ...(updates.cnic_number ? [{ cnic_number: updates.cnic_number }] : []),
          ...(updates.phone_number ? [{ phone_number: updates.phone_number }] : []),
        ],
      },
    });
    if (existing) return errorResponse("CNIC number or phone number already exists", 409);
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: updates });
  const { hashed_password, ...userResponse } = updated;
  return jsonResponse(serializeDecimal(userResponse));
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const { user_id } = await params;
  const userId = parseInt(user_id, 10);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return errorResponse("User not found", 404);

  if (user.role === "Admin") return errorResponse("Admin users cannot be deactivated", 400);
  if (!user.is_active) return errorResponse("User is already inactive", 409);

  const updated = await prisma.user.update({ where: { id: userId }, data: { is_active: false } });
  const { hashed_password, ...userResponse } = updated;
  return jsonResponse(serializeDecimal(userResponse));
}
