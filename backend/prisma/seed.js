import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Starting database seed...");

  // ============================================================
  // USERS
  // ============================================================

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const salesPassword = await bcrypt.hash("Sales@123", 10);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@erp.com",
    },
    update: {
      name: "ERP Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
    create: {
      name: "ERP Admin",
      email: "admin@erp.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  const salesUser = await prisma.user.upsert({
    where: {
      email: "sales@erp.com",
    },
    update: {
      name: "Sales User",
      passwordHash: salesPassword,
      role: "SALES_USER",
    },
    create: {
      name: "Sales User",
      email: "sales@erp.com",
      passwordHash: salesPassword,
      role: "SALES_USER",
    },
  });

  // ============================================================
  // PRODUCTS
  // ============================================================

  const products = [
    {
      productCode: "IP-001",
      productName: "Industrial Hydraulic Pump",
      category: "Hydraulics",
      unit: "PCS",
      basePrice: 18500,
      physicalQuantity: 200,
    },
    {
      productCode: "IP-002",
      productName: "Heavy Duty Electric Motor",
      category: "Electrical",
      unit: "PCS",
      basePrice: 32500,
      physicalQuantity: 120,
    },
    {
      productCode: "IP-003",
      productName: "Industrial Gearbox",
      category: "Mechanical",
      unit: "PCS",
      basePrice: 42000,
      physicalQuantity: 80,
    },
    {
      productCode: "IP-004",
      productName: "Stainless Steel Valve",
      category: "Valves",
      unit: "PCS",
      basePrice: 6800,
      physicalQuantity: 300,
    },
    {
      productCode: "IP-005",
      productName: "Industrial Pressure Gauge",
      category: "Instrumentation",
      unit: "PCS",
      basePrice: 2450,
      physicalQuantity: 250,
    },
    {
      productCode: "IP-006",
      productName: "Pneumatic Control Cylinder",
      category: "Pneumatics",
      unit: "PCS",
      basePrice: 9200,
      physicalQuantity: 150,
    },
  ];

  // ============================================================
  // PRODUCTS + INVENTORY
  // ============================================================

  for (const data of products) {
    const product = await prisma.product.upsert({
      where: {
        productCode: data.productCode,
      },
      update: {
        productName: data.productName,
        category: data.category,
        unit: data.unit,
        basePrice: data.basePrice,
      },
      create: {
        productCode: data.productCode,
        productName: data.productName,
        category: data.category,
        unit: data.unit,
        basePrice: data.basePrice,
      },
    });

    await prisma.inventory.upsert({
      where: {
        productId: product.id,
      },
      update: {
        physicalQuantity: data.physicalQuantity,
        reservedQuantity: 0,
      },
      create: {
        productId: product.id,
        physicalQuantity: data.physicalQuantity,
        reservedQuantity: 0,
      },
    });
  }

  console.log("");
  console.log("========================================");
  console.log("DATABASE SEED COMPLETED");
  console.log("========================================");

  console.log("");
  console.log("ADMIN LOGIN");
  console.log("Email: admin@erp.com");
  console.log("Password: Admin@123");

  console.log("");
  console.log("SALES USER LOGIN");
  console.log("Email: sales@erp.com");
  console.log("Password: Sales@123");

  console.log("");
  console.log("Products created:", products.length);

  console.log("========================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("DATABASE SEED FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
