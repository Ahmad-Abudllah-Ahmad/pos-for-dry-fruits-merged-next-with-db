"use client";

import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteItem, deleteSubledger } from "@/api";
import { ApiError } from "@/api/client";
import { Button } from "@/components/common/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getItemName } from "@/lib/item-name";
import { ItemsPagination } from "./ItemsPagination";

/**
 * @param {{
 *   workspaceId: number;
 *   activeTab: string;
 *   onTabChange: (tab: string) => void;
 *   itemsPage: { items: Array<Record<string, unknown>>; total: number; page: number; page_size: number };
 *   variantsPage: { items: Array<Record<string, unknown>>; total: number; page: number; page_size: number };
 *   itemLookup: Map<number, string>;
 *   onEditItem: (item: Record<string, unknown>) => void;
 *   onEditVariant: (subledger: Record<string, unknown>) => void;
 *   onItemPageChange: (page: number) => void;
 *   onVariantPageChange: (page: number) => void;
 *   onRefresh: () => void;
 * }} props
 */
export function ItemsTablesSection({
  workspaceId,
  activeTab,
  onTabChange,
  itemsPage,
  variantsPage,
  itemLookup,
  onEditItem,
  onEditVariant,
  onItemPageChange,
  onVariantPageChange,
  onRefresh,
}) {
  async function handleDeleteItem(item) {
    if (!window.confirm("Delete this main item? Its linked variants will also be deleted.")) return;
    try {
      await deleteItem(workspaceId, Number(item.id));
      toast.success("Main item deleted with its linked variants");
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  async function handleDeleteVariant(subledger) {
    if (!window.confirm("Delete this item variant?")) return;
    try {
      await deleteSubledger(workspaceId, Number(subledger.id));
      toast.success("Item variant deleted");
      onRefresh();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }

  return (
    <Card className="overflow-hidden">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Items Directory</CardTitle>
          <TabsList className="hidden md:inline-flex">
            <TabsTrigger value="items">Main Items</TabsTrigger>
            <TabsTrigger value="variants">Items Variants</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-5 pb-4 md:hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="items">Main Items</TabsTrigger>
              <TabsTrigger value="variants">Items Variants</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="items" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Main Item</TableHead>
                  <TableHead>Urdu Name</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsPage.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No main items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  itemsPage.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{String(item?.name?.en ?? "-")}</TableCell>
                      <TableCell>{String(item?.name?.ur ?? "-")}</TableCell>
                      <TableCell className="uppercase">{String(item.unit_type ?? "-")}</TableCell>
                      <TableCell>{item.is_active === false ? "Inactive" : "Active"}</TableCell>
                      <TableCell>{String(item.created_at ?? "").slice(0, 10)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="iconSm" onClick={() => onEditItem(item)} aria-label="Edit main item">
                            <Pencil />
                          </Button>
                          <Button variant="destructive" size="iconSm" onClick={() => handleDeleteItem(item)} aria-label="Delete main item">
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ItemsPagination
              page={itemsPage.page}
              pageSize={itemsPage.page_size}
              total={itemsPage.total}
              onPageChange={onItemPageChange}
            />
          </TabsContent>

          <TabsContent value="variants" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead>Urdu Name</TableHead>
                  <TableHead>Parent Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[120px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variantsPage.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No item variants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  variantsPage.items.map((subledger) => (
                    <TableRow key={subledger.id}>
                      <TableCell className="font-medium">{String(subledger?.name?.en ?? "-")}</TableCell>
                      <TableCell>{String(subledger?.name?.ur ?? "-")}</TableCell>
                      <TableCell>{itemLookup.get(Number(subledger.item_id)) ?? getItemName(null)}</TableCell>
                      <TableCell>{subledger.is_active === false ? "Inactive" : "Active"}</TableCell>
                      <TableCell>{String(subledger.created_at ?? "").slice(0, 10)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="iconSm" onClick={() => onEditVariant(subledger)} aria-label="Edit item variant">
                            <Pencil />
                          </Button>
                          <Button variant="destructive" size="iconSm" onClick={() => handleDeleteVariant(subledger)} aria-label="Delete item variant">
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ItemsPagination
              page={variantsPage.page}
              pageSize={variantsPage.page_size}
              total={variantsPage.total}
              onPageChange={onVariantPageChange}
            />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
