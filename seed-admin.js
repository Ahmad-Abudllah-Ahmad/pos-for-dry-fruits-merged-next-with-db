require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("./src/lib/prisma-client/index.js");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("Laofigna@2550", 10);

  const admin = await prisma.user.upsert({
    where: { phone_number: "03183400848" },
    update: {
      name: "Al Rohani Admin",
      address: "Al Rohani",
      hashed_password: hashedPassword,
      role: "Admin",
      is_active: true,
    },
    create: {
      name: "Al Rohani Admin",
      cnic_number: "99999-0318340-8",
      phone_number: "03183400848",
      address: "Al Rohani",
      hashed_password: hashedPassword,
      role: "Admin",
      is_active: true,
    },
  });

  console.log("Admin seed complete:", {
    id: admin.id,
    name: admin.name,
    phone_number: admin.phone_number,
    role: admin.role,
    is_active: admin.is_active,
  });
}

main()
  .catch((error) => {
    console.error("Failed to seed admin user.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
