import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const close = () => {
    setOpen(false);
  };

  const navClass = ({ isActive }) =>
    isActive ? "active" : "";

  return (
    <header className="navbar">

      <div className="container nav-inner">

        {/* ================= LOGO ================= */}

        <Link
          to="/"
          className="brand"
          onClick={close}
          aria-label="Speed Express Home"
        >
          <img
  src={`${import.meta.env.BASE_URL}speed-express-logo.png`}
  alt="Speed Express"
/>
        </Link>


        {/* ================= MOBILE MENU ================= */}

        <button
          className={`menu-btn ${open ? "active" : ""}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close Menu" : "Open Menu"}
          aria-expanded={open}
        >
          {open ? "✕" : "☰"}
        </button>


        {/* ================= NAVIGATION ================= */}

        <nav
          className={
            open
              ? "nav-links open"
              : "nav-links"
          }
        >

          <NavLink
            to="/"
            className={navClass}
            onClick={close}
            end
          >
            Home
          </NavLink>

          <NavLink
            to="/services"
            className={navClass}
            onClick={close}
          >
            Services
          </NavLink>

          <NavLink
            to="/tracking"
            className={navClass}
            onClick={close}
          >
            Tracking
          </NavLink>

          <NavLink
            to="/corporate-gifting"
            className={navClass}
            onClick={close}
          >
            Corporate Gifting
          </NavLink>

          <NavLink
            to="/about"
            className={navClass}
            onClick={close}
          >
            About
          </NavLink>

          <NavLink
            to="/contact"
            className={navClass}
            onClick={close}
          >
            Contact
          </NavLink>


          {/* ================= LOGIN ================= */}

          <Link
            className="auth-link"
            to="/login"
            onClick={close}
          >
            Login
          </Link>


          {/* ================= SIGN UP ================= */}

          <Link
            className="nav-cta signup-cta"
            to="/signup"
            onClick={close}
          >
            Sign Up
          </Link>

        </nav>

      </div>

    </header>
  );
}