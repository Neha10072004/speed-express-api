
import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import AdminSidebar from "../components/AdminSidebar";

export default function AdminDashboard() {
  const location = useLocation();

  // Read admin details from browser storage
  const localAdminData = localStorage.getItem(
    "speedExpressAdmin"
  );

  const sessionAdminData = sessionStorage.getItem(
    "speedExpressAdmin"
  );

  let admin = null;

  try {
    const adminData = localAdminData || sessionAdminData;

    admin = adminData ? JSON.parse(adminData) : null;
  } catch (error) {
    console.error("Unable to read admin details:", error);
    admin = null;
  }

  // Check whether the current browser session is authenticated
  const isLoggedIn =
    sessionStorage.getItem("speedExpressDemoLogin") === "true";

  // Check admin role and login status
  if (
    !admin ||
    admin.role !== "admin" ||
    !isLoggedIn
  ) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Admin dashboard layout
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