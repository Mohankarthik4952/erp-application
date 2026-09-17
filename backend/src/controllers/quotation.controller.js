import prisma from "../lib/prisma.js";

// ============================================================
// CREATE QUOTATION
// ============================================================

export const createQuotation = async (req, res) => {
  try {
    const { enquiryId, validUntil, items } = req.body;

    if (
      !enquiryId ||
      !validUntil ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "enquiryId, validUntil and at least one item are required",
      });
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: {
        id: Number(enquiryId),
      },
      include: {
        items: true,
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    if (enquiry.status !== "NEW") {
      return res.status(400).json({
        success: false,
        message: "Quotation can only be created for a NEW enquiry",
      });
    }

    // --------------------------------------------------------
    // Validate quotation items against enquiry items
    // --------------------------------------------------------

    const enquiryItemsMap = new Map(
      enquiry.items.map((item) => [
        Number(item.productId),
        Number(item.quantity),
      ]),
    );

    const quotationProductIds = new Set();

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Each quotation item must have a valid productId and positive quantity",
        });
      }

      if (quotationProductIds.has(productId)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate product ${productId} is not allowed`,
        });
      }

      quotationProductIds.add(productId);

      const enquiryQuantity = enquiryItemsMap.get(productId);

      if (!enquiryQuantity) {
        return res.status(400).json({
          success: false,
          message: `Product ${productId} is not part of the enquiry`,
        });
      }

      if (quantity > enquiryQuantity) {
        return res.status(400).json({
          success: false,
          message: `Quotation quantity for product ${productId} cannot exceed enquiry quantity ${enquiryQuantity}`,
        });
      }
    }

    // --------------------------------------------------------
    // Validate products and calculate quotation
    // --------------------------------------------------------

    let grandTotal = 0;

    const quotationItems = [];

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      const unitPrice = Number(item.unitPrice);
      const discountPct =
        item.discountPct === undefined ? 0 : Number(item.discountPct);
      const gstPct = item.gstPct === undefined ? 0 : Number(item.gstPct);

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid unit price for product ${productId}`,
        });
      }

      if (
        !Number.isFinite(discountPct) ||
        discountPct < 0 ||
        discountPct > 100
      ) {
        return res.status(400).json({
          success: false,
          message: `Discount must be between 0 and 100 for product ${productId}`,
        });
      }

      if (!Number.isFinite(gstPct) || gstPct < 0 || gstPct > 100) {
        return res.status(400).json({
          success: false,
          message: `GST must be between 0 and 100 for product ${productId}`,
        });
      }

      const product = await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${productId} not found`,
        });
      }

      const baseAmount = quantity * unitPrice;

      const discountAmount = (baseAmount * discountPct) / 100;

      const taxableAmount = baseAmount - discountAmount;

      const gstAmount = (taxableAmount * gstPct) / 100;

      const lineAmount = taxableAmount + gstAmount;

      grandTotal += lineAmount;

      quotationItems.push({
        productId,
        quantity,
        unitPrice: unitPrice.toFixed(2),
        discountPct: discountPct.toFixed(2),
        gstPct: gstPct.toFixed(2),
        lineAmount: lineAmount.toFixed(2),
      });
    }

    // --------------------------------------------------------
    // Validate date
    // --------------------------------------------------------

    const validUntilDate = new Date(validUntil);

    if (Number.isNaN(validUntilDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid validUntil date",
      });
    }

    // --------------------------------------------------------
    // Create quotation transaction
    // --------------------------------------------------------

    const quotation = await prisma.$transaction(async (tx) => {
      const createdQuotation = await tx.quotation.create({
        data: {
          quotationNo: `QUO-${Date.now()}`,
          enquiryId: enquiry.id,
          customerId: enquiry.customerId,
          createdById: req.user.id,
          validUntil: validUntilDate,
          status: "DRAFT",
          grandTotal: grandTotal.toFixed(2),

          items: {
            create: quotationItems,
          },
        },

        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
          enquiry: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      await tx.enquiry.update({
        where: {
          id: enquiry.id,
        },
        data: {
          status: "QUOTED",
        },
      });

      return createdQuotation;
    });

    return res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      data: quotation,
    });
  } catch (error) {
    console.error("Create quotation error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// GET ALL QUOTATIONS
// ============================================================

export const getQuotations = async (req, res) => {
  try {
    const quotations = await prisma.quotation.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        customer: true,

        enquiry: {
          select: {
            id: true,
            enquiryNo: true,
            status: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        items: {
          include: {
            product: true,
          },
        },

        order: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: quotations,
    });
  } catch (error) {
    console.error("Get quotations error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// GET QUOTATION BY ID
// ============================================================

export const getQuotationById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const quotation = await prisma.quotation.findUnique({
      where: {
        id,
      },

      include: {
        customer: true,

        enquiry: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        items: {
          include: {
            product: true,
          },
        },

        order: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: quotation,
    });
  } catch (error) {
    console.error("Get quotation by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// UPDATE QUOTATION STATUS
// ============================================================

export const updateQuotationStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED"];

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation status",
      });
    }

    const quotation = await prisma.quotation.findUnique({
      where: {
        id,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    // --------------------------------------------------------
    // State machine
    // DRAFT -> SENT
    // SENT -> ACCEPTED / REJECTED
    // ACCEPTED -> no transition
    // REJECTED -> no transition
    // --------------------------------------------------------

    const validTransitions = {
      DRAFT: ["SENT"],
      SENT: ["ACCEPTED", "REJECTED"],
      ACCEPTED: [],
      REJECTED: [],
    };

    if (!validTransitions[quotation.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid quotation status transition from ${quotation.status} to ${status}`,
      });
    }

    const updatedQuotation = await prisma.quotation.update({
      where: {
        id,
      },

      data: {
        status,
      },

      include: {
        customer: true,
        enquiry: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Quotation status changed to ${status}`,
      data: updatedQuotation,
    });
  } catch (error) {
    console.error("Update quotation status error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// CONVERT ACCEPTED QUOTATION TO SALES ORDER
// ============================================================

export const convertQuotation = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quotation ID",
      });
    }

    const quotation = await prisma.quotation.findUnique({
      where: {
        id,
      },

      include: {
        items: true,
      },
    });

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: "Quotation not found",
      });
    }

    if (quotation.status !== "ACCEPTED") {
      return res.status(400).json({
        success: false,
        message: "Only ACCEPTED quotations can be converted to sales orders",
      });
    }

    const existingOrder = await prisma.salesOrder.findUnique({
      where: {
        quotationId: quotation.id,
      },
    });

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        message: "Sales order already exists for this quotation",
        data: existingOrder,
      });
    }

    if (!quotation.items.length) {
      return res.status(400).json({
        success: false,
        message: "Quotation has no items",
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.salesOrder.create({
        data: {
          orderNo: `SO-${Date.now()}`,
          quotationId: quotation.id,
          customerId: quotation.customerId,
          totalAmount: quotation.grandTotal,
          status: "PENDING",

          items: {
            create: quotation.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },

        include: {
          customer: true,
          quotation: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      await tx.enquiry.update({
        where: {
          id: quotation.enquiryId,
        },
        data: {
          status: "WON",
        },
      });

      return createdOrder;
    });

    return res.status(201).json({
      success: true,
      message: "Quotation converted to sales order successfully",
      data: order,
    });
  } catch (error) {
    console.error("Convert quotation error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
