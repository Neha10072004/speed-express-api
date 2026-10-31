
import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import AdminSidebar from "../components/AdminSidebar";

export default function AdminDashboard() {
  const location = useLocation();

  let admin = null;

  // Read the saved login session
  try {
    const adminData =
      localStorage.getItem("speedExpressAdmin") ||
      sessionStorage.getItem("speedExpressAdmin");

    admin = adminData ? JSON.parse(adminData) : null;
  } catch (error) {
    console.error("Unable to read admin session:", error);
  }

  // Support the token property used by the login API
  const token = admin?.token;

  // Validate admin authentication
  const isAuthenticated =
    Boolean(token) &&
    admin?.role?.toLowerCase() === "admin";

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return (
    <div className="admin-layout">
      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="admin-main-content">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <h1>Speed Express Admin</h1>
            <p>
              Manage your courier and delivery operations
            </p>
          </div>

          {/* Admin User */}
          <div className="admin-topbar-user">
            <div className="admin-topbar-avatar">
              {(admin.email || "A")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="admin-topbar-user-info">
              <strong>Administrator</strong>
              <span>{admin.email}</span>
            </div>
          </div>
        </header>

        {/* Nested Admin Pages */}
        <section className="admin-page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
