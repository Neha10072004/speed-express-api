
import React, { useState } from "react";
import { trackShipment } from "../services/api";
import "./AdminPages.css";

const statuses = ["In Transit", "Out For Delivery", "Delivered"];

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:5000/api"
    : "https://api.speedexp.in/api")
).replace(/\/+$/, "");

export default function TrackPackage() {
  const [searchNumber, setSearchNumber] = useState("");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [error, setError] = useState("");

  const getTrackingNumber = (data) =>
    String(data?.trackingNumber || "").trim();

  const getLabelUrl = (data) => {
    const trackingNumber = getTrackingNumber(data);

    if (!trackingNumber) return null;

    return `${API_URL}/shipments/${encodeURIComponent(
      trackingNumber
    )}/label`;
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    const number = searchNumber.trim();

    if (!number) {
      setError("Please enter Tracking Number or AWD Number.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setShipment(null);

      const response = await trackShipment(number);
      const data =
        response?.shipment ||
        response?.data ||
        response;

      if (!data || typeof data !== "object") {
        throw new Error("Shipment information was not returned.");
      }

      setShipment(data);
    } catch (err) {
      console.error("Track Package Error:", err);
      setError(err?.message || "Shipment not found.");
    } finally {
      setLoading(false);
    }
  };

  // Always request the PDF from the backend label endpoint.
  const fetchLabelPdf = async (data) => {
    const trackingNumber = getTrackingNumber(data);
    const url = getLabelUrl(data);

    if (!trackingNumber || !url) {
      throw new Error("Tracking Number is missing.");
    }

    console.log("Shipping Label URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/pdf" },
    });

    const contentType =
      response.headers.get("content-type") || "";

    if (!response.ok) {
      let message = `Failed to generate label. HTTP ${response.status}`;

      if (contentType.includes("application/json")) {
        try {
          const result = await response.json();
          message = result.message || message;
        } catch {
          // Keep the original error.
        }
      }

      throw new Error(message);
    }

    if (!contentType.toLowerCase().includes("application/pdf")) {
      const responseText = await response.text();
      console.error("Unexpected label response:", responseText);
      throw new Error(
        "The server did not return a PDF. Check the backend label route."
      );
    }

    const blob = await response.blob();

    if (!blob.size) {
      throw new Error("The generated PDF is empty.");
    }

    return { blob, trackingNumber };
  };

  const downloadLabel = async (data) => {
    let objectUrl;

    try {
      setLabelLoading(true);
      setError("");

      const { blob, trackingNumber } = await fetchLabelPdf(data);
      objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `SpeedExpress-${trackingNumber}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      console.log("Downloaded label for:", trackingNumber);
    } catch (err) {
      console.error("Download Label Error:", err);
      setError(
        err instanceof TypeError
          ? `Cannot connect to the API at ${API_URL}. Check the server and CORS settings.`
          : err?.message || "Unable to download shipping label."
      );
    } finally {
      if (objectUrl) {
        window.setTimeout(
          () => window.URL.revokeObjectURL(objectUrl),
          10000
        );
      }

      setLabelLoading(false);
    }
  };

  const printLabel = async (data) => {
    let printWindow = null;
    let objectUrl = null;

    try {
      setPrintLoading(true);
      setError("");

      // Open a window immediately to reduce popup-blocking issues.
      printWindow = window.open("", "_blank");

      if (!printWindow) {
        throw new Error(
          "Please allow pop-ups to print the shipping label."
        );
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head><title>Speed Express Shipping Label</title></head>
          <body style="font-family:Arial,sans-serif;padding:24px">
            <p>Loading shipping label...</p>
          </body>
        </html>
      `);
      printWindow.document.close();

      const { blob, trackingNumber } = await fetchLabelPdf(data);
      objectUrl = window.URL.createObjectURL(blob);

      printWindow.document.title = `SpeedExpress-${trackingNumber}`;
      printWindow.location.replace(objectUrl);
      printWindow.focus();

      // Allow the browser PDF viewer time to load the document.
      window.setTimeout(() => {
        if (objectUrl) {
          window.URL.revokeObjectURL(objectUrl);
        }
      }, 60000);

      objectUrl = null;
    } catch (err) {
      console.error("Print Label Error:", err);

      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }

      setError(
        err instanceof TypeError
          ? `Cannot connect to the API at ${API_URL}. Check the server and CORS settings.`
          : err?.message || "Unable to print shipping label."
      );
    } finally {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }

      setPrintLoading(false);
    }
  };

  const currentIndex = shipment
    ? statuses.indexOf(shipment.currentStatus)
    : -1;

  const statusClass = (status) => {
    if (status === "Delivered") return "admin-status-delivered";
    if (status === "Out For Delivery") return "admin-status-out";
    return "admin-status-transit";
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <div className="admin-page-kicker">SHIPMENT MANAGEMENT</div>
          <h2>Track Package</h2>
          <p>
            Search a shipment using Tracking Number or AWD Number.
          </p>
        </div>

        <div className="admin-header-badge">
          Live Shipment Tracking
        </div>
      </div>

      <div className="admin-track-search-card">
        <div className="admin-track-search-title">
          <div className="track-search-icon">🔍</div>
          <div>
            <h3>Search Shipment</h3>
            <p>
              Enter Tracking Number or AWD Number to view shipment details.
            </p>
          </div>
        </div>

        <form className="admin-track-form" onSubmit={handleSearch}>
          <input
            type="text"
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            placeholder="Example: SPEED750295 or AWD123456"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Track Package"}
          </button>
        </form>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error">
          <span className="alert-icon">!</span>
          <div>
            <strong>Shipment Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {shipment && (
        <div className="admin-track-result">
          <div className="admin-track-result-header">
            <div>
              <span className="track-result-label">SHIPMENT FOUND</span>
              <h3>{shipment.trackingNumber || "-"}</h3>
              <p>
                AWD Number: <strong>{shipment.awdNumber || "-"}</strong>
              </p>
            </div>

            <div
              className={`admin-current-status ${statusClass(
                shipment.currentStatus
              )}`}
            >
              <span className="status-dot" />
              {shipment.currentStatus || "In Transit"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 20,
              marginBottom: 25,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              disabled={labelLoading || printLoading}
              onClick={() => downloadLabel(shipment)}
              style={{
                padding: "10px 18px",
                border: "none",
                borderRadius: 6,
                cursor:
                  labelLoading || printLoading
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 600,
                background: "#0b3d91",
                color: "#fff",
                opacity: labelLoading || printLoading ? 0.7 : 1,
              }}
            >
              {labelLoading ? "Downloading..." : "📄 Download Label"}
            </button>

            <button
              type="button"
              disabled={printLoading || labelLoading}
              onClick={() => printLabel(shipment)}
              style={{
                padding: "10px 18px",
                border: "none",
                borderRadius: 6,
                cursor:
                  printLoading || labelLoading
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 600,
                background: "#1769aa",
                color: "#fff",
                opacity: printLoading || labelLoading ? 0.7 : 1,
              }}
            >
              {printLoading ? "Opening..." : "🖨️ Print Label"}
            </button>
          </div>

          <div className="admin-track-progress">
            {statuses.map((status, index) => {
              const completed = index <= currentIndex;
              const active = index === currentIndex;

              return (
                <React.Fragment key={status}>
                  <div
                    className={`admin-track-step ${
                      completed ? "completed" : ""
                    } ${active ? "active" : ""}`}
                  >
                    <div className="admin-track-circle">
                      {completed ? "✓" : index + 1}
                    </div>
                    <span>{status}</span>
                  </div>

                  {index < statuses.length - 1 && (
                    <div
                      className={`admin-track-line ${
                        index < currentIndex ? "completed" : ""
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <section className="admin-track-section">
            <div className="admin-section-heading">
              <h3>Current Shipment Status</h3>
              <p>Latest tracking information</p>
            </div>

            <div className="admin-detail-table-wrapper">
              <table className="admin-detail-table">
                <tbody>
                  <tr>
                    <th>Status</th>
                    <td>{shipment.currentStatus || "-"}</td>
                  </tr>
                  <tr>
                    <th>Location</th>
                    <td>{shipment.currentLocation || "-"}</td>
                  </tr>
                  <tr>
                    <th>Date</th>
                    <td>{shipment.currentDate || "-"}</td>
                  </tr>
                  <tr>
                    <th>Time</th>
                    <td>{shipment.currentTime || "-"}</td>
                  </tr>
                  <tr>
                    <th>Remarks</th>
                    <td>{shipment.currentRemarks || "No remarks"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-track-section">
            <div className="admin-section-heading">
              <h3>Shipment Identification</h3>
              <p>Basic shipment reference details</p>
            </div>

            <div className="admin-detail-table-wrapper">
              <table className="admin-detail-table">
                <tbody>
                  <tr>
                    <th>Tracking Number</th>
                    <td>{shipment.trackingNumber || "-"}</td>
                  </tr>
                  <tr>
                    <th>AWD Number</th>
                    <td>{shipment.awdNumber || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-track-section">
            <div className="admin-section-heading">
              <h3>Sender &amp; Receiver</h3>
              <p>Shipment contact information</p>
            </div>

            <div className="admin-detail-table-wrapper">
              <table className="admin-detail-table">
                <thead>
                  <tr>
                    <th>Details</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Name</th>
                    <td>{shipment.senderName || "-"}</td>
                    <td>{shipment.receiverName || "-"}</td>
                  </tr>
                  <tr>
                    <th>Phone</th>
                    <td>{shipment.senderPhone || "-"}</td>
                    <td>{shipment.receiverPhone || "-"}</td>
                  </tr>
                  <tr>
                    <th>Address</th>
                    <td>{shipment.senderAddress || "-"}</td>
                    <td>{shipment.receiverAddress || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-track-section">
            <div className="admin-section-heading">
              <h3>Package Details</h3>
              <p>Shipment package information</p>
            </div>

            <div className="admin-detail-table-wrapper">
              <table className="admin-detail-table">
                <tbody>
                  <tr>
                    <th>Package Type</th>
                    <td>{shipment.packageType || "-"}</td>
                  </tr>
                  <tr>
                    <th>Weight</th>
                    <td>
                      {shipment.weight !== undefined &&
                      shipment.weight !== null
                        ? `${shipment.weight} KG`
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-track-section">
            <div className="admin-section-heading">
              <h3>Shipment Status History</h3>
              <p>Complete shipment movement history</p>
            </div>

            {Array.isArray(shipment.statusHistory) &&
            shipment.statusHistory.length > 0 ? (
              <div className="admin-detail-table-wrapper">
                <table className="admin-detail-table admin-history-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipment.statusHistory.map((history, index) => (
                      <tr key={history._id || index}>
                        <td>
                          <span
                            className={`history-status ${
                              history.status === "Delivered"
                                ? "history-delivered"
                                : history.status === "Out For Delivery"
                                ? "history-out"
                                : "history-transit"
                            }`}
                          >
                            {history.status || "-"}
                          </span>
                        </td>
                        <td>{history.location || "-"}</td>
                        <td>{history.date || "-"}</td>
                        <td>{history.time || "-"}</td>
                        <td>{history.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-no-history">
                No shipment history available.
              </div>
            )}
          </section>
        </div>
      )}

      {!shipment && !loading && !error && (
        <div className="admin-track-empty">
          <div className="admin-track-empty-icon">📦</div>
          <h3>Track Your Shipment</h3>
          <p>
            Enter a Tracking Number or AWD Number above to view complete
            shipment information.
          </p>
        </div>
      )}
    </div>
  );
}