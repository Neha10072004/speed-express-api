import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./AdminSidebar.css";

export default function AdminSidebar() {
  const navigate = useNavigate();

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
    navigate("/login");
  };

  return (
    <aside className="admin-sidebar">

      {/* LOGO */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          SE
        </div>

        <div className="sidebar-brand-text">
          <h2>Speed Express</h2>
          <span>Admin Panel</span>
        </div>
      </div>

      {/* MAIN MENU */}
      <nav className="sidebar-navigation">

        <div className="sidebar-menu-title">
          MAIN MENU
        </div>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-menu-item ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="sidebar-menu-icon">
              {item.icon}
            </span>

            <span className="sidebar-menu-label">
              {item.label}
            </span>
          </NavLink>
        ))}

      </nav>

      {/* BOTTOM SECTION */}
      <div className="sidebar-bottom">

        <div className="sidebar-menu-title">
          SYSTEM
        </div>

        {/* SETTINGS */}
        <NavLink
          to="/admin-dashboard/settings"
          className={({ isActive }) =>
            `sidebar-menu-item ${
              isActive ? "active" : ""
            }`
          }
        >
          <span className="sidebar-menu-icon">
            ⚙
          </span>

          <span className="sidebar-menu-label">
            Settings
          </span>
        </NavLink>

        {/* ADMIN PROFILE */}
        <div className="sidebar-profile">

          <div className="sidebar-profile-avatar">
            A
          </div>

          <div className="sidebar-profile-info">
            <strong>
              Administrator
            </strong>

            <span>
              Admin Account
            </span>
          </div>

        </div>

        {/* LOGOUT */}
        <button
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <span className="sidebar-menu-icon">
            ⇥
          </span>

          <span>
            Logout
          </span>
        </button>

      </div>

    </aside>
  );
}