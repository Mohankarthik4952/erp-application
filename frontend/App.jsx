import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Enquiries from "./pages/Enquiries";
import Quotations from "./pages/Quotations";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function Layout() {
  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <h2>ERP System</h2>

        <nav style={styles.nav}>
          <Link to="/" style={styles.link}>
            Dashboard
          </Link>
          <Link to="/enquiries" style={styles.link}>
            Enquiries
          </Link>
          <Link to="/quotations" style={styles.link}>
            Quotations
          </Link>
          <Link to="/orders" style={styles.link}>
            Sales Orders
          </Link>
          <Link to="/inventory" style={styles.link}>
            Inventory
          </Link>
        </nav>

        <button
          style={styles.logout}
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/enquiries" element={<Enquiries />} />
          <Route path="/quotations" element={<Quotations />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/inventory" element={<Inventory />} />
        </Routes>
      </main>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: "220px",
    background: "#1e293b",
    color: "white",
    padding: "25px 15px",
    boxSizing: "border-box",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "30px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    padding: "10px",
    borderRadius: "6px",
  },
  logout: {
    marginTop: "40px",
    width: "100%",
    padding: "10px",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    background: "#f8fafc",
    padding: "30px",
  },
};

export default App;
