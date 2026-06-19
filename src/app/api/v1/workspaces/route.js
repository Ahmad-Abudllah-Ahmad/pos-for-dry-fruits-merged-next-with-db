import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const workspaces = await prisma.workspace.findMany({ orderBy: { created_at: "desc" } });
  return jsonResponse(serializeDecimal(workspaces));
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const body = await parseBody(request);
  if (!body || !body.name) return errorResponse("name is required", 400);

  const workspace = await prisma.workspace.create({
    data: {
      name: body.name,
      description: body.description || null,
      created_by_id: auth.user.id,
    },
  });

  // Add admin as workspace member
  await prisma.workspaceMember.create({
    data: { workspace_id: workspace.id, user_id: auth.user.id, role: "Admin" },
  });

  // Create default stock locations
  const existingTypes = await prisma.stockLocation.findMany({
    where: { workspace_id: workspace.id },
    select: { type: true },
  });
  const existingSet = new Set(existingTypes.map((l) => l.type));
  if (!existingSet.has("warehouse")) {
    await prisma.stockLocation.create({ data: { workspace_id: workspace.id, name: "Warehouse", type: "warehouse" } });
  }
  if (!existingSet.has("shop")) {
    await prisma.stockLocation.create({ data: { workspace_id: workspace.id, name: "Shop", type: "shop" } });
  }

  return jsonResponse(serializeDecimal(workspace), 201);
}
