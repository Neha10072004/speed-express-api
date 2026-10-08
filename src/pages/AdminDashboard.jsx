import React from "react";
import {
  Navigate,
  Outlet,
} from "react-router-dom";

import AdminSidebar from "../components/AdminSidebar";

export default function AdminDashboard() {
  const adminData = localStorage.getItem(
    "speedExpressAdmin"
  );

  let admin = null;

  try {
    admin = adminData
      ? JSON.parse(adminData)
      : null;
  } catch (error) {
    admin = null;
  }

  // ========================================
  // ADMIN LOGIN CHECK
  // ========================================

  if (
    !admin ||
    admin.loggedIn !== true ||
    admin.role !== "admin"
  ) {
    return (
      <Navigate
        to="/login"
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
            <h1>
              Speed Express Admin
            </h1>

            <p>
              Manage your courier and delivery operations
            </p>
          </div>

          {/* Admin User */}
          <div className="admin-topbar-user">

            <div className="admin-topbar-avatar">
              A
            </div>

            <div className="admin-topbar-user-info">

              <strong>
                Administrator
              </strong>

              <span>
                {admin.email}
              </span>

            </div>

          </div>

        </header>

        {/* Admin Page Content */}
        <section className="admin-page-content">

          <Outlet />

        </section>

      </main>

    </div>
  );
}