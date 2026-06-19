import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request) {
  try {
    console.log("Seeding dummy data...");

    // 1. Create a dummy admin user
    const admin = await prisma.user.upsert({
      where: { phone_number: "03001234567" },
      update: {},
      create: {
        name: "Admin User",
        cnic_number: "12345-1234567-1",
        phone_number: "03001234567",
        address: "123 Main St, Tech City",
        hashed_password: hashPassword("password123"),
        role: "Admin",
        is_active: true,
      },
    });

    // 2. Create a dummy workspace
    let workspace = await prisma.workspace.findFirst({ where: { name: "Main Store Workspace" } });
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          name: "Main Store Workspace",
          description: "Default workspace for the store",
          created_by_id: admin.id,
        },
      });
      
      await prisma.workspaceMember.create({
        data: {
          workspace_id: workspace.id,
          user_id: admin.id,
          role: "Admin",
        },
      });

      // 4. Create stock locations
      const warehouse = await prisma.stockLocation.create({
        data: {
          workspace_id: workspace.id,
          name: "Main Warehouse",
          type: "warehouse",
        },
      });
      const shop = await prisma.stockLocation.create({
        data: {
          workspace_id: workspace.id,
          name: "Front Shop",
          type: "shop",
        },
      });

      // 5. Create some items
      const item1 = await prisma.item.create({
        data: {
          workspace_id: workspace.id,
          name: { en: "iPhone 15 Pro", ur: "آئی فون 15 پرو" },
          unit_type: "kg",
        },
      });
      const item2 = await prisma.item.create({
        data: {
          workspace_id: workspace.id,
          name: { en: "Samsung Galaxy S24", ur: "سیمسنگ گلیکسی ایس 24" },
          unit_type: "kg",
        },
      });

      // 6. Create subledgers (variants/colors)
      const subledger1 = await prisma.subledger.create({
        data: {
          workspace_id: workspace.id,
          item_id: item1.id,
          name: { en: "Black Titanium 256GB" },
          unit_price: 350000,
        },
      });
      const subledger2 = await prisma.subledger.create({
        data: {
          workspace_id: workspace.id,
          item_id: item2.id,
          name: { en: "Phantom Black 512GB" },
          unit_price: 300000,
        },
      });

      // 7. Add some inventory via a Purchase Slip
      const purchase = await prisma.purchaseSlip.create({
        data: {
          workspace_id: workspace.id,
          supplier_name: "Tech Wholesalers Inc.",
          location_id: warehouse.id,
          created_by_id: admin.id,
          total_amount: 1950000,
          payment_method: "cash",
          payment_status: "paid",
          status: "completed",
        },
      });

      await prisma.purchaseSlipItem.createMany({
        data: [
          {
            purchase_slip_id: purchase.id,
            item_id: item1.id,
            subledger_id: subledger1.id,
            package_weight_grams: 500,
            quantity: 3,
            total_weight_grams: 1500,
            unit_cost: 350000,
            total_cost: 1050000,
          },
          {
            purchase_slip_id: purchase.id,
            item_id: item2.id,
            subledger_id: subledger2.id,
            package_weight_grams: 500,
            quantity: 3,
            total_weight_grams: 1500,
            unit_cost: 300000,
            total_cost: 900000,
          },
        ],
      });

      await prisma.purchasePayment.create({
        data: {
          purchase_slip_id: purchase.id,
          amount: 1950000,
          payment_method: "cash",
          note: "Full payment upfront",
        },
      });

      const refId = BigInt(purchase.id);
      
      await prisma.stockMovement.createMany({
        data: [
          {
            workspace_id: workspace.id,
            item_id: item1.id,
            subledger_id: subledger1.id,
            quantity: 3,
            quantity_grams: 1500,
            type: "purchase",
            to_location_id: warehouse.id,
            reference_id: refId,
          },
          {
            workspace_id: workspace.id,
            item_id: item2.id,
            subledger_id: subledger2.id,
            quantity: 3,
            quantity_grams: 1500,
            type: "purchase",
            to_location_id: warehouse.id,
            reference_id: refId,
          },
        ],
      });
    }

    return jsonResponse({
      message: "Seeding complete",
      credentials: { phone: "03001234567", password: "password123" }
    });
  } catch (error) {
    console.error(error);
    return errorResponse(error.message, 500);
  }
}
