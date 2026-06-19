import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const requests = await prisma.passwordResetRequest.findMany({ orderBy: { created_at: "desc" } });
  return jsonResponse(serializeDecimal(requests));
}

export async function POST(request) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const body = await parseBody(request);
  const workspaceId = body?.workspace_id || null;

  if (workspaceId) {
    const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!ws) return errorResponse("Workspace not found", 404);
    const membership = await prisma.workspaceMember.findUnique({
      where: { uq_workspace_user: { workspace_id: workspaceId, user_id: auth.user.id } },
    });
    if (!membership) return errorResponse("You can request password reset only for your own workspace", 403);
  }

  const resetRequest = await prisma.passwordResetRequest.create({
    data: {
      user_id: auth.user.id,
      workspace_id: workspaceId,
      message: body?.message || null,
    },
  });

  return jsonResponse(serializeDecimal(resetRequest), 201);
}
