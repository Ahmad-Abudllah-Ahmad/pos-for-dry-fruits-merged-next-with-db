import { PrismaClient } from "./src/generated/prisma/client.ts";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.upsert({
    where: { phone_number: "03001234567" },
    update: {},
    create: {
      name: "Admin User", cnic_number: "12345-1234567-1", phone_number: "03001234567",
      address: "123 Main St, Tech City", hashed_password: hashedPassword, role: "Admin", is_active: true
    }
  });
  console.log("Created admin user:", admin.name);

  let workspace = await prisma.workspace.findFirst({ where: { name: "Main Store Workspace" } });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: { name: "Main Store Workspace", description: "Default workspace", created_by_id: admin.id },
    });
    console.log("Created workspace:", workspace.name);
    await prisma.workspaceMember.create({ data: { workspace_id: workspace.id, user_id: admin.id, role: "Admin" } });
    const warehouse = await prisma.stockLocation.create({ data: { workspace_id: workspace.id, name: "Main Warehouse", type: "warehouse" } });
    const shop = await prisma.stockLocation.create({ data: { workspace_id: workspace.id, name: "Front Shop", type: "shop" } });
    
    const item1 = await prisma.item.create({ data: { workspace_id: workspace.id, name: { en: "iPhone 15 Pro", ur: "آئی فون 15 پرو" }, unit_type: "kg" } });
    const item2 = await prisma.item.create({ data: { workspace_id: workspace.id, name: { en: "Samsung Galaxy S24", ur: "سیمسنگ گلیکسی ایس 24" }, unit_type: "kg" } });

    const subledger1 = await prisma.subledger.create({ data: { workspace_id: workspace.id, item_id: item1.id, name: { en: "Black Titanium 256GB" }, unit_price: 350000 } });
    const subledger2 = await prisma.subledger.create({ data: { workspace_id: workspace.id, item_id: item2.id, name: { en: "Phantom Black 512GB" }, unit_price: 300000 } });

    const purchase = await prisma.purchaseSlip.create({
      data: {
        workspace_id: workspace.id, supplier_name: "Tech Wholesalers Inc.", location_id: warehouse.id, created_by_id: admin.id,
        total_amount: 1950000, payment_method: "cash", payment_status: "paid", status: "completed",
      },
    });

    await prisma.purchaseSlipItem.createMany({
      data: [
        { purchase_slip_id: purchase.id, item_id: item1.id, subledger_id: subledger1.id, package_weight_grams: 500, quantity: 3, total_weight_grams: 1500, unit_cost: 350000, total_cost: 1050000 },
        { purchase_slip_id: purchase.id, item_id: item2.id, subledger_id: subledger2.id, package_weight_grams: 500, quantity: 3, total_weight_grams: 1500, unit_cost: 300000, total_cost: 900000 },
      ],
    });

    await prisma.purchasePayment.create({ data: { purchase_slip_id: purchase.id, amount: 1950000, payment_method: "cash", note: "Full payment" } });

    const refId = BigInt(purchase.id);
    await prisma.stockMovement.createMany({
      data: [
        { workspace_id: workspace.id, item_id: item1.id, subledger_id: subledger1.id, quantity: 3, quantity_grams: 1500, type: "purchase", to_location_id: warehouse.id, reference_id: refId },
        { workspace_id: workspace.id, item_id: item2.id, subledger_id: subledger2.id, quantity: 3, quantity_grams: 1500, type: "purchase", to_location_id: warehouse.id, reference_id: refId },
      ],
    });
    console.log("Added dummy inventory and purchases");
  } else {
    console.log("Workspace already exists, skipping inventory seed");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
