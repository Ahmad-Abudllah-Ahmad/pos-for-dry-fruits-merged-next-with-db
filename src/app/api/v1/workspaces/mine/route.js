import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse, serializeDecimal } from "@/lib/api-helpers";

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);

  const memberships = await prisma.workspaceMember.findMany({
    where: { user_id: auth.user.id },
    select: { workspace_id: true },
  });
  const workspaceIds = memberships.map((m) => m.workspace_id);
  const workspaces = await prisma.workspace.findMany({
    where: { id: { in: workspaceIds } },
    orderBy: { created_at: "desc" },
  });
  return jsonResponse(serializeDecimal(workspaces));
}
