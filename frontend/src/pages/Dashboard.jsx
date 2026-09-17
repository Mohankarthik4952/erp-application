import { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const [data, setData] = useState({
    customers: 0,
    enquiries: 0,
    quotations: 0,
    orders: 0,
    inventory: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [customers, enquiries, quotations, orders, inventory] =
        await Promise.all([
          api.get("/customers"),
          api.get("/enquiries"),
          api.get("/quotations"),
          api.get("/orders"),
          api.get("/inventory"),
        ]);

      setData({
        customers: customers.data.data?.length || 0,
        enquiries: enquiries.data.data?.length || 0,
        quotations: quotations.data.data?.length || 0,
        orders: orders.data.data?.length || 0,
        inventory: inventory.data.data?.length || 0,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading dashboard...</h2>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>ERP workflow overview</p>
        </div>
      </div>

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
          <strong>{data.inventory}</strong>
        </div>
      </div>

      <div className="workflow">
        <h3>Business Workflow</h3>

        <div className="workflow-row">
          <span>1. Customer Enquiry</span>
          <span>→</span>
          <span>2. Quotation</span>
          <span>→</span>
          <span>3. Sales Order</span>
          <span>→</span>
          <span>4. Inventory Reservation</span>
          <span>→</span>
          <span>5. Dispatch</span>
        </div>
      </div>
    </div>
  );
}
