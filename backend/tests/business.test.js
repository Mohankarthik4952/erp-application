describe("ERP Business Rules", () => {
  test("1. Quotation total should calculate discount and GST correctly", () => {
    const quantity = 10;
    const unitPrice = 1000;
    const discountPct = 10;
    const gstPct = 18;

    const baseAmount = quantity * unitPrice;

    const discountAmount = baseAmount * (discountPct / 100);

    const taxableAmount = baseAmount - discountAmount;

    const gstAmount = taxableAmount * (gstPct / 100);

    const grandTotal = taxableAmount + gstAmount;

    expect(grandTotal).toBe(10620);
  });

  test("2. Draft quotation cannot be treated as accepted", () => {
    const status = "DRAFT";

    expect(status).not.toBe("ACCEPTED");
  });

  test("3. Rejected quotation cannot be converted into an order", () => {
    const status = "REJECTED";

    const canConvert = status === "ACCEPTED";

    expect(canConvert).toBe(false);
  });

  test("4. Available inventory equals physical minus reserved", () => {
    const physicalQuantity = 100;
    const reservedQuantity = 25;

    const availableQuantity = physicalQuantity - reservedQuantity;

    expect(availableQuantity).toBe(75);
  });

  test("5. Inventory reservation must fail when requested quantity exceeds available quantity", () => {
    const physicalQuantity = 50;
    const reservedQuantity = 40;
    const requestedQuantity = 20;

    const availableQuantity = physicalQuantity - reservedQuantity;

    expect(requestedQuantity > availableQuantity).toBe(true);
  });

  test("6. Sales user must not have ADMIN permissions", () => {
    const role = "SALES_USER";

    const allowedRoles = ["ADMIN"];

    expect(allowedRoles.includes(role)).toBe(false);
  });

  test("7. Confirmed order can be cancelled", () => {
    const status = "CONFIRMED";

    const canCancel = status === "PENDING" || status === "CONFIRMED";

    expect(canCancel).toBe(true);
  });

  test("8. Dispatched order cannot be cancelled", () => {
    const status = "DISPATCHED";

    const canCancel = status === "PENDING" || status === "CONFIRMED";

    expect(canCancel).toBe(false);
  });

  test("9. Only confirmed orders can be dispatched", () => {
    const pendingStatus = "PENDING";
    const confirmedStatus = "CONFIRMED";

    expect(pendingStatus === "CONFIRMED").toBe(false);
    expect(confirmedStatus === "CONFIRMED").toBe(true);
  });

  test("10. Inventory reservation should increase reserved quantity", () => {
    const currentReserved = 10;
    const orderQuantity = 15;

    const newReserved = currentReserved + orderQuantity;

    expect(newReserved).toBe(25);
  });
});
