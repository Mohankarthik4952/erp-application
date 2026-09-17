import { useEffect, useState } from "react";
import api from "../services/api";

export default function Inventory() {
  const [inventory, setInventory] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [showProductForm, setShowProductForm] = useState(false);

  const [creatingProduct, setCreatingProduct] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isAdmin = user.role === "ADMIN";

  const [productForm, setProductForm] = useState({
    productCode: "",
    productName: "",
    category: "",
    unit: "",
    basePrice: "",
    physicalQuantity: "",
  });

  // ==========================================================
  // LOAD INVENTORY
  // ==========================================================

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/inventory");

      setInventory(response.data.data || []);
    } catch (err) {
      console.error("Inventory loading error:", err);

      setError(err.response?.data?.message || "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // PRODUCT FORM CHANGE
  // ==========================================================

  const handleProductChange = (e) => {
    setProductForm({
      ...productForm,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================================
  // RESET PRODUCT FORM
  // ==========================================================

  const resetProductForm = () => {
    setProductForm({
      productCode: "",
      productName: "",
      category: "",
      unit: "",
      basePrice: "",
      physicalQuantity: "",
    });
  };

  // ==========================================================
  // CREATE PRODUCT
  // ==========================================================

  const createProduct = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!productForm.productCode.trim()) {
      setError("Product code is required.");
      return;
    }

    if (!productForm.productName.trim()) {
      setError("Product name is required.");
      return;
    }

    if (!productForm.category.trim()) {
      setError("Category is required.");
      return;
    }

    if (!productForm.unit.trim()) {
      setError("Unit is required.");
      return;
    }

    const price = Number(productForm.basePrice);

    const quantity = Number(productForm.physicalQuantity);

    if (!Number.isFinite(price) || price < 0) {
      setError("Base price must be a valid non-negative number.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 0) {
      setError("Physical quantity must be a non-negative integer.");
      return;
    }

    try {
      setCreatingProduct(true);

      const response = await api.post("/products", {
        productCode: productForm.productCode.trim(),

        productName: productForm.productName.trim(),

        category: productForm.category.trim(),

        unit: productForm.unit.trim(),

        basePrice: price,

        physicalQuantity: quantity,
      });

      setMessage(response.data.message || "Product created successfully.");

      resetProductForm();

      setShowProductForm(false);

      await loadInventory();
    } catch (err) {
      console.error("Create product error:", err);

      setError(err.response?.data?.message || "Unable to create product.");
    } finally {
      setCreatingProduct(false);
    }
  };

  // ==========================================================
  // FORMAT CURRENCY
  // ==========================================================

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return <div className="loading">Loading inventory...</div>;
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="page">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="page-header">
        <div>
          <h1>Inventory</h1>

          <p>Manage products and monitor warehouse inventory</p>
        </div>

        <div className="inventory-header-actions">
          {isAdmin && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setError("");
                setMessage("");
                setShowProductForm(!showProductForm);
              }}
            >
              {showProductForm ? "Close" : "+ Add Product"}
            </button>
          )}

          <button className="btn btn-secondary" onClick={loadInventory}>
            Refresh
          </button>
        </div>
      </div>

      {/* ====================================================
          MESSAGES
      ==================================================== */}

      {error && <div className="alert alert-error">{error}</div>}

      {message && <div className="alert alert-success">{message}</div>}

      {/* ====================================================
          ADD PRODUCT FORM
      ==================================================== */}

      {showProductForm && isAdmin && (
        <div className="form-card">
          <div className="card-header">
            <div>
              <h2>Create New Product</h2>

              <p className="card-subtitle">
                Add a product and initialize its inventory stock
              </p>
            </div>
          </div>

          <form onSubmit={createProduct}>
            <div className="form-grid">
              {/* PRODUCT CODE */}

              <div className="form-group">
                <label>Product Code</label>

                <input
                  type="text"
                  name="productCode"
                  value={productForm.productCode}
                  onChange={handleProductChange}
                  placeholder="P007"
                  required
                />
              </div>

              {/* PRODUCT NAME */}

              <div className="form-group">
                <label>Product Name</label>

                <input
                  type="text"
                  name="productName"
                  value={productForm.productName}
                  onChange={handleProductChange}
                  placeholder="Wireless Mouse"
                  required
                />
              </div>

              {/* CATEGORY */}

              <div className="form-group">
                <label>Category</label>

                <select
                  name="category"
                  value={productForm.category}
                  onChange={handleProductChange}
                  required
                >
                  <option value="">Select Category</option>

                  <option value="Electronics">Electronics</option>

                  <option value="Beauty">Beauty</option>

                  <option value="Apparel">Apparel</option>

                  <option value="Home">Home</option>

                  <option value="Sports">Sports</option>
                </select>
              </div>

              {/* UNIT */}

              <div className="form-group">
                <label>Unit</label>

                <select
                  name="unit"
                  value={productForm.unit}
                  onChange={handleProductChange}
                  required
                >
                  <option value="">Select Unit</option>

                  <option value="Piece">Piece</option>

                  <option value="Box">Box</option>

                  <option value="Kg">Kg</option>

                  <option value="Liter">Liter</option>
                </select>
              </div>

              {/* BASE PRICE */}

              <div className="form-group">
                <label>Base Price</label>

                <input
                  type="number"
                  name="basePrice"
                  value={productForm.basePrice}
                  onChange={handleProductChange}
                  placeholder="799"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* PHYSICAL QUANTITY */}

              <div className="form-group">
                <label>Initial Physical Quantity</label>

                <input
                  type="number"
                  name="physicalQuantity"
                  value={productForm.physicalQuantity}
                  onChange={handleProductChange}
                  placeholder="100"
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                className="btn btn-success"
                type="submit"
                disabled={creatingProduct}
              >
                {creatingProduct ? "Creating..." : "Create Product"}
              </button>

              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  resetProductForm();
                  setShowProductForm(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ====================================================
          INVENTORY TABLE
      ==================================================== */}

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Current Inventory</h2>

            <p className="card-subtitle">
              {inventory.length} product
              {inventory.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {inventory.length === 0 ? (
          <div className="empty-state">
            <p>No inventory records found.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PRODUCT CODE</th>

                  <th>PRODUCT</th>

                  <th>CATEGORY</th>

                  <th>UNIT</th>

                  <th>BASE PRICE</th>

                  <th>PHYSICAL QTY</th>

                  <th>RESERVED QTY</th>

                  <th>AVAILABLE QTY</th>
                </tr>
              </thead>

              <tbody>
                {inventory.map((item) => {
                  const physical = Number(item.physicalQuantity || 0);

                  const reserved = Number(item.reservedQuantity || 0);

                  const available = Number(
                    item.availableQuantity ?? physical - reserved,
                  );

                  return (
                    <tr key={item.id}>
                      {/* CODE */}

                      <td>
                        <strong>{item.productCode || "-"}</strong>
                      </td>

                      {/* NAME */}

                      <td>
                        <div className="product-cell">
                          <strong>{item.productName || "-"}</strong>
                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td>{item.category || "-"}</td>

                      {/* UNIT */}

                      <td>{item.unit || "-"}</td>

                      {/* PRICE */}

                      <td>{formatCurrency(item.basePrice)}</td>

                      {/* PHYSICAL */}

                      <td>
                        <strong>{physical}</strong>
                      </td>

                      {/* RESERVED */}

                      <td>
                        <span className="quantity-badge reserved">
                          {reserved}
                        </span>
                      </td>

                      {/* AVAILABLE */}

                      <td>
                        <span
                          className={`available-quantity ${
                            available <= 0
                              ? "stock-empty"
                              : available <= 10
                                ? "stock-low"
                                : "stock-good"
                          }`}
                        >
                          {available}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====================================================
          INVENTORY LOGIC
      ==================================================== */}

      <div className="card inventory-info-card">
        <h2>Inventory Logic</h2>

        <div className="inventory-info-grid">
          <div className="info-item">
            <span className="info-label">Physical Quantity</span>

            <span className="info-description">
              Total physical stock currently available in the warehouse.
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">Reserved Quantity</span>

            <span className="info-description">
              Stock reserved for confirmed sales orders.
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">Available Quantity</span>

            <span className="info-description">
              Physical stock minus reserved stock.
            </span>
          </div>
        </div>

        <div className="inventory-formula">
          <strong>Available Quantity</strong>

          <span>=</span>

          <span>Physical Quantity</span>

          <span>−</span>

          <span>Reserved Quantity</span>
        </div>
      </div>
    </div>
  );
}
