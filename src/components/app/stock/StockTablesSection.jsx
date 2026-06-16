"use client";

import {
  BoxMinimalisticBoldDuotoneIcon,
  Shop2BoldDuotoneIcon,
  WarehouseBoldDuotoneIcon,
} from "@/components/icons";

import { Card, CardContent } from "@/components/common/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { money, formatWeight } from "@/lib/format";
import { getItemName } from "@/lib/item-name";
import { StockPagination } from "./StockPagination";

/**
 * @param {{
 *   loading: boolean;
 *   shopPageData: { items: Array<Record<string, unknown>>; total: number; page: number; page_size: number };
 *   warehousePageData: { items: Array<Record<string, unknown>>; total: number; page: number; page_size: number };
 *   shopPage: number;
 *   warehousePage: number;
 *   onShopPageChange: (page: number) => void;
 *   onWarehousePageChange: (page: number) => void;
 * }} props
 */
export function StockTablesSection({
  loading,
  shopPageData,
  warehousePageData,
  shopPage,
  warehousePage,
  onShopPageChange,
  onWarehousePageChange,
}) {
  return (
    <Tabs defaultValue="shop" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="shop" className="gap-1.5">
          <Shop2BoldDuotoneIcon className="size-3.5" />
          Shop
        </TabsTrigger>
        <TabsTrigger value="warehouse" className="gap-1.5">
          <WarehouseBoldDuotoneIcon className="size-3.5" />
          Warehouse
        </TabsTrigger>
      </TabsList>
      <TabsContent value="shop">
        <StockTable
          rows={shopPageData.items}
          total={shopPageData.total}
          page={shopPage}
          pageSize={shopPageData.page_size}
          loading={loading}
          locationLabel="shop"
          onPageChange={onShopPageChange}
        />
      </TabsContent>
      <TabsContent value="warehouse">
        <StockTable
          rows={warehousePageData.items}
          total={warehousePageData.total}
          page={warehousePage}
          pageSize={warehousePageData.page_size}
          loading={loading}
          locationLabel="warehouse"
          onPageChange={onWarehousePageChange}
        />
      </TabsContent>
    </Tabs>
  );
}

/**
 * @param {{
 *   rows: Array<Record<string, unknown>>;
 *   total: number;
 *   page: number;
 *   pageSize: number;
 *   loading: boolean;
 *   locationLabel: string;
 *   onPageChange: (page: number) => void;
 * }} props
 */
function StockTable({ rows, total, page, pageSize, loading, locationLabel, onPageChange }) {
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
          <BoxMinimalisticBoldDuotoneIcon className="size-5" />
          No stock lines in {locationLabel} yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-2 overflow-hidden">
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
          {rows.map((row) => (
            <TableRow key={`${row.item_id}-${row.location_id}`}>
              <TableCell className="font-medium">{getItemName(/** @type {Record<string, string>} */ (row.item_name))}</TableCell>
              <TableCell className="text-right tabular-nums">{formatWeight(Number(row.quantity_grams ?? 0), "gram")}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">{money(row.average_unit_cost)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{money(row.stock_value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <StockPagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
    </Card>
  );
}
