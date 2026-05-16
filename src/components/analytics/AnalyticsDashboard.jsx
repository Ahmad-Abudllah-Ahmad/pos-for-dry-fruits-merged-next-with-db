"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Boxes, Receipt, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { getInventoryAnalytics } from "@/api";
import { money, formatWeight } from "@/lib/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/card";
import { MetricStatCard } from "@/components/common/metric-stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/api/client";

export function AnalyticsDashboard() {
  const wid = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(/** @type {Record<string, unknown> | null} */ (null));

  const load = useCallback(async () => {
    if (wid == null) {
      setAnalytics(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await getInventoryAnalytics(wid);
      setAnalytics(response && typeof response === "object" ? response : null);
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error("Failed to load analytics");
      }
    } finally {
      setLoading(false);
    }
  }, [wid]);

  useEffect(() => {
    load();
  }, [load]);

  const overview = /** @type {Record<string, unknown>} */ (analytics?.overview ?? {});
  const periodRows = useMemo(
    () => ({
      daily: Array.isArray(analytics?.daily) ? analytics.daily : [],
      weekly: Array.isArray(analytics?.weekly) ? analytics.weekly : [],
      monthly: Array.isArray(analytics?.monthly) ? analytics.monthly : [],
      yearly: Array.isArray(analytics?.yearly) ? analytics.yearly : [],
    }),
    [analytics]
  );

  if (wid == null) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground">
          Choose a workspace to see analytics.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold [font-family:var(--font-outfit),system-ui,sans-serif]">
          Business analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Gram-based stock, sales, COGS, and profit/loss aligned from the backend ledger.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStatCard
          label="Total revenue"
          value={loading ? "—" : money(overview.total_revenue)}
          sub={`${overview.completed_sales_count ?? 0} retail + ${overview.completed_dealer_sales_count ?? 0} dealer`}
          icon={TrendingUp}
          loading={loading}
        />
        <MetricStatCard
          label="Gross profit"
          value={loading ? "—" : money(overview.gross_profit)}
          sub={`COGS ${money(overview.total_cogs)}`}
          icon={Receipt}
          loading={loading}
        />
        <MetricStatCard
          label="Net profit/loss"
          value={loading ? "—" : money(overview.net_profit)}
          sub={`Expenses ${money(overview.total_expenses)}`}
          icon={BarChart3}
          loading={loading}
        />
        <MetricStatCard
          label="Inventory value"
          value={loading ? "—" : money(overview.inventory_value)}
          sub={loading ? "—" : formatWeight(Number(overview.total_stock_grams ?? 0), "kg")}
          icon={Boxes}
          loading={loading}
        />
      </div>
      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Inventory split</CardTitle>
                <CardDescription>Current on-hand stock and value by location</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border/80 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Warehouse</p>
                  <p className="mt-1 text-lg font-semibold">{money(overview.warehouse_stock_value)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatWeight(Number(overview.warehouse_stock_grams ?? 0), "kg")}
                  </p>
                </div>
                <div className="rounded-md border border-border/80 p-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Shop</p>
                  <p className="mt-1 text-lg font-semibold">{money(overview.shop_stock_value)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatWeight(Number(overview.shop_stock_grams ?? 0), "kg")}
                  </p>
                </div>
              </CardContent>
            </Card>
            <AnalyticsChartCard
              title="Monthly trend"
              description="Revenue vs net profit by month"
              rows={periodRows.monthly}
              lineKey="revenue"
              barKey="net_profit"
            />
          </div>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              <AnalyticsPeriodPanel rows={periodRows.daily} title="Daily performance" />
            </TabsContent>
            <TabsContent value="weekly">
              <AnalyticsPeriodPanel rows={periodRows.weekly} title="Weekly performance" />
            </TabsContent>
            <TabsContent value="monthly">
              <AnalyticsPeriodPanel rows={periodRows.monthly} title="Monthly performance" />
            </TabsContent>
            <TabsContent value="yearly">
              <AnalyticsPeriodPanel rows={periodRows.yearly} title="Yearly performance" />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

/**
 * @param {{ title: string; description: string; rows: Array<Record<string, unknown>>; lineKey: string; barKey: string }} props
 */
function AnalyticsChartCard({ title, description, rows, lineKey, barKey }) {
  const chartRows = rows.slice(-12).map((row) => ({
    label: String(row.label ?? "—"),
    line: Number(row[lineKey] ?? 0),
    bar: Number(row[barKey] ?? 0),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        {chartRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity to chart yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows}>
              <CartesianGrid stroke="var(--t-border)" strokeOpacity={0.35} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid var(--t-border)" }}
                formatter={(value, name) => [money(/** @type {number} */ (value)), name === "line" ? "Revenue" : "Net profit"]}
              />
              <Bar dataKey="bar" fill="var(--t-accent)" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="line" stroke="var(--t-ring)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

/** @param {{ rows: Array<Record<string, unknown>>; title: string }} props */
function AnalyticsPeriodPanel({ rows, title }) {
  const chartRows = rows.slice(-10).map((row) => ({
    label: String(row.label ?? "—"),
    revenue: Number(row.revenue ?? 0),
    cogs: Number(row.cogs ?? 0),
    net: Number(row.net_profit ?? 0),
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>Revenue, COGS, and net profit/loss</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {chartRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartRows}>
                  <CartesianGrid stroke="var(--t-border)" strokeOpacity={0.35} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--t-border)" }}
                    formatter={(value, name) => [
                      money(/** @type {number} */ (value)),
                      name === "revenue" ? "Revenue" : name === "cogs" ? "COGS" : "Net profit",
                    ]}
                  />
                  <Bar dataKey="revenue" fill="var(--t-ring)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cogs" fill="var(--t-accent)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net" fill="var(--t-foreground)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Period breakdown</CardTitle>
            <CardDescription>Latest backend-calculated periods</CardDescription>
          </CardHeader>
          <CardContent className="max-h-72 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No rows yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.slice().reverse().slice(0, 8).map((row) => (
                    <TableRow key={String(row.label)}>
                      <TableCell>{String(row.label)}</TableCell>
                      <TableCell className="text-right font-medium">{money(row.revenue)}</TableCell>
                      <TableCell className="text-right">{money(row.net_profit)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detailed table</CardTitle>
          <CardDescription>Sales, purchase cost, COGS, expenses, and profit for each period</CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Retail</TableHead>
                <TableHead className="text-right">Dealer</TableHead>
                <TableHead className="text-right">Purchases</TableHead>
                <TableHead className="text-right">COGS</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead className="text-right">Bills</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No period data yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.slice().reverse().map((row) => (
                  <TableRow key={String(row.label)}>
                    <TableCell>{String(row.label)}</TableCell>
                    <TableCell className="text-right font-medium">{money(row.revenue)}</TableCell>
                    <TableCell className="text-right">{money(row.retail_revenue)}</TableCell>
                    <TableCell className="text-right">{money(row.dealer_revenue)}</TableCell>
                    <TableCell className="text-right">{money(row.purchase_cost)}</TableCell>
                    <TableCell className="text-right">{money(row.cogs)}</TableCell>
                    <TableCell className="text-right">{money(row.expense_amount)}</TableCell>
                    <TableCell className="text-right">{money(row.net_profit)}</TableCell>
                    <TableCell className="text-right">{Number(row.sale_count ?? 0)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
