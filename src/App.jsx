import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ===============================
// COMPONENTS
// ===============================

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import ScrollToTop from "./components/ScrollToTop";

// ===============================
// PUBLIC PAGES
// ===============================

import Home from "./pages/Home";
import Services from "./pages/Services";
import Tracking from "./pages/Tracking";
import CorporateGifting from "./pages/CorporateGifting";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// ===============================
// ADMIN PAGES
// ===============================

import AdminDashboard from "./pages/AdminDashboard";
import DashboardHome from "./pages/DashboardHome";
import CreateBooking from "./pages/CreateBooking";
import OrdersList from "./pages/OrdersList";
import TrackPackage from "./pages/TrackPackage";
import Status from "./pages/Status";
import AdminContact from "./pages/AdminContact";
import Settings from "./pages/Settings";

// ===============================
// PUBLIC WEBSITE LAYOUT
// ===============================

function PublicLayout() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>

          {/* HOME */}
          <Route
            path="/"
            element={<Home />}
          />

          {/* SERVICES */}
          <Route
            path="/services"
            element={<Services />}
          />

          {/* PUBLIC TRACKING */}
          <Route
            path="/tracking"
            element={<Tracking />}
          />

          {/* CORPORATE GIFTING */}
          <Route
            path="/corporate-gifting"
            element={<CorporateGifting />}
          />

          {/* ABOUT */}
          <Route
            path="/about"
            element={<About />}
          />

          {/* CONTACT */}
          <Route
            path="/contact"
            element={<Contact />}
          />

          {/* LOGIN */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* SIGNUP */}
          <Route
            path="/signup"
            element={<Signup />}
          />

          {/* UNKNOWN PUBLIC URL */}
          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </main>

      <Footer />
    </>
  );
}

// ===============================
// MAIN APP
// ===============================

export default function App() {
  return (
    <BrowserRouter>

      {/* ===========================
          ALWAYS SCROLL TO TOP
      =========================== */}
      <ScrollToTop />

      <Routes>

        {/* =================================
            ADMIN DASHBOARD
        ================================= */}

        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        >

          {/* /admin-dashboard
              → /admin-dashboard/home
          */}
          <Route
            index
            element={
              <Navigate
                to="home"
                replace
              />
            }
          />

          {/* ADMIN HOME */}
          <Route
            path="home"
            element={<DashboardHome />}
          />

          {/* CREATE BOOKING */}
          <Route
            path="create-booking"
            element={<CreateBooking />}
          />

          {/* ORDERS */}
          <Route
            path="orders"
            element={<OrdersList />}
          />

          {/* ADMIN TRACK PACKAGE */}
          <Route
            path="track-package"
            element={<TrackPackage />}
          />

          {/* UPDATE SHIPMENT STATUS */}
          <Route
            path="status"
            element={<Status />}
          />

          {/* ADMIN CONTACT */}
          <Route
            path="contact"
            element={<AdminContact />}
          />

          {/* SETTINGS */}
          <Route
            path="settings"
            element={<Settings />}
          />

        </Route>

        {/* =================================
            PUBLIC WEBSITE
        ================================= */}

        <Route
          path="/*"
          element={<PublicLayout />}
        />

      </Routes>

      {/* =================================
          FLOATING WHATSAPP BUTTON
      ================================= */}

      <WhatsAppButton />

    </BrowserRouter>
  );
}