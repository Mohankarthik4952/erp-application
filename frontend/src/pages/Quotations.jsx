import { useEffect, useState } from "react";
import api from "../services/api";

export default function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState({
    enquiryId: "",
    validUntil: "",
    productId: "",
    quantity: 1,
    unitPrice: "",
    discountPct: 0,
    gstPct: 18,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [quotationsRes, enquiriesRes, productsRes] = await Promise.all([
        api.get("/quotations"),
        api.get("/enquiries"),
        api.get("/products"),
      ]);

      setQuotations(quotationsRes.data.data || []);
      setEnquiries(enquiriesRes.data.data || []);
      setProducts(productsRes.data.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Unable to load quotation data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "productId") {
      const product = products.find((p) => p.id === Number(value));

      if (product) {
        setForm((prev) => ({
          ...prev,
          productId: value,
          unitPrice: product.basePrice,
        }));
      }
    }
  };

  const createQuotation = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!form.enquiryId) {
      setError("Please select an enquiry.");
      return;
    }

    if (!form.validUntil) {
      setError("Please select quotation validity date.");
      return;
    }

    if (!form.productId) {
      setError("Please select a product.");
      return;
    }

    if (Number(form.quantity) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (Number(form.unitPrice) < 0) {
      setError("Unit price cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/quotations", {
        enquiryId: Number(form.enquiryId),
        validUntil: form.validUntil,
        items: [
          {
            productId: Number(form.productId),
            quantity: Number(form.quantity),
            unitPrice: Number(form.unitPrice),
            discountPct: Number(form.discountPct),
            gstPct: Number(form.gstPct),
          },
        ],
      });

      setForm({
        enquiryId: "",
        validUntil: "",
        productId: "",
        quantity: 1,
        unitPrice: "",
        discountPct: 0,
        gstPct: 18,
      });

      setMessage("Quotation created successfully.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Unable to create quotation.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      setError("");
      setMessage("");

      await api.patch(`/quotations/${id}/status`, {
        status,
      });

      setMessage(`Quotation updated to ${status}.`);

      await loadData();
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Unable to update quotation.");
    }
  };

  const convertToOrder = async (id) => {
    try {
      setError("");
      setMessage("");

      const response = await api.post(`/quotations/${id}/convert`);

      const orderNo = response.data.data?.orderNo || "";

      setMessage(
        orderNo
          ? `Sales order ${orderNo} created successfully.`
          : "Sales order created successfully.",
      );

      await loadData();
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Unable to convert quotation.");
    }
  };

  const getStatusClass = (status) => {
    return `status status-${String(status || "").toLowerCase()}`;
  };

  const calculateTotal = () => {
    const quantity = Number(form.quantity) || 0;
    const price = Number(form.unitPrice) || 0;
    const discount = Number(form.discountPct) || 0;
    const gst = Number(form.gstPct) || 0;

    const base = quantity * price;
    const discountAmount = base * (discount / 100);
    const taxable = base - discountAmount;
    const gstAmount = taxable * (gst / 100);

    return taxable + gstAmount;
  };

  if (loading) {
    return <div className="loading">Loading quotations...</div>;
  }

  return (
    <div>
      {/* HEADER */}

      <div className="page-header">
        <div>
          <h2>Quotations</h2>
          <p>
            Create quotations and convert accepted quotations into sales orders
          </p>
        </div>
      </div>

      {/* MESSAGES */}

      {error && <div className="error">{error}</div>}

      {message && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            color: "#166534",
            padding: "11px 13px",
            borderRadius: "8px",
            marginBottom: "18px",
            fontSize: "13px",
          }}
        >
          {message}
        </div>
      )}

      {/* CREATE QUOTATION */}

      <div className="form-card">
        <h3>Create New Quotation</h3>

        <form onSubmit={createQuotation}>
          <div className="form-grid">
            <div className="form-group">
              <label>Enquiry</label>

              <select
                name="enquiryId"
                value={form.enquiryId}
                onChange={handleChange}
                required
              >
                <option value="">Select Enquiry</option>

                {enquiries
                  .filter((enquiry) => enquiry.status === "NEW")
                  .map((enquiry) => (
                    <option key={enquiry.id} value={enquiry.id}>
                      {enquiry.enquiryNo} -{" "}
                      {enquiry.customer?.companyName ||
                        `Customer #${enquiry.customerId}`}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Valid Until</label>

              <input
                type="date"
                name="validUntil"
                value={form.validUntil}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Product</label>

              <select
                name="productId"
                value={form.productId}
                onChange={handleChange}
                required
              >
                <option value="">Select Product</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.productCode} - {product.productName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantity</label>

              <input
                type="number"
                name="quantity"
                min="1"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Unit Price</label>

              <input
                type="number"
                min="0"
                step="0.01"
                name="unitPrice"
                value={form.unitPrice}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Discount %</label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                name="discountPct"
                value={form.discountPct}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>GST %</label>

              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                name="gstPct"
                value={form.gstPct}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Calculated Total</label>

              <input value={`₹ ${calculateTotal().toFixed(2)}`} readOnly />
            </div>

            <div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Creating..." : "Create Quotation"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* QUOTATION TABLE */}

      <div className="table-card">
        <div
          style={{
            padding: "20px 20px 5px",
          }}
        >
          <h3>Quotation List</h3>
        </div>

        <div className="table-wrapper">
          {quotations.length === 0 ? (
            <div className="empty">No quotations found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Quotation No</th>
                  <th>Customer</th>
                  <th>Enquiry</th>
                  <th>Total</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {quotations.map((quotation) => (
                  <tr key={quotation.id}>
                    <td>
                      <strong>{quotation.quotationNo}</strong>
                    </td>

                    <td>
                      {quotation.customer?.companyName ||
                        `Customer #${quotation.customerId}`}
                    </td>

                    <td>
                      {quotation.enquiry?.enquiryNo ||
                        `#${quotation.enquiryId}`}
                    </td>

                    <td>₹ {Number(quotation.grandTotal || 0).toFixed(2)}</td>

                    <td>
                      {quotation.validUntil
                        ? new Date(quotation.validUntil).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                      <span className={getStatusClass(quotation.status)}>
                        {quotation.status}
                      </span>
                    </td>

                    <td>
                      <div className="actions">
                        {quotation.status === "DRAFT" && (
                          <button
                            className="btn btn-primary"
                            onClick={() => updateStatus(quotation.id, "SENT")}
                          >
                            Send
                          </button>
                        )}

                        {quotation.status === "SENT" && (
                          <>
                            <button
                              className="btn btn-success"
                              onClick={() =>
                                updateStatus(quotation.id, "ACCEPTED")
                              }
                            >
                              Accept
                            </button>

                            <button
                              className="btn btn-danger"
                              onClick={() =>
                                updateStatus(quotation.id, "REJECTED")
                              }
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {quotation.status === "ACCEPTED" && (
                          <button
                            className="btn btn-success"
                            onClick={() => convertToOrder(quotation.id)}
                          >
                            Create Order
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
