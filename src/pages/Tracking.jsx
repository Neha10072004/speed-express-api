
import React, { useState, useEffect } from "react";
import TrackingComponent from "../components/Tracking";
import { checkBackendHealth } from "../services/api";

export default function Tracking() {
  const [searchNumber, setSearchNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendOnline, setBackendOnline] = useState(null);

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

  const statusStyle = {
    maxWidth: "700px",
    width: "calc(100% - 32px)",
    margin: "20px auto",
    padding: "16px 20px",
    textAlign: "center",
    border: "1px solid",
    borderRadius: "12px",
    boxSizing: "border-box",
    backgroundColor:
      backendOnline === true
        ? "#e8f8ee"
        : backendOnline === false
        ? "#fef2f2"
        : "#eff6ff",
    borderColor:
      backendOnline === true
        ? "#a8e6bd"
        : backendOnline === false
        ? "#fecaca"
        : "#bfdbfe",
    color:
      backendOnline === true
        ? "#176b35"
        : backendOnline === false
        ? "#991b1b"
        : "#0b3d91",
  };

  let statusTitle;
  let statusDescription;

  if (backendOnline === true) {
    statusTitle = "Website Backend Working Now";
    statusDescription =
      "Your Speed Express website is connected to the backend server.";
  } else if (backendOnline === false) {
    statusTitle = "Backend Server Temporarily Unavailable";
    statusDescription =
      "We could not connect to the backend. Please try again shortly.";
  } else {
    statusTitle = "Checking Backend Server...";
    statusDescription =
      "Please wait while we check the server connection.";
  }

  return (
    <>
      <div
        style={statusStyle}
        role="status"
        aria-live="polite"
      >
        <strong>{statusTitle}</strong>

        <p style={{ margin: "8px 0 0", fontSize: "14px" }}>
          {statusDescription}
        </p>
      </div>

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
