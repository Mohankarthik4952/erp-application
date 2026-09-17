import prisma from "../lib/prisma.js";

// ============================================================
// CREATE CUSTOMER
// ============================================================

export const createCustomer = async (req, res) => {
  try {
    const { companyName, contactPerson, mobile, email, city } = req.body;

    if (!companyName || !contactPerson || !mobile || !email || !city) {
      return res.status(400).json({
        success: false,
        message:
          "companyName, contactPerson, mobile, email and city are required",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        mobile: mobile.trim(),
        email: email.toLowerCase().trim(),
        city: city.trim(),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// GET CUSTOMERS
// ============================================================

export const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// GET PRODUCTS
// ============================================================

export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        id: "asc",
      },

      include: {
        inventory: true,
      },
    });

    const formattedProducts = products.map((product) => {
      const physicalQuantity = product.inventory?.physicalQuantity ?? 0;

      const reservedQuantity = product.inventory?.reservedQuantity ?? 0;

      return {
        id: product.id,
        productCode: product.productCode,
        productName: product.productName,
        category: product.category,
        unit: product.unit,
        basePrice: Number(product.basePrice),

        physicalQuantity,
        reservedQuantity,

        availableQuantity: physicalQuantity - reservedQuantity,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedProducts,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// CREATE PRODUCT
// ADMIN ONLY
// ============================================================

export const createProduct = async (req, res) => {
  try {
    const {
      productCode,
      productName,
      category,
      unit,
      basePrice,
      physicalQuantity,
    } = req.body;

    // --------------------------------------------------------
    // REQUIRED FIELDS
    // --------------------------------------------------------

    if (
      !productCode ||
      !productName ||
      !category ||
      !unit ||
      basePrice === undefined ||
      physicalQuantity === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "productCode, productName, category, unit, basePrice and physicalQuantity are required",
      });
    }

    // --------------------------------------------------------
    // NORMALIZE VALUES
    // --------------------------------------------------------

    const normalizedCode = productCode.trim().toUpperCase();

    const normalizedName = productName.trim();

    const normalizedCategory = category.trim();

    const normalizedUnit = unit.trim();

    const parsedPrice = Number(basePrice);

    const parsedQuantity = Number(physicalQuantity);

    // --------------------------------------------------------
    // VALIDATE PRICE
    // --------------------------------------------------------

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Base price must be a valid non-negative number",
      });
    }

    // --------------------------------------------------------
    // VALIDATE QUANTITY
    // --------------------------------------------------------

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Physical quantity must be a non-negative integer",
      });
    }

    // --------------------------------------------------------
    // CHECK DUPLICATE PRODUCT CODE
    // --------------------------------------------------------

    const existingProduct = await prisma.product.findUnique({
      where: {
        productCode: normalizedCode,
      },
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product code already exists",
      });
    }

    // --------------------------------------------------------
    // CREATE PRODUCT + INVENTORY TRANSACTION
    // --------------------------------------------------------

    const createdProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          productCode: normalizedCode,

          productName: normalizedName,

          category: normalizedCategory,

          unit: normalizedUnit,

          basePrice: parsedPrice.toFixed(2),
        },
      });

      await tx.inventory.create({
        data: {
          productId: product.id,

          physicalQuantity: parsedQuantity,

          reservedQuantity: 0,
        },
      });

      return product;
    });

    // --------------------------------------------------------
    // GET COMPLETE PRODUCT
    // --------------------------------------------------------

    const product = await prisma.product.findUnique({
      where: {
        id: createdProduct.id,
      },

      include: {
        inventory: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        id: product.id,
        productCode: product.productCode,
        productName: product.productName,
        category: product.category,
        unit: product.unit,
        basePrice: Number(product.basePrice),

        physicalQuantity: product.inventory?.physicalQuantity ?? 0,

        reservedQuantity: product.inventory?.reservedQuantity ?? 0,

        availableQuantity:
          (product.inventory?.physicalQuantity ?? 0) -
          (product.inventory?.reservedQuantity ?? 0),
      },
    });
  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// GET INVENTORY
// ============================================================

export const getInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      orderBy: {
        productId: "asc",
      },

      include: {
        product: true,
      },
    });

    const formattedInventory = inventory.map((item) => {
      const physicalQuantity = Number(item.physicalQuantity ?? 0);

      const reservedQuantity = Number(item.reservedQuantity ?? 0);

      return {
        id: item.id,

        productId: item.productId,

        productCode: item.product?.productCode ?? "-",

        productName: item.product?.productName ?? "-",

        category: item.product?.category ?? "-",

        unit: item.product?.unit ?? "-",

        basePrice: Number(item.product?.basePrice ?? 0),

        physicalQuantity,

        reservedQuantity,

        availableQuantity: physicalQuantity - reservedQuantity,

        updatedAt: item.updatedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedInventory,
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
