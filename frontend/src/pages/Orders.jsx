import { useEffect, useState } from "react";
import api from "../services/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [dispatchForm, setDispatchForm] = useState({
    orderId: null,
    vehicleNumber: "",
    driverName: "",
  });

  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const isAdmin = user.role === "ADMIN";

  // ============================================================
  // LOAD ORDERS
  // ============================================================

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/orders");

      setOrders(response.data.data || []);
    } catch (err) {
      console.error("Load orders error:", err);

      setError(err.response?.data?.message || "Unable to load sales orders.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CLEAR MESSAGES
  // ============================================================

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  // ============================================================
  // CONFIRM ORDER
  // ============================================================

  const confirmOrder = async (orderId) => {
    try {
      clearMessages();

      setProcessingId(orderId);

      const response = await api.post(`/orders/${orderId}/confirm`);

      setMessage(
        response.data.message || "Order confirmed and inventory reserved.",
      );

      await loadOrders();
    } catch (err) {
      console.error("Confirm order error:", err);

      setError(err.response?.data?.message || "Unable to confirm order.");
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // CANCEL ORDER
  // ============================================================

  const cancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order? Reserved inventory will be released.",
    );

    if (!confirmed) {
      return;
    }

    try {
      clearMessages();

      setProcessingId(orderId);

      const response = await api.post(`/orders/${orderId}/cancel`);

      setMessage(response.data.message || "Order cancelled successfully.");

      await loadOrders();
    } catch (err) {
      console.error("Cancel order error:", err);

      setError(err.response?.data?.message || "Unable to cancel order.");
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // OPEN DISPATCH FORM
  // ============================================================

  const openDispatchForm = (orderId) => {
    clearMessages();

    setDispatchForm({
      orderId,
      vehicleNumber: "",
      driverName: "",
    });

    setShowDispatchForm(true);
  };

  // ============================================================
  // CLOSE DISPATCH FORM
  // ============================================================

  const closeDispatchForm = () => {
    setShowDispatchForm(false);

    setDispatchForm({
      orderId: null,
      vehicleNumber: "",
      driverName: "",
    });
  };

  // ============================================================
  // DISPATCH FORM CHANGE
  // ============================================================

  const handleDispatchChange = (e) => {
    setDispatchForm({
      ...dispatchForm,
      [e.target.name]: e.target.value,
    });
  };

  // ============================================================
  // DISPATCH ORDER
  // ============================================================

  const dispatchOrder = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!dispatchForm.vehicleNumber.trim()) {
      setError("Vehicle number is required.");
      return;
    }

    if (!dispatchForm.driverName.trim()) {
      setError("Driver name is required.");
      return;
    }

    try {
      setProcessingId(dispatchForm.orderId);

      const response = await api.post(
        `/orders/${dispatchForm.orderId}/dispatch`,
        {
          vehicleNumber: dispatchForm.vehicleNumber.trim(),

          driverName: dispatchForm.driverName.trim(),
        },
      );

      setMessage(response.data.message || "Order dispatched successfully.");

      closeDispatchForm();

      await loadOrders();
    } catch (err) {
      console.error("Dispatch order error:", err);

      setError(err.response?.data?.message || "Unable to dispatch order.");
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    return `status status-${String(status || "").toLowerCase()}`;
  };

  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ============================================================
  // CURRENCY FORMAT
  // ============================================================

  const formatCurrency = (amount) => {
    return `₹ ${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ============================================================
  // GET DISPATCH
  // ============================================================

  const getDispatch = (order) => {
    if (!order.dispatches || order.dispatches.length === 0) {
      return null;
    }

    // Normally there will be one dispatch because
    // only CONFIRMED orders can be dispatched and
    // DISPATCHED orders cannot be dispatched again.

    return order.dispatches[order.dispatches.length - 1];
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return <div className="loading">Loading sales orders...</div>;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="page">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="page-header">
        <div>
          <h1>Sales Orders</h1>

          <p>Confirm orders, reserve inventory and manage dispatch</p>
        </div>

        <div>
          <span
            className="status status-confirmed"
            style={{
              textTransform: "uppercase",
            }}
          >
            {user.role || "USER"}
          </span>
        </div>
      </div>

      {/* ======================================================
          ERROR MESSAGE
      ====================================================== */}

      {error && <div className="alert alert-error">{error}</div>}

      {/* ======================================================
          SUCCESS MESSAGE
      ====================================================== */}

      {message && <div className="alert alert-success">{message}</div>}

      {/* ======================================================
          DISPATCH FORM
      ====================================================== */}

      {showDispatchForm && (
        <div className="form-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: 0 }}>Create Dispatch</h3>

            <button
              className="btn btn-secondary"
              type="button"
              onClick={closeDispatchForm}
            >
              Close
            </button>
          </div>

          <form onSubmit={dispatchOrder}>
            <div className="form-grid">
              {/* VEHICLE NUMBER */}

              <div className="form-group">
                <label>Vehicle Number</label>

                <input
                  name="vehicleNumber"
                  value={dispatchForm.vehicleNumber}
                  onChange={handleDispatchChange}
                  placeholder="KA01AB1234"
                  required
                />
              </div>

              {/* DRIVER NAME */}

              <div className="form-group">
                <label>Driver Name</label>

                <input
                  name="driverName"
                  value={dispatchForm.driverName}
                  onChange={handleDispatchChange}
                  placeholder="Suresh Kumar"
                  required
                />
              </div>

              {/* BUTTON */}

              <div>
                <button
                  className="btn btn-success"
                  type="submit"
                  disabled={processingId === dispatchForm.orderId}
                >
                  {processingId === dispatchForm.orderId
                    ? "Dispatching..."
                    : "Confirm Dispatch"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================
          ORDER LIST
      ====================================================== */}

      <div className="table-card">
        <div
          style={{
            padding: "20px 20px 5px",
          }}
        >
          <h3>Sales Order List</h3>

          <p
            style={{
              marginTop: "5px",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            {orders.length} order
            {orders.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div className="table-wrapper">
          {orders.length === 0 ? (
            <div className="empty">No sales orders found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order No</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const dispatch = getDispatch(order);

                  return (
                    <tr key={order.id}>
                      {/* ORDER NO */}

                      <td>
                        <strong>{order.orderNo}</strong>
                      </td>

                      {/* CUSTOMER */}

                      <td>
                        {order.customer?.companyName ||
                          `Customer #${order.customerId}`}
                      </td>

                      {/* DATE */}

                      <td>{formatDate(order.orderDate)}</td>

                      {/* ITEMS */}

                      <td>{order.items?.length || 0}</td>

                      {/* TOTAL */}

                      <td>{formatCurrency(order.totalAmount)}</td>

                      {/* STATUS */}

                      <td>
                        <span className={getStatusClass(order.status)}>
                          {order.status}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>
                        <div className="actions">
                          {/* ADMIN - CONFIRM */}

                          {isAdmin && order.status === "PENDING" && (
                            <button
                              className="btn btn-primary"
                              disabled={processingId === order.id}
                              onClick={() => confirmOrder(order.id)}
                            >
                              {processingId === order.id
                                ? "Processing..."
                                : "Confirm & Reserve"}
                            </button>
                          )}

                          {/* ADMIN - CANCEL */}

                          {isAdmin &&
                            (order.status === "PENDING" ||
                              order.status === "CONFIRMED") && (
                              <button
                                className="btn btn-danger"
                                disabled={processingId === order.id}
                                onClick={() => cancelOrder(order.id)}
                              >
                                Cancel
                              </button>
                            )}

                          {/* ADMIN - DISPATCH */}

                          {isAdmin && order.status === "CONFIRMED" && (
                            <button
                              className="btn btn-success"
                              disabled={processingId === order.id}
                              onClick={() => openDispatchForm(order.id)}
                            >
                              Dispatch
                            </button>
                          )}

                          {/* SALES USER */}

                          {!isAdmin && (
                            <span
                              style={{
                                color: "#94a3b8",
                                fontSize: "12px",
                              }}
                            >
                              View only
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ======================================================
          DISPATCH DETAILS
      ====================================================== */}

      {orders.some(
        (order) => order.status === "DISPATCHED" && getDispatch(order),
      ) && (
        <div
          className="card"
          style={{
            marginTop: "25px",
          }}
        >
          <div className="card-header">
            <div>
              <h2>Dispatch Details</h2>

              <p className="card-subtitle">
                Vehicle and driver information for dispatched orders
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ORDER NO</th>
                  <th>DISPATCH NO</th>
                  <th>DISPATCH DATE</th>
                  <th>VEHICLE NUMBER</th>
                  <th>DRIVER NAME</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const dispatch = getDispatch(order);

                  if (order.status !== "DISPATCHED" || !dispatch) {
                    return null;
                  }

                  return (
                    <tr key={`dispatch-${order.id}`}>
                      {/* ORDER */}

                      <td>
                        <strong>{order.orderNo}</strong>
                      </td>

                      {/* DISPATCH NUMBER */}

                      <td>
                        <strong>{dispatch.dispatchNo || "-"}</strong>
                      </td>

                      {/* DISPATCH DATE */}

                      <td>{formatDate(dispatch.dispatchDate)}</td>

                      {/* VEHICLE */}

                      <td>
                        <span className="dispatch-value">
                          {dispatch.vehicleNumber || "-"}
                        </span>
                      </td>

                      {/* DRIVER */}

                      <td>
                        <span className="dispatch-value">
                          {dispatch.driverName || "-"}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span className="status status-dispatched">
                          DISPATCHED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================
          ORDER WORKFLOW
      ====================================================== */}

      <div
        className="workflow"
        style={{
          marginTop: "25px",
        }}
      >
        <h3>Order Workflow</h3>

        <div className="workflow-row">
          <span>PENDING</span>

          <span>→</span>

          <span>CONFIRM & RESERVE</span>

          <span>→</span>

          <span>CONFIRMED</span>

          <span>→</span>

          <span>DISPATCH</span>

          <span>→</span>

          <span>DISPATCHED</span>
        </div>

        <div
          style={{
            marginTop: "18px",
            padding: "14px",
            borderRadius: "8px",
            background: "#f8fafc",
            color: "#64748b",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          <strong>Inventory behavior:</strong> Confirming an order increases
          reserved stock. Dispatching decreases both physical and reserved
          stock. Cancelling a confirmed order releases the reserved stock.
        </div>
      </div>
    </div>
  );
}
