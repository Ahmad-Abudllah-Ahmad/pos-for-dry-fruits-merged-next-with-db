"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Shop2BoldDuotoneIcon,
  TransferHorizontalBoldDuotoneIcon,
  WarehouseBoldDuotoneIcon,
} from "@/components/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { listItems, listStock, listStockPage, listSubledgers } from "@/api";
import { ApiError } from "@/api/client";
import { Button } from "@/components/common/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/common/card";
import { StockTablesSection } from "@/components/app/stock/StockTablesSection";
import { StockTransferModal } from "@/components/app/stock/StockTransferModal";
import { money } from "@/lib/format";
import { isAdminUser } from "@/lib/roles";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

const PAGE_SIZE = 10;
const EMPTY_PAGE = { items: [], total: 0, page: 1, page_size: PAGE_SIZE };

export function UserAppDashboard() {
  const router = useRouter();
  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const user = useAuthStore((s) => s.user);
  const admin = isAdminUser(user);

  const [shop, setShop] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [wh, setWh] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [shopPageData, setShopPageData] = useState(EMPTY_PAGE);
  const [warehousePageData, setWarehousePageData] = useState(EMPTY_PAGE);
  const [shopPage, setShopPage] = useState(1);
  const [warehousePage, setWarehousePage] = useState(1);
  const [items, setItems] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [subledgers, setSubledgers] = useState(/** @type {Array<Record<string, unknown>>} */ ([]));
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferDirection, setTransferDirection] = useState(
    /** @type {"warehouse_to_shop" | "shop_to_warehouse"} */ ("warehouse_to_shop")
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (activeId == null) {
      setShop([]);
      setWh([]);
      setShopPageData(EMPTY_PAGE);
      setWarehousePageData(EMPTY_PAGE);
      setItems([]);
      setSubledgers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const tasks = [
        listStock(activeId, "shop"),
        listStock(activeId, "warehouse"),
        listStockPage(activeId, { locationType: "shop", page: shopPage, pageSize: PAGE_SIZE }),
        listStockPage(activeId, { locationType: "warehouse", page: warehousePage, pageSize: PAGE_SIZE }),
      ];
      if (admin) {
        tasks.push(listItems(activeId, true), listSubledgers(activeId, { isActive: true }));
      }

      const [shopRows, warehouseRows, shopPaged, warehousePaged, itemsList, subledgersList] = await Promise.all(tasks);
      setShop(Array.isArray(shopRows) ? shopRows : []);
      setWh(Array.isArray(warehouseRows) ? warehouseRows : []);
      setShopPageData(shopPaged ?? EMPTY_PAGE);
      setWarehousePageData(warehousePaged ?? EMPTY_PAGE);
      setItems(Array.isArray(itemsList) ? itemsList : []);
      setSubledgers(Array.isArray(subledgersList) ? subledgersList : []);
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error("Failed to load stock");
      }
    } finally {
      setLoading(false);
    }
  }, [activeId, admin, shopPage, warehousePage]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user && !admin) {
      router.replace("/app/pos");
    }
  }, [admin, router, user]);

  const totalShop = shop.reduce((a, r) => a + parseFloat(String(r.stock_value ?? 0) || "0"), 0);
  const totalWh = wh.reduce((a, r) => a + parseFloat(String(r.stock_value ?? 0) || "0"), 0);

  if (user && !admin) {
    return null;
  }

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
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Shop stock value</CardTitle>
              <p className="text-2xl font-semibold tabular-nums tracking-tight [font-family:var(--font-outfit),system-ui,sans-serif]">
                {loading ? "-" : money(totalShop)}
              </p>
            </div>
            <Shop2BoldDuotoneIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          {admin && (
            <div className="px-5 pb-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTransferDirection("warehouse_to_shop");
                  setTransferOpen(true);
                }}
              >
                <TransferHorizontalBoldDuotoneIcon className="size-4" />
                Transfer to shop
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">Warehouse value</CardTitle>
              <p className="text-2xl font-semibold tabular-nums tracking-tight [font-family:var(--font-outfit),system-ui,sans-serif]">
                {loading ? "-" : money(totalWh)}
              </p>
            </div>
            <WarehouseBoldDuotoneIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          {admin && (
            <div className="px-5 pb-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTransferDirection("shop_to_warehouse");
                  setTransferOpen(true);
                }}
              >
                <TransferHorizontalBoldDuotoneIcon className="size-4" />
                Transfer to warehouse
              </Button>
            </div>
          )}
        </Card>
      </div>

      <StockTablesSection
        loading={loading}
        shopPageData={shopPageData}
        warehousePageData={warehousePageData}
        shopPage={shopPage}
        warehousePage={warehousePage}
        onShopPageChange={setShopPage}
        onWarehousePageChange={setWarehousePage}
      />

      {admin && (
        <StockTransferModal
          open={transferOpen}
          onOpenChange={setTransferOpen}
          workspaceId={activeId}
          items={items}
          subledgers={subledgers}
          initialDirection={transferDirection}
          onSuccess={load}
        />
      )}
    </div>
  );
}
