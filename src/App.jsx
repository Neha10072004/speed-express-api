
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Shared components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import ScrollToTop from "./components/ScrollToTop";

// Public pages
import Home from "./pages/Home";
import Services from "./pages/Services";
import Tracking from "./pages/Tracking";
import CorporateGifting from "./pages/CorporateGifting";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import DashboardHome from "./pages/DashboardHome";
import CreateBooking from "./pages/CreateBooking";
import OrdersList from "./pages/OrdersList";
import TrackPackage from "./pages/TrackPackage";
import Status from "./pages/Status";
import AdminContact from "./pages/AdminContact";
import Settings from "./pages/Settings";

// ======================================
// PUBLIC WEBSITE LAYOUT
// ======================================

function PublicLayout() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route
            path="/corporate-gifting"
            element={<CorporateGifting />}
          />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>

      <Footer />
    </>
  );
}

// ======================================
// MAIN APP
// ======================================

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Routes>
        {/* ADMIN DASHBOARD */}
        <Route
          path="/admin-dashboard"
          element={<AdminDashboard />}
        >
          {/* Redirect dashboard root to home */}
          <Route
            index
            element={
              <Navigate to="home" replace />
            }
          />

          <Route
            path="home"
            element={<DashboardHome />}
          />

          <Route
            path="create-booking"
            element={<CreateBooking />}
          />

          <Route
            path="orders"
            element={<OrdersList />}
          />

          <Route
            path="track-package"
            element={<TrackPackage />}
          />

          <Route
            path="status"
            element={<Status />}
          />

          <Route
            path="contact"
            element={<AdminContact />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />
        </Route>

        {/* PUBLIC WEBSITE */}
        <Route
          path="/*"
          element={<PublicLayout />}
        />
      </Routes>

      <WhatsAppButton />
    </BrowserRouter>
  );
}