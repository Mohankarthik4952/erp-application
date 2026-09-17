import prisma from "../lib/prisma.js";

const generateEnquiryNo = () => {
  return `ENQ-${Date.now()}`;
};

// CREATE ENQUIRY
export const createEnquiry = async (req, res) => {
  try {
    const { customerId, requiredDate, notes, items } = req.body;

    if (
      !customerId ||
      !requiredDate ||
      !Array.isArray(items) ||
      !items.length
    ) {
      return res.status(400).json({
        success: false,
        message: "customerId, requiredDate and items are required",
      });
    }

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each item requires a valid productId and positive quantity",
        });
      }
    }

    const customer = await prisma.customer.findUnique({
      where: { id: Number(customerId) },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const productIds = items.map((item) => Number(item.productId));

    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products do not exist",
      });
    }

    const enquiry = await prisma.enquiry.create({
      data: {
        enquiryNo: generateEnquiryNo(),
        customerId: Number(customerId),
        requiredDate: new Date(requiredDate),
        notes: notes || null,
        createdById: req.user.id,
        items: {
          create: items.map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create enquiry",
    });
  }
};

// GET ENQUIRIES
export const getEnquiries = async (req, res) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      include: {
        customer: true,
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      data: enquiries,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiries",
    });
  }
};

// GET SINGLE ENQUIRY
export const getEnquiryById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        quotations: true,
      },
    });

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    res.json({
      success: true,
      data: enquiry,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch enquiry",
    });
  }
};
