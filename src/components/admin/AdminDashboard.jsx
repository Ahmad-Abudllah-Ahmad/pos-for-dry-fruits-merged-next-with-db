"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BoxBoldDuotoneIcon,
  MoneyBagBoldDuotoneIcon,
  PenNewSquareBoldDuotoneIcon,
  RefreshBoldDuotoneIcon,
  ShopBoldDuotoneIcon,
  TrashBinTrashBoldDuotoneIcon,
  UserPlusBoldDuotoneIcon,
  UsersGroupRoundedBoldDuotoneIcon,
} from "@/components/icons";
import { toast } from "sonner";

import {
  createEmployee,
  createUser,
  createWorkspace,
  deactivateUser,
  deleteEmployee,
  getMyWorkspaces,
  listEmployees,
  listItems,
  listMovements,
  listWorkspaceMembers,
  listStock,
  listSubledgers,
  reactivateUser,
  updateEmployee,
  updateUser,
} from "@/api";
import { getItemName } from "@/lib/item-name";
import { money, formatWeight } from "@/lib/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/common/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/card";
import { MetricStatCard } from "@/components/common/metric-stat-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ApiError } from "@/api/client";
import { cn } from "@/lib/utils/cn";

const CARD_TABLE_SCROLL_ROW_LIMIT = 5;
const CARD_TABLE_SCROLL_MAX_HEIGHT = "max-h-[16.5rem]";
const RECENT_MOVEMENTS_LIMIT = 15;

/**
 * @param {{ rowCount: number; children: React.ReactNode }} props
 */
function ScrollableCardTable({ rowCount, children }) {
  const scrollable = rowCount > CARD_TABLE_SCROLL_ROW_LIMIT;
  return (
    <div className={cn(scrollable && `${CARD_TABLE_SCROLL_MAX_HEIGHT} overflow-y-auto`)}>
      {children}
    </div>
  );
}

