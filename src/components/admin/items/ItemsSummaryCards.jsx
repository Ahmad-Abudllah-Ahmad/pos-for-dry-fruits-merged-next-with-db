"use client";

import { AddCircleBoldDuotoneIcon, BoxBoldDuotoneIcon, LayersBoldDuotoneIcon } from "@/components/icons";

import { Button } from "@/components/common/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/card";

/**
 * @param {{
 *   itemTotal: number;
 *   variantTotal: number;
 *   onAddItem: () => void;
 *   onAddVariant: () => void;
 * }} props
 */
export function ItemsSummaryCards({ itemTotal, variantTotal, onAddItem, onAddVariant }) {
  const cards = [
    {
      title: "Main Items",
      description: "All parent products available in this workspace.",
      value: itemTotal,
      icon: BoxBoldDuotoneIcon,
      action: "Add Main Item",
      onClick: onAddItem,
    },
    {
      title: "Items Variants",
      description: "All variants linked under main items.",
      value: variantTotal,
      icon: LayersBoldDuotoneIcon,
      action: "Add Item Variant",
      onClick: onAddVariant,
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="overflow-hidden border-border/90 shadow-[0_18px_50px_rgba(28,25,23,0.06)]">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-700">
                <Icon className="size-5" />
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-semibold tracking-tight [font-family:var(--font-outfit),system-ui,sans-serif]">
                  {card.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Live total</p>
              </div>
              <Button onClick={card.onClick}>
                <AddCircleBoldDuotoneIcon />
                {card.action}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
