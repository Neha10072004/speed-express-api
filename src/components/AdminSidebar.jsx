
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

export default function AdminSidebar() {
  const navigate = useNavigate();

  // Read the logged-in account from localStorage or sessionStorage
  const storedUser =
    localStorage.getItem("speedExpressAdmin") ||
    sessionStorage.getItem("speedExpressAdmin");

  let currentUser = {};

  try {
    currentUser = storedUser ? JSON.parse(storedUser) : {};
  } catch (error) {
    console.error("Unable to read logged-in user:", error);
  }

  const role = String(currentUser.role || "user").toLowerCase();
  const isAdmin = role === "admin";

  const menuItems = [
    {
      path: "/admin-dashboard/home",
      label: "Dashboard",
      icon: "▦",
    },
    {
      path: "/admin-dashboard/create-booking",
      label: "Create Booking",
      icon: "＋",
    },
    {
      path: "/admin-dashboard/orders",
      label: "Orders",
      icon: "▤",
    },
    {
      path: "/admin-dashboard/track-package",
      label: "Track Package",
      icon: "⌕",
    },
    {
      path: "/admin-dashboard/status",
      label: "Update Status",
      icon: "↻",
    },
    {
      path: "/admin-dashboard/contact",
      label: "Contact",
      icon: "✉",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("speedExpressAdmin");
    sessionStorage.removeItem("speedExpressAdmin");
    navigate("/login", { replace: true });
  };

  const displayName = currentUser.name || "User";
  const displayRole = isAdmin ? "Administrator" : "Staff User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <aside className="admin-sidebar">
      {/* LOGO */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">SE</div>

        <div className="sidebar-brand-text">
          <h2>Speed Express</h2>
          <span>{isAdmin ? "Admin Panel" : "Staff Panel"}</span>
        </div>
      </div>

      {/* MAIN MENU */}
      <nav className="sidebar-navigation">
        <div className="sidebar-menu-title">MAIN MENU</div>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-menu-icon">{item.icon}</span>
            <span className="sidebar-menu-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* BOTTOM SECTION */}
      <div className="sidebar-bottom">
        <div className="sidebar-menu-title">SYSTEM</div>

        {/* SETTINGS: ADMIN ONLY */}
        {isAdmin && (
          <NavLink
            to="/admin-dashboard/settings"
            className={({ isActive }) =>
              `sidebar-menu-item ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-menu-icon">⚙</span>
            <span className="sidebar-menu-label">Settings</span>
          </NavLink>
        )}

        {/* LOGGED-IN PROFILE */}
        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">{avatarLetter}</div>

          <div className="sidebar-profile-info">
            <strong>{displayName}</strong>
            <span>{displayRole}</span>
          </div>
        </div>

        {/* LOGOUT */}
        <button className="sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-menu-icon">⇥</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
