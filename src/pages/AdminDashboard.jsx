
import React from "react";
import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import AdminSidebar from "../components/AdminSidebar";

export default function AdminDashboard() {
  const location = useLocation();

  let currentUser = null;

  // Read the saved login session
  try {
    const userData =
      localStorage.getItem("speedExpressAdmin") ||
      sessionStorage.getItem("speedExpressAdmin");

    currentUser = userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Unable to read login session:", error);
  }

  const token = currentUser?.token;
  const role = String(currentUser?.role || "").trim().toLowerCase();

  // Allow both administrators and staff users
  const allowedRoles = ["admin", "user"];

  const isAuthenticated =
    Boolean(token) && allowedRoles.includes(role);

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  const displayName = currentUser?.name || "User";
  const displayEmail = currentUser?.email || "";
  const isAdmin = role === "admin";

  return (
    <div className="admin-layout">
      {/* Shared Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="admin-main-content">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <h1>Speed Express Dashboard</h1>
            <p>
              Manage courier bookings and delivery operations
            </p>
          </div>

          {/* Logged-in User */}
          <div className="admin-topbar-user">
            <div className="admin-topbar-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="admin-topbar-user-info">
              <strong>{displayName}</strong>
              <span>
                {isAdmin ? "Administrator" : "Staff User"}
              </span>
              <span>{displayEmail}</span>
            </div>
          </div>
        </header>

        {/* Nested Dashboard Pages */}
        <section className="admin-page-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
