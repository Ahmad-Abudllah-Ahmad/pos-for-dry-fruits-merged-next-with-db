import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) return errorResponse("Workspace not found", 404);

  const members = await prisma.workspaceMember.findMany({
    where: { workspace_id: workspaceId },
    include: { user: true },
    orderBy: { created_at: "desc" },
  });
  return jsonResponse(members.map((m) => {
    const { user, ...rest } = serializeDecimal(m);
    const { hashed_password, ...safeUser } = user || {};
    return { ...rest, user: safeUser };
  }));
}

export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) return errorResponse("Workspace not found", 404);

  const body = await parseBody(request);
  if (!body || !body.user_id) return errorResponse("user_id is required", 400);

  const user = await prisma.user.findUnique({ where: { id: body.user_id } });
  if (!user) return errorResponse("User not found", 404);

  const existing = await prisma.workspaceMember.findUnique({
    where: { uq_workspace_user: { workspace_id: workspaceId, user_id: body.user_id } },
  });
  if (existing) return errorResponse("User already exists in this workspace", 409);

  const member = await prisma.workspaceMember.create({
    data: { workspace_id: workspaceId, user_id: body.user_id, role: body.role || "user" },
    include: { user: true },
  });

  const { user: memberUser, ...rest } = serializeDecimal(member);
  const { hashed_password, ...safeUser } = memberUser || {};
  return jsonResponse({ ...rest, user: safeUser }, 201);
}
