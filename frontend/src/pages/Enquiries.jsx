import { useEffect, useState } from "react";
import api from "../services/api";

export default function Enquiries() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [enquiries, setEnquiries] = useState([]);

  const [showCustomerForm, setShowCustomerForm] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    companyName: "",
    contactPerson: "",
    mobile: "",
    email: "",
    city: "",
  });

  const [form, setForm] = useState({
    customerId: "",
    requiredDate: "",
    notes: "",
    productId: "",
    quantity: 1,
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

      const [customersRes, productsRes, enquiriesRes] = await Promise.all([
        api.get("/customers"),
        api.get("/products"),
        api.get("/enquiries"),
      ]);

      setCustomers(customersRes.data.data || []);
      setProducts(productsRes.data.data || []);
      setEnquiries(enquiriesRes.data.data || []);
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Unable to load enquiry data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (e) => {
    setCustomerForm({
      ...customerForm,
      [e.target.name]: e.target.value,
    });
  };

  const createCustomer = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await api.post("/customers", customerForm);

      const newCustomer = response.data.data;

      setCustomers((prev) => [...prev, newCustomer]);

      setForm((prev) => ({
        ...prev,
        customerId: newCustomer.id,
      }));

      setCustomerForm({
        companyName: "",
        contactPerson: "",
        mobile: "",
        email: "",
        city: "",
      });

      setShowCustomerForm(false);

      setMessage("Customer created successfully.");
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Unable to create customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const createEnquiry = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!form.customerId) {
      setError("Please select a customer.");
      return;
    }

    if (!form.requiredDate) {
      setError("Please select required date.");
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

    try {
      setSaving(true);

      await api.post("/enquiries", {
        customerId: Number(form.customerId),
        requiredDate: form.requiredDate,
        notes: form.notes,
        items: [
          {
            productId: Number(form.productId),
            quantity: Number(form.quantity),
          },
        ],
      });

      setForm({
        customerId: "",
        requiredDate: "",
        notes: "",
        productId: "",
        quantity: 1,
      });

      setMessage("Enquiry created successfully.");

      await loadData();
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || "Unable to create enquiry.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusClass = (status) => {
    return `status status-${String(status || "").toLowerCase()}`;
  };

  if (loading) {
    return <div className="loading">Loading enquiries...</div>;
  }

  return (
    <div>
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>Customer Enquiries</h2>
          <p>Create and manage customer enquiries</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowCustomerForm(!showCustomerForm)}
        >
          {showCustomerForm ? "Close Customer Form" : "+ New Customer"}
        </button>
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

      {/* CUSTOMER FORM */}

      {showCustomerForm && (
        <div className="form-card">
          <h3>Create Customer</h3>

          <form onSubmit={createCustomer}>
            <div className="form-grid">
              <div className="form-group">
                <label>Company Name</label>

                <input
                  name="companyName"
                  value={customerForm.companyName}
                  onChange={handleCustomerChange}
                  placeholder="ABC Engineering Pvt Ltd"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Person</label>

                <input
                  name="contactPerson"
                  value={customerForm.contactPerson}
                  onChange={handleCustomerChange}
                  placeholder="Ravi Kumar"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile</label>

                <input
                  name="mobile"
                  value={customerForm.mobile}
                  onChange={handleCustomerChange}
                  placeholder="9876543210"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={customerForm.email}
                  onChange={handleCustomerChange}
                  placeholder="ravi@abc.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>City</label>

                <input
                  name="city"
                  value={customerForm.city}
                  onChange={handleCustomerChange}
                  placeholder="Bengaluru"
                  required
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "end",
                }}
              >
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ENQUIRY FORM */}

      <div className="form-card">
        <h3>Create New Enquiry</h3>

        <form onSubmit={createEnquiry}>
          <div className="form-grid">
            <div className="form-group">
              <label>Customer</label>

              <select
                name="customerId"
                value={form.customerId}
                onChange={handleChange}
                required
              >
                <option value="">Select Customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Required Date</label>

              <input
                type="date"
                name="requiredDate"
                value={form.requiredDate}
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

            <div className="form-group full">
              <label>Notes</label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Enter customer requirement..."
              />
            </div>

            <div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={saving}
              >
                {saving ? "Creating..." : "Create Enquiry"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ENQUIRY TABLE */}

      <div className="table-card">
        <div
          style={{
            padding: "20px 20px 5px",
          }}
        >
          <h3>Enquiry List</h3>
        </div>

        <div className="table-wrapper">
          {enquiries.length === 0 ? (
            <div className="empty">No enquiries found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Enquiry No</th>
                  <th>Customer</th>
                  <th>Required Date</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Created By</th>
                </tr>
              </thead>

              <tbody>
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id}>
                    <td>
                      <strong>{enquiry.enquiryNo}</strong>
                    </td>

                    <td>
                      {enquiry.customer?.companyName ||
                        `Customer #${enquiry.customerId}`}
                    </td>

                    <td>
                      {enquiry.requiredDate
                        ? new Date(enquiry.requiredDate).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>{enquiry.items?.length || 0}</td>

                    <td>
                      <span className={getStatusClass(enquiry.status)}>
                        {enquiry.status}
                      </span>
                    </td>

                    <td>{enquiry.createdBy?.name || "-"}</td>
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
