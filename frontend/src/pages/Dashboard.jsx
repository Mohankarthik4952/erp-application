import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState({
    customers: 0,
    enquiries: 0,
    quotations: 0,
    orders: 0,
    products: 0,
    dispatches: 0,

    inventoryPhysical: 0,
    inventoryReserved: 0,
    inventoryAvailable: 0,

    pendingOrders: 0,
    confirmedOrders: 0,
    dispatchedOrders: 0,
    cancelledOrders: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [
        customersResponse,
        enquiriesResponse,
        quotationsResponse,
        ordersResponse,
        inventoryResponse,
      ] = await Promise.all([
        api.get("/customers"),
        api.get("/enquiries"),
        api.get("/quotations"),
        api.get("/orders"),
        api.get("/inventory"),
      ]);

      const customers = customersResponse.data.data || [];
      const enquiries = enquiriesResponse.data.data || [];
      const quotations = quotationsResponse.data.data || [];
      const orders = ordersResponse.data.data || [];
      const inventory = inventoryResponse.data.data || [];

      // ============================================================
      // ORDER STATUS COUNTS
      // ============================================================

      const pendingOrders = orders.filter(
        (order) => order.status === "PENDING",
      ).length;

      const confirmedOrders = orders.filter(
        (order) => order.status === "CONFIRMED",
      ).length;

      const dispatchedOrders = orders.filter(
        (order) => order.status === "DISPATCHED",
      ).length;

      const cancelledOrders = orders.filter(
        (order) => order.status === "CANCELLED",
      ).length;

      // ============================================================
      // DISPATCH COUNT
      // ============================================================

      const dispatches = orders.reduce((total, order) => {
        return total + (order.dispatches?.length || 0);
      }, 0);

      // ============================================================
      // INVENTORY TOTALS
      // ============================================================

      const inventoryPhysical = inventory.reduce(
        (total, item) => total + Number(item.physicalQuantity || 0),
        0,
      );

      const inventoryReserved = inventory.reduce(
        (total, item) => total + Number(item.reservedQuantity || 0),
        0,
      );

      const inventoryAvailable = inventory.reduce(
        (total, item) => total + Number(item.availableQuantity || 0),
        0,
      );

      setData({
        customers: customers.length,
        enquiries: enquiries.length,
        quotations: quotations.length,
        orders: orders.length,
        products: inventory.length,
        dispatches,

        inventoryPhysical,
        inventoryReserved,
        inventoryAvailable,

        pendingOrders,
        confirmedOrders,
        dispatchedOrders,
        cancelledOrders,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // WORKFLOW CHART DATA
  // ================================================================

  const workflowData = [
    {
      name: "Enquiries",
      count: data.enquiries,
    },
    {
      name: "Quotations",
      count: data.quotations,
    },
    {
      name: "Sales Orders",
      count: data.orders,
    },
    {
      name: "Dispatches",
      count: data.dispatches,
    },
  ];

  // ================================================================
  // INVENTORY CHART DATA
  // ================================================================

  const inventoryData = [
    {
      name: "Physical",
      quantity: data.inventoryPhysical,
    },
    {
      name: "Reserved",
      quantity: data.inventoryReserved,
    },
    {
      name: "Available",
      quantity: data.inventoryAvailable,
    },
  ];

  // ================================================================
  // ORDER STATUS CHART DATA
  // ================================================================

  const orderStatusData = [
    {
      name: "Pending",
      value: data.pendingOrders,
    },
    {
      name: "Confirmed",
      value: data.confirmedOrders,
    },
    {
      name: "Dispatched",
      value: data.dispatchedOrders,
    },
    {
      name: "Cancelled",
      value: data.cancelledOrders,
    },
  ];

  // ================================================================
  // LOADING
  // ================================================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <h2>Loading dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}

      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>ERP business overview</p>
        </div>

        <button
          className="refresh-dashboard-btn"
          onClick={loadDashboard}
          type="button"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ============================================================
          SUMMARY CARDS
      ============================================================ */}

      <div className="cards">
        <div className="card">
          <span>Customers</span>
          <strong>{data.customers}</strong>
        </div>

        <div className="card">
          <span>Enquiries</span>
          <strong>{data.enquiries}</strong>
        </div>

        <div className="card">
          <span>Quotations</span>
          <strong>{data.quotations}</strong>
        </div>

        <div className="card">
          <span>Sales Orders</span>
          <strong>{data.orders}</strong>
        </div>

        <div className="card">
          <span>Products</span>
          <strong>{data.products}</strong>
        </div>
      </div>

      {/* ============================================================
          CHART ROW 1
      ============================================================ */}

      <div className="dashboard-chart-grid">
        {/* ==========================================================
            BUSINESS WORKFLOW CHART
        ========================================================== */}

        <div className="dashboard-chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Business Workflow Overview</h3>
              <p>Current transaction volume across the ERP workflow</p>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={workflowData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ==========================================================
            INVENTORY CHART
        ========================================================== */}

        <div className="dashboard-chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Inventory Overview</h3>
              <p>Physical, reserved and available stock</p>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={inventoryData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis allowDecimals={false} />

                <Tooltip />

                <Bar dataKey="quantity" name="Quantity" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="inventory-chart-summary">
            <div>
              <span>Physical</span>
              <strong>{data.inventoryPhysical}</strong>
            </div>

            <div>
              <span>Reserved</span>
              <strong>{data.inventoryReserved}</strong>
            </div>

            <div>
              <span>Available</span>
              <strong>{data.inventoryAvailable}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          CHART ROW 2
      ============================================================ */}

      <div className="dashboard-bottom-grid">
        {/* ==========================================================
            ORDER STATUS
        ========================================================== */}

        <div className="dashboard-chart-card order-status-card">
          <div className="chart-card-header">
            <div>
              <h3>Sales Order Status</h3>
              <p>Current distribution of sales orders</p>
            </div>
          </div>

          <div className="order-status-content">
            <div className="order-pie-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}-${index}`} />
                    ))}
                  </Pie>

                  <Tooltip />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="order-status-stats">
              <div className="status-stat">
                <span>Pending</span>
                <strong>{data.pendingOrders}</strong>
              </div>

              <div className="status-stat">
                <span>Confirmed</span>
                <strong>{data.confirmedOrders}</strong>
              </div>

              <div className="status-stat">
                <span>Dispatched</span>
                <strong>{data.dispatchedOrders}</strong>
              </div>

              <div className="status-stat">
                <span>Cancelled</span>
                <strong>{data.cancelledOrders}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================================
            ERP SUMMARY
        ========================================================== */}

        <div className="dashboard-chart-card">
          <div className="chart-card-header">
            <div>
              <h3>ERP Summary</h3>
              <p>Current system activity</p>
            </div>
          </div>

          <div className="erp-summary-list">
            <div className="erp-summary-item">
              <div>
                <span>Total Customers</span>
                <small>Registered business customers</small>
              </div>

              <strong>{data.customers}</strong>
            </div>

            <div className="erp-summary-item">
              <div>
                <span>Total Products</span>
                <small>Products available in inventory</small>
              </div>

              <strong>{data.products}</strong>
            </div>

            <div className="erp-summary-item">
              <div>
                <span>Reserved Stock</span>
                <small>Inventory currently reserved</small>
              </div>

              <strong>{data.inventoryReserved}</strong>
            </div>

            <div className="erp-summary-item">
              <div>
                <span>Available Stock</span>
                <small>Physical stock minus reservations</small>
              </div>

              <strong>{data.inventoryAvailable}</strong>
            </div>

            <div className="erp-summary-item">
              <div>
                <span>Total Dispatches</span>
                <small>Completed dispatch records</small>
              </div>

              <strong>{data.dispatches}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
