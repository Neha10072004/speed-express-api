
import React, { useState, useEffect } from "react";
import TrackingComponent from "../components/Tracking";
import { checkBackendHealth } from "../services/api";

export default function Tracking() {
  // -----------------------------------------------
  // STATE
  // -----------------------------------------------

  const [searchNumber, setSearchNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendOnline, setBackendOnline] = useState(null);

  // -----------------------------------------------
  // CHECK BACKEND CONNECTION
  // -----------------------------------------------

  useEffect(() => {
    let active = true;

    const checkBackend = async () => {
      try {
        await checkBackendHealth();

        if (active) {
          setBackendOnline(true);
        }
      } catch (err) {
        console.error("Backend health check failed:", err);

        if (active) {
          setBackendOnline(false);
        }
      }
    };

    checkBackend();

    return () => {
      active = false;
    };
  }, []);

  // -----------------------------------------------
  // BACKEND STATUS MESSAGE
  // -----------------------------------------------

  const getBackendStatusStyle = () => {
    const baseStyle = {
      maxWidth: "700px",
      width: "calc(100% - 32px)",
      margin: "20px auto",
      padding: "16px 20px",
      textAlign: "center",
      border: "1px solid",
      borderRadius: "12px",
      boxSizing: "border-box",
      fontFamily: "Arial, sans-serif",
    };

    if (backendOnline === true) {
      return {
        ...baseStyle,
        backgroundColor: "#e8f8ee",
        borderColor: "#a8e6bd",
        color: "#176b35",
      };
    }

    if (backendOnline === false) {
      return {
        ...baseStyle,
        backgroundColor: "#fef2f2",
        borderColor: "#fecaca",
        color: "#991b1b",
      };
    }

    return {
      ...baseStyle,
      backgroundColor: "#eff6ff",
      borderColor: "#bfdbfe",
      color: "#0b3d91",
    };
  };

  // -----------------------------------------------
  // BACKEND STATUS TEXT
  // -----------------------------------------------

  let statusTitle = "Checking Backend Server...";
  let statusDescription =
    "Please wait while we check the server connection.";

  if (backendOnline === true) {
    statusTitle = "Website Backend Working Now";
    statusDescription =
      "Your Speed Express website is connected to the backend server.";
  }

  if (backendOnline === false) {
    statusTitle = "Backend Server Temporarily Unavailable";
    statusDescription =
      "We could not connect to the backend. Please try again shortly.";
  }

  // -----------------------------------------------
  // RENDER
  // -----------------------------------------------

  return (
    <>
      {/* BACKEND CONNECTION STATUS */}

      <div
        style={getBackendStatusStyle()}
        role="status"
        aria-live="polite"
      >
        <strong>{statusTitle}</strong>

        <p
          style={{
            margin: "8px 0 0",
            fontSize: "14px",
            lineHeight: 1.5,
          }}
        >
          {statusDescription}
        </p>
      </div>

      {/* CUSTOMER SHIPMENT TRACKING */}

      <TrackingComponent
        searchNumber={searchNumber}
        setSearchNumber={setSearchNumber}
        shipment={shipment}
        setShipment={setShipment}
        loading={loading}
        setLoading={setLoading}
        error={error}
        setError={setError}
      />
    </>
  );
}
