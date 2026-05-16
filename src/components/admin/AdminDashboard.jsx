"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRightLeft, Boxes, Plus, RefreshCw, Trash2, Truck, UserPlus, Warehouse } from "lucide-react";
import { toast } from "sonner";

import {
  createItem,
  createTransferBatch,
  createUser,
  createWorkspace,
  listItems,
  listMovements,
  listWorkspaceMembers,
  listWorkspaces,
  listStock,
  listSubledgers,
  createSubledger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/api/client";

function newTransferRow() {
  return { id: `${Date.now()}-${Math.random()}`, itemId: "", qtyKg: "1" };
}

/** @param {string | number} value */
function kgToGrams(value) {
  const kg = parseFloat(String(value));
  if (!Number.isFinite(kg) || kg <= 0) return null;
  const grams = Math.round(kg * 1000);
  return grams >= 1 ? grams : null;
}

export function AdminDashboard() {
  const { workspaces, activeWorkspaceId, setWorkspaces, setActiveWorkspaceId } = useWorkspaceStore();
  const [users, setUsers] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [stockVal, setStockVal] = useState(0);
  const [movements, setMovements] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [subledgers, setSubledgers] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [loading, setLoading] = useState(true);
  const [transferDirection, setTransferDirection] = useState(/** @type {"warehouse_to_shop" | "shop_to_warehouse"} */ ("warehouse_to_shop"));
  const [transferRows, setTransferRows] = useState([newTransferRow()]);
  const [busy, setBusy] = useState(false);

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

  async function onTransfer() {
    if (wid == null) return;
    const itemsPayload = [];
    for (const row of transferRows) {
      const itemId = Number(row.itemId);
      const grams = kgToGrams(row.qtyKg);
      if (!itemId || grams == null) {
        toast.error("Choose item and quantity (kg) for every transfer line");
        return;
      }
      itemsPayload.push({ item_id: itemId, quantity_grams: grams });
    }
    if (itemsPayload.length === 0) {
      toast.error("Add at least one transfer line");
      return;
    }
    setBusy(true);
    try {
      await createTransferBatch(wid, { direction: transferDirection, items: itemsPayload });
      toast.success(
        transferDirection === "warehouse_to_shop"
          ? "Transfer warehouse to shop recorded"
          : "Transfer shop to warehouse recorded"
      );
      setTransferRows([newTransferRow()]);
      loadWorkspaceData();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

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
        <Button type="button" variant="outline" size="sm" onClick={() => { loadAll(); loadWorkspaceData(); }} disabled={busy || loading}>
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStatCard label="Users (this WS)" value={String(users.length)} icon={UserPlus} loading={loading} />
        <MetricStatCard label="Workspaces" value={String(workspaces.length)} icon={Warehouse} loading={loading} />
        <MetricStatCard label="Items (this WS)" value={String(items.length)} icon={Boxes} loading={loading} />
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
              <CardDescription>Members in the selected workspace</CardDescription>
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
              <CardTitle>Workspaces</CardTitle>
              <CardDescription>Businesses / shops</CardDescription>
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
          <div className="grid gap-4 md:grid-cols-2">
            <CreateItemForm workspaceId={wid} onCreated={loadWorkspaceData} />
            <SubledgerForm workspaceId={wid} items={items} subledgers={subledgers} onDone={loadWorkspaceData} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Stock transfer</CardTitle>
              <CardDescription>Move one or more stock lines between warehouse and shop.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="max-w-xs space-y-2">
                <Label>Direction</Label>
                <Select value={transferDirection} onValueChange={(value) => setTransferDirection(/** @type {"warehouse_to_shop" | "shop_to_warehouse"} */ (value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse_to_shop">Warehouse to shop</SelectItem>
                    <SelectItem value="shop_to_warehouse">Shop to warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {transferRows.map((row, index) => (
                <div key={row.id} className="grid gap-3 rounded-md border border-border/80 p-3 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-end">
                  <div className="space-y-2">
                    <Label>Item</Label>
                    <Select
                      value={row.itemId}
                      onValueChange={(value) => setTransferRows((rows) => rows.map((entry) => entry.id === row.id ? { ...entry, itemId: value } : entry))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items
                          .filter((i) => i.is_active)
                          .map((i) => (
                            <SelectItem key={i.id} value={String(i.id)}>
                              {getItemName(/** @type {Record<string, string>} */(i.name))} (#{i.id})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Qty (kg)</Label>
                    <Input
                      value={row.qtyKg}
                      onChange={(e) => setTransferRows((rows) => rows.map((entry) => entry.id === row.id ? { ...entry, qtyKg: e.target.value } : entry))}
                      type="number"
                      min="0.001"
                      step="0.001"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setTransferRows((rows) => rows.length > 1 ? rows.filter((entry) => entry.id !== row.id) : rows)}
                    disabled={busy || transferRows.length === 1}
                    aria-label={`Remove transfer line ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setTransferRows((rows) => [...rows, newTransferRow()])} disabled={busy}>
                  <Plus className="size-4" />
                  Add line
                </Button>
                <Button type="button" onClick={onTransfer} disabled={busy}>
                  <ArrowRightLeft className="size-4" />
                  Save transfer
                </Button>
              </div>
            </CardContent>
          </Card>
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
                      <TableCell>#{m.item_id}</TableCell>
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

/** @param {{ workspaceId: number; onCreated: () => void }} p */
function CreateItemForm({ workspaceId, onCreated }) {
  const [en, setEn] = useState("");
  const [ur, setUr] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle>New catalog item</CardTitle>
        <CardDescription>Items have no price; pricing is at billing time.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const enName = en.trim();
            const urName = ur.trim();
            if (!enName && !urName) {
              toast.error("Enter English or Urdu name");
              return;
            }
            setBusy(true);
            try {
              await createItem(workspaceId, {
                name: {
                  en: enName || urName,
                  ur: urName || enName,
                },
                unit_type: "kg",
              });
              toast.success("Item created");
              setEn("");
              setUr("");
              onCreated();
            } catch (err) {
              if (err instanceof ApiError) toast.error(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>English name</Label>
              <Input value={en} onChange={(e) => setEn(e.target.value)} dir="auto" />
            </div>
            <div>
              <Label>Urdu name</Label>
              <Input value={ur} onChange={(e) => setUr(e.target.value)} dir="auto" />
            </div>
          </div>
          <div>
            <Label>Unit</Label>
            <Input value="kg" disabled />
          </div>
          <Button type="submit" disabled={busy}>
            Save item
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/** @param {{ workspaceId: number; items: Array<Record<string, unknown>>; subledgers: Array<Record<string, unknown>>; onDone: () => void }} p */
function SubledgerForm({ workspaceId, items, subledgers, onDone }) {
  const [itemId, setItemId] = useState("");
  const [en, setEn] = useState("");
  const [ur, setUr] = useState("");
  const [busy, setBusy] = useState(false);
  const activeItems = items.filter((item) => item.is_active !== false);
  const selectedItemId = Number(itemId);
  const selectedSubledgers = subledgers.filter((subledger) => Number(subledger.item_id) === selectedItemId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product variants</CardTitle>
        <CardDescription>Optional categories under a parent product. Price is entered during billing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const parentId = Number(itemId);
            const enName = en.trim();
            const urName = ur.trim();
            if (!parentId) {
              toast.error("Select a parent product");
              return;
            }
            if (!enName && !urName) {
              toast.error("Enter English or Urdu variant name");
              return;
            }
            setBusy(true);
            try {
              await createSubledger(workspaceId, {
                item_id: parentId,
                name: {
                  en: enName || urName,
                  ur: urName || enName,
                },
              });
              toast.success("Variant created");
              setEn("");
              setUr("");
              onDone();
            } catch (err) {
              if (err instanceof ApiError) toast.error(err.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div>
            <Label>Parent product</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose product" />
              </SelectTrigger>
              <SelectContent>
                {activeItems.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {getItemName(/** @type {Record<string, string>} */ (item.name))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>English variant</Label>
              <Input value={en} onChange={(e) => setEn(e.target.value)} dir="auto" />
            </div>
            <div>
              <Label>Urdu variant</Label>
              <Input value={ur} onChange={(e) => setUr(e.target.value)} dir="auto" />
            </div>
          </div>
          <Button type="submit" disabled={busy}>
            Save variant
          </Button>
        </form>
        {selectedSubledgers.length > 0 && (
          <div className="space-y-1 border-t border-border pt-2 text-sm">
            {selectedSubledgers.slice(0, 6).map((subledger) => (
              <div key={subledger.id} className="flex items-center justify-between gap-2">
                <span className="font-medium">{getItemName(/** @type {Record<string, string>} */ (subledger.name))}</span>
                <span className="text-muted-foreground">kg</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
