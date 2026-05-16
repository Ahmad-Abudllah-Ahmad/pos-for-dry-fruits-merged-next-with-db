"use client";

import { useCallback, useEffect, useState } from "react";
import { Package, Store, Warehouse } from "lucide-react";
import { toast } from "sonner";

import { listStock } from "@/api/inventory";
import { getItemName } from "@/lib/item-name";
import { money, formatWeight } from "@/lib/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/card";
import { MetricStatCard } from "@/components/common/metric-stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/api/client";
import { Skeleton } from "@/components/ui/skeleton";

export function UserAppDashboard() {
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [shop, setShop] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [wh, setWh] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (activeId == null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [s, w] = await Promise.all([
        listStock(activeId, "shop"),
        listStock(activeId, "warehouse"),
      ]);
      setShop(Array.isArray(s) ? s : []);
      setWh(Array.isArray(w) ? w : []);
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error("Failed to load stock");
      }
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalShop = shop.reduce(
    (a, r) => a + parseFloat(String(r.stock_value ?? 0) || "0"),
    0
  );
  const totalWh = wh.reduce(
    (a, r) => a + parseFloat(String(r.stock_value ?? 0) || "0"),
    0
  );

  if (activeId == null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            You are not assigned to a workspace. Ask an administrator to add you as a member.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold [font-family:var(--font-outfit),system-ui,sans-serif] tracking-tight">
          Stock &amp; locations
        </h1>
        <p className="text-sm text-muted-foreground">
          Shop and warehouse balances for the selected workspace.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MetricStatCard
          label="Shop stock value"
          value={loading ? "—" : money(totalShop)}
          icon={Store}
          loading={loading}
        />
        <MetricStatCard
          label="Warehouse value"
          value={loading ? "—" : money(totalWh)}
          icon={Warehouse}
          loading={loading}
        />
      </div>
      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="shop" className="gap-1.5">
            <Store className="size-3.5" />
            Shop
          </TabsTrigger>
          <TabsTrigger value="warehouse" className="gap-1.5">
            <Warehouse className="size-3.5" />
            Warehouse
          </TabsTrigger>
        </TabsList>
        <TabsContent value="shop">
          <StockTable rows={shop} loading={loading} locationLabel="shop" />
        </TabsContent>
        <TabsContent value="warehouse">
          <StockTable rows={wh} loading={loading} locationLabel="warehouse" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * @param {{ rows: Array<Record<string, unknown>>; loading: boolean; locationLabel: string }} p
 */
function StockTable({ rows, loading, locationLabel }) {
  if (loading) {
    return (
      <div className="mt-2 space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <Card className="mt-2">
        <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Package className="size-5" />
          No stock lines in {locationLabel} yet.
        </CardContent>
      </Card>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Avg cost</TableHead>
          <TableHead className="text-right">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={`${r.item_id}-${r.location_id}`}>
            <TableCell className="font-medium">{getItemName(/** @type {Record<string, string>} */ (r.item_name))}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatWeight(Number(r.quantity_grams ?? 0), "gram")}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {money(r.average_unit_cost)}
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">{money(r.stock_value)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
