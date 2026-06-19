import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal, getSearchParams } from "@/lib/api-helpers";

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const sp = getSearchParams(request);
  const where = { workspace_id: workspaceId };
  if (sp.has("employee_id")) {
    where.employee_id = parseInt(sp.get("employee_id"), 10);
  }

  const expenses = await prisma.expenseEntry.findMany({
    where,
    orderBy: { created_at: "desc" },
  });
  return jsonResponse(serializeDecimal(expenses));
}

export async function POST(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const body = await parseBody(request);
  if (!body || !body.title || !body.amount || !body.expense_date) {
    return errorResponse("title, amount, and expense_date are required", 400);
  }

  if (body.employee_id) {
    const employee = await prisma.employee.findFirst({
      where: { id: body.employee_id, workspace_id: workspaceId },
    });
    if (!employee) return errorResponse("Employee not found", 404);
  }

  let expenseDate = new Date(body.expense_date);
  if (isNaN(expenseDate.getTime())) {
     expenseDate = new Date();
  }

  const expense = await prisma.expenseEntry.create({
    data: {
      workspace_id: workspaceId,
      created_by_id: auth.user.id,
      category: body.category || "other",
      title: body.title,
      amount: body.amount,
      expense_date: expenseDate,
      payment_method: body.payment_method || null,
      note: body.note || null,
      employee_id: body.employee_id || null,
      status: "draft",
    },
  });

  return jsonResponse(serializeDecimal(expense), 201);
}
