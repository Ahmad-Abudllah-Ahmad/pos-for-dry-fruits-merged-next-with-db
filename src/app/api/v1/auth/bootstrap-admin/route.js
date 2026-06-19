import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function POST(request) {
  const body = await parseBody(request);
  if (!body) return errorResponse("Invalid request body", 400);

  const { name, cnic_number, phone_number, address, password } = body;
  if (!name || !cnic_number || !phone_number || !password) {
    return errorResponse("name, cnic_number, phone_number, and password are required", 400);
  }

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return errorResponse("Admin bootstrap is available only before users exist", 409);
  }

  const admin = await prisma.user.create({
    data: {
      name,
      cnic_number,
      phone_number,
      address: address || null,
      hashed_password: hashPassword(password),
      role: "Admin",
    },
  });

  return jsonResponse(serializeDecimal(admin), 201);
}
