import prisma from "./prisma";

export async function ensureDefaultStockLocations(workspaceId) {
  const existing = await prisma.stockLocation.findMany({ where: { workspace_id: workspaceId } });
  const types = new Set(existing.map((l) => l.type));
  if (!types.has("warehouse")) {
    await prisma.stockLocation.create({ data: { workspace_id: workspaceId, name: "Warehouse", type: "warehouse" } });
  }
  if (!types.has("shop")) {
    await prisma.stockLocation.create({ data: { workspace_id: workspaceId, name: "Shop", type: "shop" } });
  }
}

export async function getLocation(workspaceId, type) {
  let location = await prisma.stockLocation.findUnique({
    where: { uq_workspace_location_type: { workspace_id: workspaceId, type } },
  });
  if (!location) {
    await ensureDefaultStockLocations(workspaceId);
    location = await prisma.stockLocation.findUnique({
      where: { uq_workspace_location_type: { workspace_id: workspaceId, type } },
    });
  }
  return location;
}

export async function createMovement(data) {
  return prisma.stockMovement.create({ data });
}

export async function deleteMovementsForReference(workspaceId, type, referenceId) {
  await prisma.stockMovement.deleteMany({
    where: { workspace_id: workspaceId, type, reference_id: referenceId },
  });
}

export async function getItemStock(workspaceId, itemId, locationId) {
  const incoming = await prisma.stockMovement.aggregate({
    where: { workspace_id: workspaceId, item_id: itemId, to_location_id: locationId },
    _sum: { quantity_grams: true },
  });
  const outgoing = await prisma.stockMovement.aggregate({
    where: { workspace_id: workspaceId, item_id: itemId, from_location_id: locationId },
    _sum: { quantity_grams: true },
  });
  return (incoming._sum.quantity_grams || 0) - (outgoing._sum.quantity_grams || 0);
}

export async function buildInventoryState(workspaceId) {
  const purchases = await prisma.purchaseSlipItem.findMany({
    where: { purchase_slip: { workspace_id: workspaceId, status: "completed" } },
    select: { purchase_slip_id: true, item_id: true, total_cost: true, total_weight_grams: true },
  });
  
  const unitCosts = {};
  for (const p of purchases) {
    const key = `${p.purchase_slip_id}-${p.item_id}`;
    if (!unitCosts[key]) unitCosts[key] = { cost: 0, weight: 0 };
    unitCosts[key].cost += parseFloat(p.total_cost);
    unitCosts[key].weight += p.total_weight_grams;
  }
  const purchaseUnitCosts = {};
  for (const [key, val] of Object.entries(unitCosts)) {
    if (val.weight > 0) purchaseUnitCosts[key] = val.cost / val.weight;
  }

  const movements = await prisma.stockMovement.findMany({
    where: { workspace_id: workspaceId },
    orderBy: [{ created_at: "asc" }, { id: "asc" }],
  });

  const positions = {}; // item_id -> location_id -> { quantity_grams, value }
  const saleCostByReference = {}; // type-id -> cost

  const getPosition = (itemId, locId) => {
    if (!positions[itemId]) positions[itemId] = {};
    if (!positions[itemId][locId]) positions[itemId][locId] = { quantity_grams: 0, value: 0 };
    return positions[itemId][locId];
  };

  const consumeFromPosition = (position, qty) => {
    if (qty <= 0 || position.quantity_grams <= 0) return 0;
    const avgCost = position.quantity_grams > 0 ? position.value / position.quantity_grams : 0;
    const consumedValue = avgCost * qty;
    position.quantity_grams = Math.max(0, position.quantity_grams - qty);
    position.value = Math.max(0, position.value - consumedValue);
    return consumedValue;
  };

  for (const m of movements) {
    if (m.type === "purchase" && m.to_location_id !== null) {
      const pos = getPosition(m.item_id, m.to_location_id);
      const key = `${m.reference_id}-${m.item_id}`;
      const unitCost = purchaseUnitCosts[key] || 0;
      pos.quantity_grams += m.quantity_grams;
      pos.value += unitCost * m.quantity_grams;
      continue;
    }

    let consumedValue = 0;
    if (m.from_location_id !== null) {
      const fromPos = getPosition(m.item_id, m.from_location_id);
      consumedValue = consumeFromPosition(fromPos, m.quantity_grams);
    }

    if (m.to_location_id !== null) {
      const toPos = getPosition(m.item_id, m.to_location_id);
      toPos.quantity_grams += m.quantity_grams;
      if (m.type === "adjustment" && consumedValue === 0) {
        let inboundUnitCost = 0;
        const itemPositions = positions[m.item_id] || {};
        let totalQty = 0;
        let totalVal = 0;
        for (const p of Object.values(itemPositions)) {
          totalQty += p.quantity_grams;
          totalVal += p.value;
        }
        if (totalQty > 0) inboundUnitCost = totalVal / totalQty;
        consumedValue = inboundUnitCost * m.quantity_grams;
      }
      toPos.value += consumedValue;
    }

    if (m.type === "sale" && m.reference_id !== null) {
      const refId = Number(m.reference_id);
      const type = refId < 0 ? "ledger" : "sale";
      const id = Math.abs(refId);
      const key = `${type}-${id}`;
      saleCostByReference[key] = (saleCostByReference[key] || 0) + consumedValue;
    }
  }

  return { positions, saleCostByReference };
}

export async function getStockBalances(workspaceId, locationType = null) {
  const { positions } = await buildInventoryState(workspaceId);
  const items = await prisma.item.findMany({ where: { workspace_id: workspaceId } });
  const itemMap = Object.fromEntries(items.map(i => [i.id, i.name]));
  const locations = await prisma.stockLocation.findMany({ where: { workspace_id: workspaceId } });
  const locMap = Object.fromEntries(locations.map(l => [l.id, l]));

  const balances = [];
  for (const [itemIdStr, byLoc] of Object.entries(positions)) {
    const itemId = parseInt(itemIdStr, 10);
    const itemName = itemMap[itemId];
    if (!itemName) continue;

    for (const [locIdStr, pos] of Object.entries(byLoc)) {
      const locId = parseInt(locIdStr, 10);
      const loc = locMap[locId];
      if (!loc) continue;
      if (locationType && loc.type !== locationType) continue;
      if (pos.quantity_grams <= 0 && pos.value === 0) continue;

      balances.push({
        item_id: itemId,
        item_name: itemName,
        location_id: loc.id,
        location_type: loc.type,
        quantity_grams: pos.quantity_grams,
        average_unit_cost: pos.quantity_grams > 0 ? pos.value / pos.quantity_grams : 0,
        stock_value: pos.value,
      });
    }
  }

  balances.sort((a, b) => {
    if (a.item_id !== b.item_id) return a.item_id - b.item_id;
    return a.location_type.localeCompare(b.location_type);
  });

  return balances;
}
