import prisma from "@/lib/prisma";
import { requireAdmin, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const employees = await prisma.employee.findMany({
    where: { workspace_id: workspaceId },
    orderBy: [{ name: "asc" }, { created_at: "desc" }],
  });
  return jsonResponse(serializeDecimal(employees));
}

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const body = await parseBody(request);
  if (!body || !body.name) return errorResponse("name is required", 400);

  const employee = await prisma.employee.create({
    data: {
      workspace_id: workspaceId,
      name: body.name.trim(),
      phone_number: body.phone_number?.trim() || null,
      cnic_number: body.cnic_number?.trim() || null,
      address: body.address?.trim() || null,
      designation: body.designation?.trim() || null,
    },
  });
  return jsonResponse(serializeDecimal(employee), 201);
}
