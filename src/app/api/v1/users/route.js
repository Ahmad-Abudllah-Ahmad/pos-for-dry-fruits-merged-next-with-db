import prisma from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const users = await prisma.user.findMany({ orderBy: { created_at: "desc" } });
  return jsonResponse(users.map((u) => { const { hashed_password, ...r } = u; return serializeDecimal(r); }));
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const body = await parseBody(request);
  if (!body) return errorResponse("Invalid request body", 400);

  const { name, cnic_number, phone_number, address, password, role, workspace_id } = body;
  if (!name || !cnic_number || !phone_number || !password) {
    return errorResponse("name, cnic_number, phone_number, and password are required", 400);
  }

  if (role === "Admin") {
    return errorResponse("Use bootstrap to create the first admin. Admin-created users must use role user.", 400);
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ cnic_number }, { phone_number }] },
  });
  if (existing) return errorResponse("CNIC number or phone number already exists", 409);

  const user = await prisma.user.create({
    data: {
      name,
      cnic_number,
      phone_number,
      address: address || null,
      hashed_password: hashPassword(password),
      role: "user",
    },
  });

  if (workspace_id) {
    const ws = await prisma.workspace.findUnique({ where: { id: workspace_id } });
    if (!ws) return errorResponse("Workspace not found", 404);
    await prisma.workspaceMember.create({
      data: { workspace_id, user_id: user.id, role: "user" },
    });
  }

  const { hashed_password: _, ...userResponse } = user;
  return jsonResponse(serializeDecimal(userResponse), 201);
}
