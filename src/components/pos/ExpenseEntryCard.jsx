"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Receipt, Save } from "lucide-react";
import { toast } from "sonner";

import { money } from "@/lib/format";
import { Button } from "@/components/common/button";
import { Card, CardContent } from "@/components/common/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
 *   employees?: Array<Record<string, unknown>>;
 *   busy: boolean;
 *   canEditCompleted?: boolean;
 *   onStartExpense: (payload: Record<string, unknown>) => Promise<void>;
 *   onUpdateExpense: (payload: Record<string, unknown>) => Promise<void>;
 *   onFinalize: () => Promise<void>;
 * }} props
 */
export function ExpenseEntryCard({
  expense,
  employees = [],
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
  const [employeeId, setEmployeeId] = useState(/** @type {number | null} */ (null));

  const isWages = category === "wages";

  const isDraft = expense && String(expense.status) === "draft";
  const canEditExpense = Boolean(expense && (isDraft || canEditCompleted));

  useEffect(() => {
    setCategory(String(expense?.category ?? "other"));
    setTitle(String(expense?.title ?? "Expense"));
    setAmount(String(expense?.amount ?? "0"));
    setExpenseDate(String(expense?.expense_date ?? todayInput()));
    setPaymentMethod(String(expense?.payment_method ?? ""));
    setNote(String(expense?.note ?? ""));
    setEmployeeId(expense?.employee_id != null ? Number(expense.employee_id) : null);
  }, [expense]);

  useEffect(() => {
    if (!isWages) {
      setEmployeeId(null);
    }
  }, [isWages]);

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
    if (category === "wages" && employeeId == null) {
      toast.error("Select an employee for wage expenses");
      return null;
    }

    return {
      category,
      title: trimmedTitle,
      amount: String(nextAmount),
      expense_date: expenseDate,
      payment_method: trimmedPaymentMethod || null,
      note: trimmedNote || null,
      employee_id: category === "wages" ? employeeId : null,
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
      employee_id: null,
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
    <Card className="overflow-hidden border-border/90 shadow-sm">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="pos-slip-action-bar">
          <div className="min-w-0">
            <p className="font-semibold [font-family:var(--font-outfit),system-ui,sans-serif]">
              {expense ? `Expense #${expense.id}` : "Expense entry"}
            </p>
            {expense && <p className="text-xs capitalize text-muted-foreground">{String(expense.status)}</p>}
          </div>
          <Button type="button" variant="secondary" onClick={startEntry} disabled={busy} className="shrink-0">
            {busy && <Loader2 className="size-4 animate-spin" />}
            New expense
          </Button>
        </div>

        {!expense && (
          <div className="pos-slip-empty">
            <p className="pos-slip-empty-title">No expense selected</p>
            <p className="pos-slip-empty-hint">Record wages, rent, utilities, and other shop costs.</p>
          </div>
        )}

        {expense && (
          <>
            <div className="pos-slip-summary-strip pos-slip-summary-strip--expense">
              <div className="grid gap-2 sm:grid-cols-3">
                <Summary label="Category" value={categoryLabel(String(expense.category ?? "other"))} />
                <Summary label="Date" value={String(expense.expense_date ?? "—")} />
                <Summary label="Amount" value={money(expense.amount)} />
              </div>
            </div>

            <div className="pos-form-section pos-form-section--expense space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="pos-form-section-title">Details</p>
                <Badge variant={String(expense.status) === "completed" ? "info" : "default"}>
                  {String(expense.status)}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Type">
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
                {isWages && (
                  <Field label="Employee">
                    <EmployeeSearchSelect
                      employees={employees}
                      value={employeeId}
                      onChange={setEmployeeId}
                      disabled={busy || !canEditExpense}
                    />
                  </Field>
                )}
                <Field label="Title">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy || !canEditExpense} />
                </Field>
                <Field label="Amount (PKR)">
                  <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" disabled={busy || !canEditExpense} />
                </Field>
                <Field label="Date">
                  <Input value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} type="date" disabled={busy || !canEditExpense} />
                </Field>
                <Field label="Payment method">
                  <Input
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="Cash, bank…"
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
                    Save
                  </Button>
                  {isDraft && (
                    <Button type="button" variant="accent" onClick={finalizeEntry} disabled={busy}>
                      <Receipt className="size-4" />
                      Finalize
                    </Button>
                  )}
                </div>
              )}
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

/**
 * @param {{
 *   employees: Array<Record<string, unknown>>;
 *   value: number | null;
 *   onChange: (value: number | null) => void;
 *   disabled?: boolean;
 * }} props
 */
function EmployeeSearchSelect({ employees, value, onChange, disabled = false }) {
  const containerRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => Number(employee.id) === value) ?? null,
    [employees, value]
  );

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return employees;
    return employees.filter((employee) => {
      const haystack = [
        String(employee.name ?? ""),
        String(employee.phone_number ?? ""),
        String(employee.designation ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [employees, query]);

  useEffect(() => {
    setQuery(selectedEmployee ? String(selectedEmployee.name) : "");
  }, [selectedEmployee]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(/** @type {Node} */ (event.target))) {
        setOpen(false);
        if (selectedEmployee) {
          setQuery(String(selectedEmployee.name));
        }
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [selectedEmployee]);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        placeholder="Search employees…"
        disabled={disabled}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (!event.target.value.trim()) onChange(null);
        }}
      />
      {open && !disabled && (
        <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-background shadow-md">
          {filteredEmployees.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No employees found.</p>
          ) : (
            filteredEmployees.map((employee) => (
              <button
                key={String(employee.id)}
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(Number(employee.id));
                  setQuery(String(employee.name));
                  setOpen(false);
                }}
              >
                <span className="font-medium">{String(employee.name)}</span>
                {(employee.designation || employee.phone_number) && (
                  <span className="text-xs text-muted-foreground">
                    {[employee.designation, employee.phone_number].filter(Boolean).join(" · ")}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** @param {{ label: string; children: React.ReactNode }} props */
function Field({ label, children }) {
  return (
    <div className="pos-form-field min-w-0">
      <label>{label}</label>
      {children}
    </div>
  );
}

/** @param {{ label: string; value: string }} props */
function Summary({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}