export function AdminDashboard() {
  const { workspaces, activeWorkspaceId, setWorkspaces, setActiveWorkspaceId } = useWorkspaceStore();
  const [users, setUsers] = useState(/** @type {Array<Record<string, unknown>>} */([]));
  const [employees, setEmployees] = useState(/** @type {Array<Record<string, unknown>>} */([]));
  const [stockVal, setStockVal] = useState(0);
  const [movements, setMovements] = useState(/** @type {Array<Record<string, unknown>>} */([]));
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */([]));
  const [subledgers, setSubledgers] = useState(/** @type {Array<Record<string, unknown>>} */([]));
  const [loading, setLoading] = useState(true);
  const [userTab, setUserTab] = useState("active");

  const wid = activeWorkspaceId;

  const activeUsers = useMemo(
    () => users.filter((user) => user.is_active !== false),
    [users]
  );
  const inactiveUsers = useMemo(
    () => users.filter((user) => user.is_active === false),
    [users]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const w = await getMyWorkspaces();
      if (Array.isArray(w)) {
        setWorkspaces(w);
        if (w.length > 0 && !w.some((x) => x.id === activeWorkspaceId)) {
          setActiveWorkspaceId(w[0].id);
        }
      }
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [setWorkspaces, setActiveWorkspaceId, activeWorkspaceId]);

  const loadWorkspaceData = useCallback(async () => {
    if (wid == null) {
      setUsers([]);
      setEmployees([]);
      setStockVal(0);
      setMovements([]);
      setItems([]);
      setSubledgers([]);
      return;
    }
    try {
      const st = await listStock(wid, null);
      const v = (Array.isArray(st) ? st : []).reduce(
        (a, r) => a + parseFloat(String(/** @type {Record<string, unknown>} */(r).stock_value) || "0"),
        0
      );
      setStockVal(v);
      const [members, mov, it, sl, emps] = await Promise.all([
        listWorkspaceMembers(wid),
        listMovements(wid),
        listItems(wid, null),
        listSubledgers(wid),
        listEmployees(wid),
      ]);
      setUsers(
        (Array.isArray(members) ? members : [])
          .map((member) => ({
            .../** @type {Record<string, unknown>} */ (member).user,
            workspace_role: /** @type {Record<string, unknown>} */ (member).role,
            membership_id: /** @type {Record<string, unknown>} */ (member).id,
          }))
          .filter((user) => user.id != null)
      );
      setEmployees(Array.isArray(emps) ? emps : []);
      setMovements(Array.isArray(mov) ? mov.slice(0, RECENT_MOVEMENTS_LIMIT) : []);
      setItems(Array.isArray(it) ? it : []);
      setSubledgers(Array.isArray(sl) ? sl : []);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    }
  }, [wid]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  if (workspaces.length === 0 && !loading) {
    return (
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold [font-family:var(--font-outfit),system-ui,sans-serif]">Admin</h1>
        <p className="text-sm text-muted-foreground">Create a workspace, then add members and items.</p>
        <CreateWorkspaceForm onSuccess={loadAll} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold [font-family:var(--font-outfit),system-ui,sans-serif]">
            Admin control
          </h1>
          <p className="text-sm text-muted-foreground">Users, workspaces, transfers, and intake.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => { loadAll(); loadWorkspaceData(); }} disabled={loading}>
          <RefreshBoldDuotoneIcon className="size-4" />
          Refresh
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStatCard label="Employees (this Shop)" value={String(employees.length)} icon={UsersGroupRoundedBoldDuotoneIcon} loading={loading} />
        <MetricStatCard label="Shops" value={String(workspaces.length)} icon={ShopBoldDuotoneIcon} loading={loading} />
        <MetricStatCard label="Total Items this shop" value={String(items.length)} icon={BoxBoldDuotoneIcon} loading={loading} />
        <MetricStatCard
          label="Total stock value"
          value={money(stockVal)}
          icon={MoneyBagBoldDuotoneIcon}
          sub="All locations"
          loading={loading}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>Employees in the selected Shop</CardDescription>
            </div>
            <CreateUserForm workspaceId={wid} onSuccess={loadWorkspaceData} />
          </CardHeader>
          <CardContent>
            <Tabs value={userTab} onValueChange={setUserTab}>
              <TabsList className="mb-3">
                <TabsTrigger value="active">Active ({activeUsers.length})</TabsTrigger>
                <TabsTrigger value="inactive">Inactive ({inactiveUsers.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="mt-0">
                <UsersTable
                  users={activeUsers}
                  mode="active"
                  onSuccess={loadWorkspaceData}
                />
              </TabsContent>
              <TabsContent value="inactive" className="mt-0">
                <UsersTable
                  users={inactiveUsers}
                  mode="inactive"
                  onSuccess={loadWorkspaceData}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Shops</CardTitle>
            </div>
            <CreateWorkspaceForm onSuccess={loadAll} />
          </CardHeader>
          <CardContent>
            <ScrollableCardTable rowCount={workspaces.length}>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/55 shadow-[0_1px_0_0_var(--border)]">
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspaces.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>{w.id}</TableCell>
                      <TableCell className="font-medium">{w.name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollableCardTable>
          </CardContent>
        </Card>
      </div>
      {wid != null && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <CreateEmployeeForm workspaceId={wid} onSuccess={loadWorkspaceData} />
          </div>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Employees</CardTitle>
                <CardDescription>Shop staff for wage tracking and expense history</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollableCardTable rowCount={employees.length}>
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-muted/55 shadow-[0_1px_0_0_var(--border)]">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="w-[120px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          No employees added yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{String(employee.name)}</TableCell>
                          <TableCell>{String(employee.designation ?? "—")}</TableCell>
                          <TableCell className="text-muted-foreground">{String(employee.phone_number ?? "—")}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <EditEmployeeForm workspaceId={wid} employee={employee} onSuccess={loadWorkspaceData} />
                              <Button
                                type="button"
                                variant="destructive"
                                size="iconSm"
                                aria-label="Delete employee"
                                onClick={async () => {
                                  if (!window.confirm(`Delete employee "${String(employee.name)}"?`)) return;
                                  try {
                                    await deleteEmployee(wid, Number(employee.id));
                                    toast.success("Employee deleted");
                                    loadWorkspaceData();
                                  } catch (err) {
                                    if (err instanceof ApiError) toast.error(err.message);
                                  }
                                }}
                              >
                                <TrashBinTrashBoldDuotoneIcon />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollableCardTable>
            </CardContent>
          </Card>
        </div>
      )}
      {wid != null && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Recent movements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{String(m.type)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getItemName(/** @type {Record<string, string>} */(items.find((item) => Number(item.id) === Number(m.item_id))?.name ?? { en: `#${m.item_id}` }))}
                        </div>
                        {m.subledger_id != null && (
                          <div className="text-xs text-muted-foreground">
                            {getItemName(/** @type {Record<string, string>} */(subledgers.find((subledger) => Number(subledger.id) === Number(m.subledger_id))?.name ?? { en: `Variant #${m.subledger_id}` }))}
                            {Number(m.quantity ?? 0) > 0 ? ` | Cotton/Bags: ${m.quantity}` : ""}
                          </div>
                        )}
                        {m.subledger_id == null && Number(m.quantity ?? 0) > 0 && (
                          <div className="text-xs text-muted-foreground">Cotton/Bags: {String(m.quantity)}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatWeight(Number(m.quantity_grams), "gram")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/**
 * @param {{
 *   users: Array<Record<string, unknown>>;
 *   mode: "active" | "inactive";
 *   onSuccess: () => void;
 * }} props
 */
function UsersTable({ users, mode, onSuccess }) {
  const emptyMessage = mode === "active" ? "No active users in this shop." : "No inactive users in this shop.";

  return (
    <ScrollableCardTable rowCount={users.length}>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted/55 shadow-[0_1px_0_0_var(--border)]">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="w-[160px] text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{String(user.name)}</TableCell>
                <TableCell>{String(user.workspace_role ?? user.role)}</TableCell>
                <TableCell className="text-muted-foreground">{String(user.phone_number)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <EditUserForm user={user} onSuccess={onSuccess} />
                    {mode === "active" ? (
                      String(user.role) !== "Admin" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!window.confirm(`Deactivate user "${String(user.name)}"?`)) return;
                            try {
                              await deactivateUser(Number(user.id));
                              toast.success("User deactivated");
                              onSuccess();
                            } catch (err) {
                              if (err instanceof ApiError) toast.error(err.message);
                            }
                          }}
                        >
                          Deactivate
                        </Button>
                      )
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          try {
                            await reactivateUser(Number(user.id));
                            toast.success("User reactivated");
                            onSuccess();
                          } catch (err) {
                            if (err instanceof ApiError) toast.error(err.message);
                          }
                        }}
                      >
                        Reactivate
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollableCardTable>
  );
}

/** @param {{ workspaceId: number | null; onSuccess: () => void }} p */
function CreateUserForm({ workspaceId, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", cnic_number: "", phone_number: "", address: "", password: "" });
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="secondary">
          <UserPlusBoldDuotoneIcon className="size-4" />
          Add user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await createUser({
                name: f.name,
                cnic_number: f.cnic_number,
                phone_number: f.phone_number,
                address: f.address || null,
                password: f.password,
                role: "user",
                workspace_id: workspaceId,
              });
              toast.success("User created");
              setOpen(false);
              onSuccess();
            } catch (err) {
              if (err instanceof ApiError) toast.error(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {["name", "cnic_number", "phone_number", "address", "password"].map((k) => (
            <div key={k} className="space-y-1">
              <Label className="capitalize">{k.replace("_", " ")}</Label>
              <Input
                type={k === "password" ? "password" : "text"}
                required={k !== "address"}
                value={/** @type {Record<string, string>} */(f)[k]}
                onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
              />
            </div>
          ))}
          <Button className="w-full" type="submit" disabled={busy}>
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** @param {{ user: Record<string, unknown>; onSuccess: () => void }} p */
function EditUserForm({ user, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: String(user.name ?? ""),
    cnic_number: String(user.cnic_number ?? ""),
    phone_number: String(user.phone_number ?? ""),
    address: String(user.address ?? ""),
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setF({
      name: String(user.name ?? ""),
      cnic_number: String(user.cnic_number ?? ""),
      phone_number: String(user.phone_number ?? ""),
      address: String(user.address ?? ""),
    });
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="iconSm" aria-label="Edit user">
          <PenNewSquareBoldDuotoneIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await updateUser(Number(user.id), {
                name: f.name,
                cnic_number: f.cnic_number,
                phone_number: f.phone_number,
                address: f.address || null,
              });
              toast.success("User updated");
              setOpen(false);
              onSuccess();
            } catch (err) {
              if (err instanceof ApiError) toast.error(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {["name", "cnic_number", "phone_number", "address"].map((k) => (
            <div key={k} className="space-y-1">
              <Label className="capitalize">{k.replace("_", " ")}</Label>
              <Input
                required={k !== "address"}
                value={/** @type {Record<string, string>} */(f)[k]}
                onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
              />
            </div>
          ))}
          <Button className="w-full" type="submit" disabled={busy}>
            Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** @param {{ workspaceId: number; onSuccess: () => void }} p */
function CreateEmployeeForm({ workspaceId, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", phone_number: "", cnic_number: "", address: "", designation: "" });
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="secondary">
          <UserPlusBoldDuotoneIcon className="size-4" />
          Add employee
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New employee</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await createEmployee(workspaceId, {
                name: f.name,
                phone_number: f.phone_number || null,
                cnic_number: f.cnic_number || null,
                address: f.address || null,
                designation: f.designation || null,
              });
              toast.success("Employee created");
              setOpen(false);
              setF({ name: "", phone_number: "", cnic_number: "", address: "", designation: "" });
              onSuccess();
            } catch (err) {
              if (err instanceof ApiError) toast.error(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {[
            { key: "name", required: true },
            { key: "designation", required: false },
            { key: "phone_number", required: false },
            { key: "cnic_number", required: false },
            { key: "address", required: false },
          ].map(({ key, required }) => (
            <div key={key} className="space-y-1">
              <Label className="capitalize">{key.replace("_", " ")}</Label>
              <Input
                required={required}
                value={/** @type {Record<string, string>} */(f)[key]}
                onChange={(e) => setF((x) => ({ ...x, [key]: e.target.value }))}
              />
            </div>
          ))}
          <Button className="w-full" type="submit" disabled={busy}>
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** @param {{ workspaceId: number; employee: Record<string, unknown>; onSuccess: () => void }} p */
function EditEmployeeForm({ workspaceId, employee, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: String(employee.name ?? ""),
    phone_number: String(employee.phone_number ?? ""),
    cnic_number: String(employee.cnic_number ?? ""),
    address: String(employee.address ?? ""),
    designation: String(employee.designation ?? ""),
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setF({
      name: String(employee.name ?? ""),
      phone_number: String(employee.phone_number ?? ""),
      cnic_number: String(employee.cnic_number ?? ""),
      address: String(employee.address ?? ""),
      designation: String(employee.designation ?? ""),
    });
  }, [employee]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="iconSm" aria-label="Edit employee">
          <PenNewSquareBoldDuotoneIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await updateEmployee(workspaceId, Number(employee.id), {
                name: f.name,
                phone_number: f.phone_number || null,
                cnic_number: f.cnic_number || null,
                address: f.address || null,
                designation: f.designation || null,
              });
              toast.success("Employee updated");
              setOpen(false);
              onSuccess();
            } catch (err) {
              if (err instanceof ApiError) toast.error(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {["name", "designation", "phone_number", "cnic_number", "address"].map((k) => (
            <div key={k} className="space-y-1">
              <Label className="capitalize">{k.replace("_", " ")}</Label>
              <Input
                required={k === "name"}
                value={/** @type {Record<string, string>} */(f)[k]}
                onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
              />
            </div>
          ))}
          <Button className="w-full" type="submit" disabled={busy}>
            Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** @param {{ onSuccess: () => void }} p */
function CreateWorkspaceForm({ onSuccess }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="default">
          <ShopBoldDuotoneIcon className="size-4" />
          New workspace
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workspace</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await createWorkspace({ name, description: desc || null });
              toast.success("Workspace created");
              setOpen(false);
              setName("");
              setDesc("");
              onSuccess();
            } catch (err) {
              if (err instanceof ApiError) toast.error(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="space-y-1">
            <Label>Name</Label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Description (optional)</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <Button className="w-full" type="submit" disabled={busy}>
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
