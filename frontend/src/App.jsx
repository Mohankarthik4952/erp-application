import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Enquiries from "./pages/Enquiries";
import Quotations from "./pages/Quotations";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
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
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <h1>ERP System</h1>
          <p className="role">{user.role || "USER"}</p>
        </div>

        <nav>
          <Link className={location.pathname === "/" ? "active" : ""} to="/">
            Dashboard
          </Link>

          <Link
            className={location.pathname === "/enquiries" ? "active" : ""}
            to="/enquiries"
          >
            Customer Enquiries
          </Link>

          <Link
            className={location.pathname === "/quotations" ? "active" : ""}
            to="/quotations"
          >
            Quotations
          </Link>

          <Link
            className={location.pathname === "/orders" ? "active" : ""}
            to="/orders"
          >
            Sales Orders
          </Link>

          <Link
            className={location.pathname === "/inventory" ? "active" : ""}
            to="/inventory"
          >
            Inventory
          </Link>
        </nav>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </aside>

      <main className="main">
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

export default App;
