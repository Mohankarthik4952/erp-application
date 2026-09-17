export const reserveInventoryForOrder = async (tx, order) => {
  // Sort product IDs to reduce the possibility of deadlocks
  // when multiple orders are confirmed concurrently.
  const items = [...order.items].sort((a, b) => a.productId - b.productId);

  for (const item of items) {
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

    const available =
      Number(inventory.physicalQuantity) - Number(inventory.reservedQuantity);

    if (available < item.quantity) {
      throw new Error(
        `Insufficient inventory for product ${item.productId}. Available: ${available}, Requested: ${item.quantity}`,
      );
    }

    await tx.inventory.update({
      where: {
        id: inventory.id,
      },

      data: {
        reservedQuantity: {
          increment: item.quantity,
        },
      },
    });
  }
};
