"use client";

import { useEffect, useState } from "react";
import { Loader2, Receipt, Save, Wallet } from "lucide-react";
import { toast } from "sonner";

import { money } from "@/lib/format";
import { Button } from "@/components/common/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EXPENSE_CATEGORIES = [
  { value: "electricity", label: "Electricity bill" },
  { value: "wages", label: "Employee wages" },
  { value: "rent", label: "Rent" },
  { value: "transport", label: "Transport" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other expense" },
];

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {{
 *   expense: Record<string, unknown> | null;
 *   busy: boolean;
 *   canEditCompleted?: boolean;
 *   onStartExpense: (payload: Record<string, unknown>) => Promise<void>;
 *   onUpdateExpense: (payload: Record<string, unknown>) => Promise<void>;
 *   onFinalize: () => Promise<void>;
 * }} props
 */
export function ExpenseEntryCard({
  expense,
  busy,
  canEditCompleted = false,
  onStartExpense,
  onUpdateExpense,
  onFinalize,
}) {
  const [category, setCategory] = useState("other");
  const [title, setTitle] = useState("Expense");
  const [amount, setAmount] = useState("0");
  const [expenseDate, setExpenseDate] = useState(todayInput());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [note, setNote] = useState("");

  const isDraft = expense && String(expense.status) === "draft";
  const canEditExpense = Boolean(expense && (isDraft || canEditCompleted));

  useEffect(() => {
    setCategory(String(expense?.category ?? "other"));
    setTitle(String(expense?.title ?? "Expense"));
    setAmount(String(expense?.amount ?? "0"));
    setExpenseDate(String(expense?.expense_date ?? todayInput()));
    setPaymentMethod(String(expense?.payment_method ?? ""));
    setNote(String(expense?.note ?? ""));
  }, [expense]);

  function buildPayload() {
    const trimmedTitle = title.trim();
    const trimmedPaymentMethod = paymentMethod.trim();
    const trimmedNote = note.trim();
    const nextAmount = Number(amount);

    if (!trimmedTitle) {
      toast.error("Enter an expense title");
      return null;
    }
    if (!expenseDate) {
      toast.error("Choose an expense date");
      return null;
    }
    if (!Number.isFinite(nextAmount) || nextAmount < 0) {
      toast.error("Enter a valid amount");
      return null;
    }

    return {
      category,
      title: trimmedTitle,
      amount: String(nextAmount),
      expense_date: expenseDate,
      payment_method: trimmedPaymentMethod || null,
      note: trimmedNote || null,
    };
  }

  async function startEntry() {
    await onStartExpense({
      category: "other",
      title: "Expense",
      amount: "0",
      expense_date: todayInput(),
      payment_method: null,
      note: null,
    });
  }

  async function saveEntry() {
    const payload = buildPayload();
    if (!payload) return;
    await onUpdateExpense(payload);
  }

  async function finalizeEntry() {
    const payload = buildPayload();
    if (!payload) return;
    if (Number(payload.amount) <= 0) {
      toast.error("Amount must be greater than zero before finalizing");
      return;
    }
    await onUpdateExpense(payload);
    await onFinalize();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Expense entry</CardTitle>
          <CardDescription>
            {expense ? `Entry #${expense.id} - ${String(expense.status)}` : "No expense entry selected"}
          </CardDescription>
        </div>
        <Button type="button" variant="secondary" onClick={startEntry} disabled={busy} className="shrink-0">
          {busy && <Loader2 className="size-4 animate-spin" />}
          New expense
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {!expense && (
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            Start a new expense entry to track electricity bills, wages, rent, and other operating costs.
          </div>
        )}

        {expense && (
          <>
            <div className="grid gap-2 rounded-md border border-border/80 bg-muted/25 p-3 text-sm sm:grid-cols-3">
              <Summary label="Category" value={categoryLabel(String(expense.category ?? "other"))} />
              <Summary label="Date" value={String(expense.expense_date ?? "—")} />
              <Summary label="Amount" value={money(expense.amount)} />
            </div>

            <div className="space-y-4 rounded-md border border-border/80 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Expense details</p>
                <Badge variant={String(expense.status) === "completed" ? "info" : "default"}>
                  {String(expense.status)}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Expense type">
                  <Select value={category} onValueChange={setCategory} disabled={busy || !canEditExpense}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Title">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy || !canEditExpense} />
                </Field>
                <Field label="Amount">
                  <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" disabled={busy || !canEditExpense} />
                </Field>
                <Field label="Expense date">
                  <Input value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} type="date" disabled={busy || !canEditExpense} />
                </Field>
                <Field label="Payment method">
                  <Input
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="Cash, bank transfer, cheque..."
                    disabled={busy || !canEditExpense}
                  />
                </Field>
                <Field label="Note">
                  <Input value={note} onChange={(e) => setNote(e.target.value)} disabled={busy || !canEditExpense} />
                </Field>
              </div>
              {canEditExpense && (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={saveEntry} disabled={busy}>
                    <Save className="size-4" />
                    Save expense
                  </Button>
                  {isDraft && (
                    <Button type="button" variant="accent" onClick={finalizeEntry} disabled={busy}>
                      <Receipt className="size-4" />
                      Finalize expense
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-md border border-border/80 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Wallet className="size-4" />
                Expense note
              </div>
              <p className="mt-2 text-muted-foreground">{note.trim() || "No note added yet."}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function categoryLabel(value) {
  return EXPENSE_CATEGORIES.find((option) => option.value === value)?.label ?? "Other expense";
}

/** @param {{ label: string; children: React.ReactNode }} props */
function Field({ label, children }) {
  return (
    <div className="min-w-0 space-y-2">
      <Label className="block truncate">{label}</Label>
      {children}
    </div>
  );
}

/** @param {{ label: string; value: string }} props */
function Summary({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
