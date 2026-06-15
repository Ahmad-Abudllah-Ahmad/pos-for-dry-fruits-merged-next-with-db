"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { listItemsPage, listSubledgersPage, listWorkspaces } from "@/api";
import { ApiError } from "@/api/client";
import { Button } from "@/components/common/button";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { getItemName } from "@/lib/item-name";
import { ItemFormModal } from "./ItemFormModal";
import { ItemsSummaryCards } from "./ItemsSummaryCards";
import { ItemsTablesSection } from "./ItemsTablesSection";
import { SubledgerFormModal } from "./SubledgerFormModal";

const PAGE_SIZE = 10;
const EMPTY_PAGE = { items: [], total: 0, page: 1, page_size: PAGE_SIZE };

export function AdminItemsPage() {
  const { activeWorkspaceId, setWorkspaces, setActiveWorkspaceId } = useWorkspaceStore();
  const [itemsPage, setItemsPage] = useState(EMPTY_PAGE);
  const [variantsPage, setVariantsPage] = useState(EMPTY_PAGE);
  const [allActiveItems, setAllActiveItems] = useState(/** @type {Array<Record<string, unknown>>} */([]));
  const [activeTab, setActiveTab] = useState("items");
  const [itemPage, setItemPage] = useState(1);
  const [variantPage, setVariantPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingVariant, setEditingVariant] = useState(null);

  const workspaceId = activeWorkspaceId;

  const itemLookup = useMemo(
    () => new Map(allActiveItems.map((item) => [Number(item.id), getItemName(/** @type {Record<string, string>} */ (item.name))])),
    [allActiveItems]
  );

  const loadWorkspaces = useCallback(async () => {
    const data = await listWorkspaces();
    if (!Array.isArray(data)) return;
    setWorkspaces(data);
    if (data.length > 0 && !data.some((workspace) => workspace.id === activeWorkspaceId)) {
      setActiveWorkspaceId(data[0].id);
    }
  }, [activeWorkspaceId, setActiveWorkspaceId, setWorkspaces]);

  const loadData = useCallback(async () => {
    if (workspaceId == null) {
      setItemsPage(EMPTY_PAGE);
      setVariantsPage(EMPTY_PAGE);
      setAllActiveItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [itemsData, variantsData, allItemsData] = await Promise.all([
        listItemsPage(workspaceId, { page: itemPage, pageSize: PAGE_SIZE, isActive: true }),
        listSubledgersPage(workspaceId, { page: variantPage, pageSize: PAGE_SIZE, isActive: true }),
        listItemsPage(workspaceId, { page: 1, pageSize: 500, isActive: true }),
      ]);
      setItemsPage(itemsData ?? EMPTY_PAGE);
      setVariantsPage(variantsData ?? EMPTY_PAGE);
      setAllActiveItems(Array.isArray(allItemsData?.items) ? allItemsData.items : []);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [itemPage, variantPage, workspaceId]);

  useEffect(() => {
    (async () => {
      try {
        await loadWorkspaces();
      } catch (err) {
        if (err instanceof ApiError) toast.error(err.message);
      }
    })();
  }, [loadWorkspaces]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreateItem() {
    setEditingItem(null);
    setItemModalOpen(true);
  }

  function openEditItem(item) {
    setEditingItem(item);
    setItemModalOpen(true);
  }

  function openCreateVariant() {
    setEditingVariant(null);
    setVariantModalOpen(true);
  }

  function openEditVariant(subledger) {
    setEditingVariant(subledger);
    setVariantModalOpen(true);
  }

  async function refreshAll() {
    try {
      await loadWorkspaces();
      await loadData();
      toast.success("Items data refreshed");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight [font-family:var(--font-outfit),system-ui,sans-serif]">
            Items Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage main items and item variants from one dedicated admin page.
          </p>
        </div>
        <Button variant="outline" onClick={refreshAll} disabled={loading}>
          <RefreshCw className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <ItemsSummaryCards
        itemTotal={itemsPage.total}
        variantTotal={variantsPage.total}
        onAddItem={openCreateItem}
        onAddVariant={openCreateVariant}
      />

      <ItemsTablesSection
        workspaceId={workspaceId ?? 0}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        itemsPage={itemsPage}
        variantsPage={variantsPage}
        itemLookup={itemLookup}
        onEditItem={openEditItem}
        onEditVariant={openEditVariant}
        onItemPageChange={setItemPage}
        onVariantPageChange={setVariantPage}
        onRefresh={loadData}
      />

      {workspaceId != null && (
        <>
          <ItemFormModal
            open={itemModalOpen}
            onOpenChange={setItemModalOpen}
            workspaceId={workspaceId}
            item={editingItem}
            onSuccess={loadData}
          />
          <SubledgerFormModal
            open={variantModalOpen}
            onOpenChange={setVariantModalOpen}
            workspaceId={workspaceId}
            items={allActiveItems}
            subledger={editingVariant}
            onSuccess={loadData}
          />
        </>
      )}
    </div>
  );
}
