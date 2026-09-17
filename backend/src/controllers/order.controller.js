import prisma from "../lib/prisma.js";
import { reserveInventoryForOrder } from "../services/inventory.service.js";

// ============================================================
// GET ALL ORDERS
// ============================================================

export const getOrders = async (req, res) => {
  try {
    const orders = await prisma.salesOrder.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        customer: true,

        quotation: {
          select: {
            id: true,
            quotationNo: true,
            status: true,
          },
        },

        items: {
          include: {
            product: true,
          },
        },

        dispatches: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// GET ORDER BY ID
// ============================================================

export const getOrderById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await prisma.salesOrder.findUnique({
      where: {
        id,
      },

      include: {
        customer: true,

        quotation: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },

        items: {
          include: {
            product: true,
          },
        },

        dispatches: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ============================================================
// CONFIRM ORDER + RESERVE INVENTORY
// ADMIN ONLY
// ============================================================

export const confirmOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await prisma.salesOrder.findUnique({
      where: {
        id,
      },

      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Only PENDING orders can be confirmed. Current status: ${order.status}`,
      });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Lock the order row itself
      const lockedOrders = await tx.$queryRaw`
        SELECT id, status
        FROM "SalesOrder"
        WHERE id = ${id}
        FOR UPDATE
      `;

      if (!lockedOrders.length) {
        throw new Error("Sales order not found");
      }

      if (lockedOrders[0].status !== "PENDING") {
        throw new Error(
          `Order is no longer pending. Current status: ${lockedOrders[0].status}`,
        );
      }

      // Reserve inventory
      await reserveInventoryForOrder(tx, order);

      // Change order status
      return tx.salesOrder.update({
        where: {
          id,
        },

        data: {
          status: "CONFIRMED",
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
    });

    return res.status(200).json({
      success: true,
      message: "Order confirmed and inventory reserved successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Confirm order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to confirm order",
    });
  }
};

// ============================================================
// CANCEL ORDER
// ADMIN ONLY
// ============================================================

export const cancelOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await prisma.salesOrder.findUnique({
      where: {
        id,
      },

      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled from ${order.status} status`,
      });
    }

    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Lock order
      const lockedOrders = await tx.$queryRaw`
        SELECT id, status
        FROM "SalesOrder"
        WHERE id = ${id}
        FOR UPDATE
      `;

      if (!lockedOrders.length) {
        throw new Error("Sales order not found");
      }

      const currentStatus = lockedOrders[0].status;

      if (!["PENDING", "CONFIRMED"].includes(currentStatus)) {
        throw new Error(
          `Order cannot be cancelled from ${currentStatus} status`,
        );
      }

      // If inventory was reserved, release it.
      if (currentStatus === "CONFIRMED") {
        const sortedItems = [...order.items].sort(
          (a, b) => a.productId - b.productId,
        );

        for (const item of sortedItems) {
          const inventoryRows = await tx.$queryRaw`
            SELECT
              id,
              "physicalQuantity",
              "reservedQuantity"
            FROM "Inventory"
            WHERE "productId" = ${item.productId}
            FOR UPDATE
          `;

          if (!inventoryRows.length) {
            throw new Error(
              `Inventory not found for product ${item.productId}`,
            );
          }

          const inventory = inventoryRows[0];

          if (Number(inventory.reservedQuantity) < Number(item.quantity)) {
            throw new Error(
              `Reserved inventory is insufficient to release product ${item.productId}`,
            );
          }

          await tx.inventory.update({
            where: {
              id: inventory.id,
            },

            data: {
              reservedQuantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      return tx.salesOrder.update({
        where: {
          id,
        },

        data: {
          status: "CANCELLED",
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
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: cancelledOrder,
    });
  } catch (error) {
    console.error("Cancel order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to cancel order",
    });
  }
};

// ============================================================
// DISPATCH ORDER
// ADMIN ONLY
// ============================================================

export const dispatchOrder = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { vehicleNumber, driverName } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (!vehicleNumber || !driverName) {
      return res.status(400).json({
        success: false,
        message: "vehicleNumber and driverName are required",
      });
    }

    const order = await prisma.salesOrder.findUnique({
      where: {
        id,
      },

      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Sales order not found",
      });
    }

    if (order.status !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: `Only CONFIRMED orders can be dispatched. Current status: ${order.status}`,
      });
    }

    const dispatch = await prisma.$transaction(async (tx) => {
      // Lock order
      const lockedOrders = await tx.$queryRaw`
        SELECT id, status
        FROM "SalesOrder"
        WHERE id = ${id}
        FOR UPDATE
      `;

      if (!lockedOrders.length) {
        throw new Error("Sales order not found");
      }

      if (lockedOrders[0].status !== "CONFIRMED") {
        throw new Error(
          `Order is no longer confirmed. Current status: ${lockedOrders[0].status}`,
        );
      }

      // ------------------------------------------------------
      // Lock inventory rows before modifying them
      // ------------------------------------------------------

      const sortedItems = [...order.items].sort(
        (a, b) => a.productId - b.productId,
      );

      for (const item of sortedItems) {
        const inventoryRows = await tx.$queryRaw`
          SELECT
            id,
            "physicalQuantity",
            "reservedQuantity"
          FROM "Inventory"
          WHERE "productId" = ${item.productId}
          FOR UPDATE
        `;

        if (!inventoryRows.length) {
          throw new Error(`Inventory not found for product ${item.productId}`);
        }

        const inventory = inventoryRows[0];

        if (Number(inventory.physicalQuantity) < Number(item.quantity)) {
          throw new Error(
            `Physical inventory is insufficient for product ${item.productId}`,
          );
        }

        if (Number(inventory.reservedQuantity) < Number(item.quantity)) {
          throw new Error(
            `Reserved inventory is insufficient for product ${item.productId}`,
          );
        }
      }

      // ------------------------------------------------------
      // Create dispatch
      // ------------------------------------------------------

      const createdDispatch = await tx.dispatch.create({
        data: {
          dispatchNo: `DSP-${Date.now()}`,
          salesOrderId: order.id,
          vehicleNumber: vehicleNumber.trim(),
          driverName: driverName.trim(),

          items: {
            create: order.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },

        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // ------------------------------------------------------
      // Reduce physical and reserved quantities
      // ------------------------------------------------------

      for (const item of sortedItems) {
        await tx.inventory.updateMany({
          where: {
            productId: item.productId,
          },

          data: {
            physicalQuantity: {
              decrement: item.quantity,
            },

            reservedQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // ------------------------------------------------------
      // Mark order dispatched
      // ------------------------------------------------------

      await tx.salesOrder.update({
        where: {
          id: order.id,
        },

        data: {
          status: "DISPATCHED",
        },
      });

      return createdDispatch;
    });

    return res.status(200).json({
      success: true,
      message: "Order dispatched successfully",
      data: dispatch,
    });
  } catch (error) {
    console.error("Dispatch order error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to dispatch order",
    });
  }
};
