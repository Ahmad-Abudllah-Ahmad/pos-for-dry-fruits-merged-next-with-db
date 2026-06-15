"use client";

import { useCallback, useEffect, useState } from "react";
import { Boxes, RefreshCw, Truck, UserPlus, Warehouse } from "lucide-react";
import { toast } from "sonner";

import {
  createUser,
  createWorkspace,
  listItems,
  listMovements,
  listWorkspaceMembers,
  listWorkspaces,
  listStock,
  listSubledgers,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ApiError } from "@/api/client";

export function AdminDashboard() {
  const { workspaces, activeWorkspaceId, setWorkspaces, setActiveWorkspaceId } = useWorkspaceStore();
  const [users, setUsers] = useState(/** @type {Array<Record<string, unknown>>} */([]));
  const [stockVal, setStockVal] = useState(0);
  const [movements, setMovements] = useState(/** @type {Array<Record<string, unknown>>} */([]));
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */([]));
  const [subledgers, setSubledgers] = useState(/** @type {Array<Record<string, unknown>>} */([]));
  const [loading, setLoading] = useState(true);

  const wid = activeWorkspaceId;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const w = await listWorkspaces();
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
      const [members, mov, it, sl] = await Promise.all([
        listWorkspaceMembers(wid),
        listMovements(wid),
        listItems(wid, null),
        listSubledgers(wid),
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
      setMovements(Array.isArray(mov) ? mov.slice(0, 30) : []);
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
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStatCard label="Employees (this Shop)" value={String(users.length)} icon={UserPlus} loading={loading} />
        <MetricStatCard label="Shops" value={String(workspaces.length)} icon={Warehouse} loading={loading} />
        <MetricStatCard label="Total Items this shop" value={String(items.length)} icon={Boxes} loading={loading} />
        <MetricStatCard
          label="Total stock value"
          value={money(stockVal)}
          icon={Truck}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{String(u.name)}</TableCell>
                    <TableCell>{String(u.workspace_role ?? u.role)}</TableCell>
                    <TableCell className="text-muted-foreground">{String(u.phone_number)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <Table>
              <TableHeader>
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
          </CardContent>
        </Card>
      </div>
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

/** @param {{ workspaceId: number | null; onSuccess: () => void }} p */
function CreateUserForm({ workspaceId, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", cnic_number: "", phone_number: "", address: "", password: "" });
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="secondary">
          <UserPlus className="size-4" />
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
          <Warehouse className="size-4" />
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
