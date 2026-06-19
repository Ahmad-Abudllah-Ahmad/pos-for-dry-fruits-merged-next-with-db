import prisma from "@/lib/prisma";
import { requireAuth, requireWorkspaceAccess } from "@/lib/auth";
import { jsonResponse, errorResponse, parseBody, serializeDecimal } from "@/lib/api-helpers";

export async function GET(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, expense_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const expenseId = parseInt(expense_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const expense = await prisma.expenseEntry.findUnique({
    where: { id: expenseId, workspace_id: workspaceId },
  });
  if (!expense) return errorResponse("Expense entry not found", 404);
  return jsonResponse(serializeDecimal(expense));
}

export async function PATCH(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, expense_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const expenseId = parseInt(expense_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  let expense = await prisma.expenseEntry.findUnique({
    where: { id: expenseId, workspace_id: workspaceId },
  });
  if (!expense) return errorResponse("Expense entry not found", 404);

  if (expense.status !== "draft" && auth.user.role !== "Admin") {
    return errorResponse("Completed expenses cannot be changed", 409);
  }

  const body = await parseBody(request);
  if (!body) return errorResponse("Invalid request body", 400);

  const updates = {};
  if (body.category !== undefined) updates.category = body.category;
  if (body.title !== undefined) updates.title = body.title;
  if (body.amount !== undefined) updates.amount = body.amount;
  if (body.payment_method !== undefined) updates.payment_method = body.payment_method;
  if (body.note !== undefined) updates.note = body.note;
  if (body.expense_date !== undefined) {
      let expenseDate = new Date(body.expense_date);
      if (!isNaN(expenseDate.getTime())) {
          updates.expense_date = expenseDate;
      }
  }
  if (body.employee_id !== undefined) {
    if (body.employee_id) {
      const employee = await prisma.employee.findFirst({
        where: { id: body.employee_id, workspace_id: workspaceId },
      });
      if (!employee) return errorResponse("Employee not found", 404);
    }
    updates.employee_id = body.employee_id;
  }

  expense = await prisma.expenseEntry.update({
    where: { id: expenseId },
    data: updates,
  });

  return jsonResponse(serializeDecimal(expense));
}

export async function DELETE(request, { params }) {
  const auth = await requireAuth(request);
  if (auth.error) return errorResponse(auth.error, auth.status);
  const { workspace_id, expense_id } = await params;
  const workspaceId = parseInt(workspace_id, 10);
  const expenseId = parseInt(expense_id, 10);
  const access = await requireWorkspaceAccess(workspaceId, auth.user);
  if (access.error) return errorResponse(access.error, access.status);

  const expense = await prisma.expenseEntry.findUnique({
    where: { id: expenseId, workspace_id: workspaceId },
  });
  if (!expense) return errorResponse("Expense entry not found", 404);

  if (expense.status !== "draft" && auth.user.role !== "Admin") {
    return errorResponse("Completed expenses cannot be deleted", 409);
  }

  await prisma.expenseEntry.delete({ where: { id: expenseId } });
  return jsonResponse({ message: "Deleted successfully" });
}
