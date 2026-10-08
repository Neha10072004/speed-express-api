import React, { useState } from "react";
import { trackShipment } from "../services/api";
import "./AdminPages.css";

const statuses = [
  "In Transit",
  "Out For Delivery",
  "Delivered",
];

export default function TrackPackage() {
  const [searchNumber, setSearchNumber] = useState("");
  const [shipment, setShipment] = useState(null);

  const [loading, setLoading] = useState(false);
  const [labelLoading, setLabelLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);

  const [error, setError] = useState("");

  // =====================================================
  // API URL
  // =====================================================

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

  // =====================================================
  // TRACK SHIPMENT
  // =====================================================

  const handleSearch = async (e) => {
    e.preventDefault();

    const number = searchNumber.trim();

    if (!number) {
      setError(
        "Please enter Tracking Number or AWD Number."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setShipment(null);

      const response = await trackShipment(number);

      console.log(
        "Track Shipment API Response:",
        response
      );

      const data =
        response?.shipment ||
        response?.data ||
        response;

      if (!data) {
        throw new Error(
          "Shipment information was not returned by the server."
        );
      }

      setShipment(data);
    } catch (err) {
      console.error(
        "Track Package Error:",
        err
      );

      setError(
        err?.message ||
          "Shipment not found."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GET TRACKING NUMBER
  // =====================================================

  const getTrackingNumber = (shipmentData) => {
    if (!shipmentData) {
      return "";
    }

    return String(
      shipmentData.trackingNumber || ""
    ).trim();
  };

  // =====================================================
  // GET LABEL URL
  // =====================================================

  const getLabelUrl = (shipmentData) => {
    const trackingNumber =
      getTrackingNumber(shipmentData);

    if (!trackingNumber) {
      return null;
    }

    return (
      `${API_URL}/shipments/` +
      `${encodeURIComponent(trackingNumber)}` +
      `/label`
    );
  };

  // =====================================================
  // DOWNLOAD LABEL
  // =====================================================

  const downloadLabel = async (shipmentData) => {
    const trackingNumber =
      getTrackingNumber(shipmentData);

    if (!trackingNumber) {
      setError(
        "Tracking Number is missing."
      );
      return;
    }

    const url =
      getLabelUrl(shipmentData);

    if (!url) {
      setError(
        "Shipping label URL could not be created."
      );
      return;
    }

    try {
      setLabelLoading(true);
      setError("");

      console.log(
        "Downloading shipping label:"
      );

      console.log(
        "Tracking Number:",
        trackingNumber
      );

      console.log(
        "URL:",
        url
      );

      const response =
        await fetch(url, {
          method: "GET",
        });

      console.log(
        "Label Status:",
        response.status
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      console.log(
        "Label Content-Type:",
        contentType
      );

      // ---------------------------------------------
      // ERROR RESPONSE
      // ---------------------------------------------

      if (!response.ok) {
        let message =
          `Failed to download label. HTTP ${response.status}`;

        if (
          contentType.includes(
            "application/json"
          )
        ) {
          try {
            const data =
              await response.json();

            message =
              data.message ||
              message;
          } catch (error) {
            console.error(
              "JSON error:",
              error
            );
          }
        }

        throw new Error(message);
      }

      // ---------------------------------------------
      // CHECK PDF
      // ---------------------------------------------

      if (
        !contentType.includes(
          "application/pdf"
        )
      ) {
        const responseText =
          await response.text();

        console.error(
          "Unexpected response:",
          responseText
        );

        throw new Error(
          "Server did not return a PDF shipping label."
        );
      }

      // ---------------------------------------------
      // CREATE BLOB
      // ---------------------------------------------

      const blob =
        await response.blob();

      console.log(
        "PDF Size:",
        blob.size
      );

      if (
        !blob ||
        blob.size === 0
      ) {
        throw new Error(
          "Shipping label PDF is empty."
        );
      }

      // ---------------------------------------------
      // DOWNLOAD
      // ---------------------------------------------

      const blobUrl =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = blobUrl;

      link.download =
        `SpeedExpress-${trackingNumber}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(
          blobUrl
        );
      }, 2000);

      console.log(
        "Shipping label downloaded successfully."
      );
    } catch (err) {
      console.error(
        "Download Label Error:",
        err
      );

      if (
        err instanceof TypeError &&
        err.message ===
          "Failed to fetch"
      ) {
        setError(
          `Cannot connect to Speed Express API at ${API_URL}.`
        );
      } else {
        setError(
          err?.message ||
            "Unable to download shipping label."
        );
      }
    } finally {
      setLabelLoading(false);
    }
  };

  // =====================================================
  // PRINT LABEL
  // =====================================================

  const printLabel = async (shipmentData) => {
    const trackingNumber =
      getTrackingNumber(shipmentData);

    if (!trackingNumber) {
      setError(
        "Tracking Number is missing."
      );
      return;
    }

    const url =
      getLabelUrl(shipmentData);

    if (!url) {
      setError(
        "Shipping label URL could not be created."
      );
      return;
    }

    let printWindow = null;

    try {
      setPrintLoading(true);
      setError("");

      console.log(
        "Printing shipping label:"
      );

      console.log(
        "Tracking Number:",
        trackingNumber
      );

      console.log(
        "URL:",
        url
      );

      // Open window immediately
      printWindow =
        window.open(
          "",
          "_blank"
        );

      if (!printWindow) {
        throw new Error(
          "Please allow pop-ups to print the shipping label."
        );
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>
              Speed Express - ${trackingNumber}
            </title>
          </head>

          <body
            style="
              margin:0;
              font-family:Arial,sans-serif;
              display:flex;
              align-items:center;
              justify-content:center;
              height:100vh;
            "
          >
            <h3>
              Loading shipping label...
            </h3>
          </body>
        </html>
      `);

      printWindow.document.close();

      // Fetch PDF
      const response =
        await fetch(url);

      console.log(
        "Print Label Status:",
        response.status
      );

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      console.log(
        "Print Label Content-Type:",
        contentType
      );

      // ---------------------------------------------
      // SERVER ERROR
      // ---------------------------------------------

      if (!response.ok) {
        if (printWindow) {
          printWindow.close();
        }

        let message =
          `Failed to print label. HTTP ${response.status}`;

        if (
          contentType.includes(
            "application/json"
          )
        ) {
          try {
            const data =
              await response.json();

            message =
              data.message ||
              message;
          } catch (error) {
            console.error(
              "JSON error:",
              error
            );
          }
        }

        throw new Error(message);
      }

      // ---------------------------------------------
      // CHECK PDF
      // ---------------------------------------------

      if (
        !contentType.includes(
          "application/pdf"
        )
      ) {
        if (printWindow) {
          printWindow.close();
        }

        throw new Error(
          "Server did not return a PDF shipping label."
        );
      }

      // ---------------------------------------------
      // GET PDF
      // ---------------------------------------------

      const blob =
        await response.blob();

      if (
        !blob ||
        blob.size === 0
      ) {
        if (printWindow) {
          printWindow.close();
        }

        throw new Error(
          "Shipping label PDF is empty."
        );
      }

      console.log(
        "Print PDF Size:",
        blob.size
      );

      // ---------------------------------------------
      // OPEN PDF
      // ---------------------------------------------

      const blobUrl =
        window.URL.createObjectURL(
          blob
        );

      printWindow.location.href =
        blobUrl;

      printWindow.focus();

      // ---------------------------------------------
      // CLEANUP
      // ---------------------------------------------

      setTimeout(() => {
        window.URL.revokeObjectURL(
          blobUrl
        );
      }, 60000);
    } catch (err) {
      console.error(
        "Print Label Error:",
        err
      );

      if (printWindow) {
        try {
          printWindow.close();
        } catch (error) {
          console.error(
            "Window close error:",
            error
          );
        }
      }

      if (
        err instanceof TypeError &&
        err.message ===
          "Failed to fetch"
      ) {
        setError(
          `Cannot connect to Speed Express API at ${API_URL}.`
        );
      } else {
        setError(
          err?.message ||
            "Unable to print shipping label."
        );
      }
    } finally {
      setPrintLoading(false);
    }
  };

  // =====================================================
  // STATUS
  // =====================================================

  const getStatusIndex = (status) => {
    return statuses.indexOf(status);
  };

  const currentIndex = shipment
    ? getStatusIndex(
        shipment.currentStatus
      )
    : -1;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="admin-page">

      {/* HEADER */}

      <div className="admin-page-header">

        <div>

          <div className="admin-page-kicker">
            SHIPMENT MANAGEMENT
          </div>

          <h2>
            Track Package
          </h2>

          <p>
            Search a shipment using Tracking
            Number or AWD Number.
          </p>

        </div>

        <div className="admin-header-badge">
          Live Shipment Tracking
        </div>

      </div>

      {/* SEARCH */}

      <div className="admin-track-search-card">

        <div className="admin-track-search-title">

          <div className="track-search-icon">
            🔍
          </div>

          <div>

            <h3>
              Search Shipment
            </h3>

            <p>
              Enter Tracking Number or AWD
              Number to view shipment details.
            </p>

          </div>

        </div>

        <form
          className="admin-track-form"
          onSubmit={handleSearch}
        >

          <input
            type="text"
            value={searchNumber}
            onChange={(e) =>
              setSearchNumber(
                e.target.value
              )
            }
            placeholder="Example: SPEED123456 or AWD123456"
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Searching..."
              : "Track Package"}
          </button>

        </form>

      </div>

      {/* ERROR */}

      {error && (
        <div className="admin-alert admin-alert-error">

          <span className="alert-icon">
            !
          </span>

          <div>

            <strong>
              Shipment Error
            </strong>

            <p>
              {error}
            </p>

          </div>

        </div>
      )}

      {/* RESULT */}

      {shipment && (
        <div className="admin-track-result">

          {/* RESULT HEADER */}

          <div className="admin-track-result-header">

            <div>

              <span className="track-result-label">
                SHIPMENT FOUND
              </span>

              <h3>
                {shipment.trackingNumber}
              </h3>

              <p>
                AWD Number:{" "}
                <strong>
                  {shipment.awdNumber || "-"}
                </strong>
              </p>

            </div>

            <div
              className={`admin-current-status ${
                shipment.currentStatus ===
                "Delivered"
                  ? "admin-status-delivered"
                  : shipment.currentStatus ===
                    "Out For Delivery"
                  ? "admin-status-out"
                  : "admin-status-transit"
              }`}
            >

              <span className="status-dot"></span>

              {shipment.currentStatus || "In Transit"}

            </div>

          </div>

          {/* LABEL BUTTONS */}

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "20px",
              marginBottom: "25px",
              flexWrap: "wrap",
            }}
          >

            <button
              type="button"
              disabled={
                labelLoading ||
                printLoading
              }
              onClick={() =>
                downloadLabel(
                  shipment
                )
              }
              style={{
                padding: "10px 18px",
                border: "none",
                borderRadius: "6px",
                cursor:
                  labelLoading ||
                  printLoading
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "600",
                background: "#0b3d91",
                color: "#ffffff",
                opacity:
                  labelLoading ||
                  printLoading
                    ? 0.7
                    : 1,
              }}
            >
              {labelLoading
                ? "Downloading..."
                : "📄 Download Label"}
            </button>

            <button
              type="button"
              disabled={
                printLoading ||
                labelLoading
              }
              onClick={() =>
                printLabel(
                  shipment
                )
              }
              style={{
                padding: "10px 18px",
                border: "none",
                borderRadius: "6px",
                cursor:
                  printLoading ||
                  labelLoading
                    ? "not-allowed"
                    : "pointer",
                fontWeight: "600",
                background: "#1769aa",
                color: "#ffffff",
                opacity:
                  printLoading ||
                  labelLoading
                    ? 0.7
                    : 1,
              }}
            >
              {printLoading
                ? "Opening..."
                : "🖨️ Print Label"}
            </button>

          </div>

          {/* STATUS PROGRESS */}

          <div className="admin-track-progress">

            {statuses.map(
              (status, index) => {

                const completed =
                  index <= currentIndex;

                const active =
                  index === currentIndex;

                return (
                  <React.Fragment
                    key={status}
                  >

                    <div
                      className={`admin-track-step ${
                        completed
                          ? "completed"
                          : ""
                      } ${
                        active
                          ? "active"
                          : ""
                      }`}
                    >

                      <div className="admin-track-circle">

                        {completed
                          ? "✓"
                          : index + 1}

                      </div>

                      <span>
                        {status}
                      </span>

                    </div>

                    {index <
                      statuses.length - 1 && (
                      <div
                        className={`admin-track-line ${
                          index <
                          currentIndex
                            ? "completed"
                            : ""
                        }`}
                      />
                    )}

                  </React.Fragment>
                );
              }
            )}

          </div>

          {/* CURRENT STATUS */}

          <div className="admin-track-section">

            <div className="admin-section-heading">

              <h3>
                Current Shipment Status
              </h3>

              <p>
                Latest tracking information
              </p>

            </div>

            <div className="admin-detail-table-wrapper">

              <table className="admin-detail-table">

                <tbody>

                  <tr>
                    <th>Status</th>

                    <td>
                      <strong>
                        {
                          shipment.currentStatus ||
                          "-"
                        }
                      </strong>
                    </td>
                  </tr>

                  <tr>
                    <th>Location</th>

                    <td>
                      {
                        shipment.currentLocation ||
                        "-"
                      }
                    </td>
                  </tr>

                  <tr>
                    <th>Date</th>

                    <td>
                      {
                        shipment.currentDate ||
                        "-"
                      }
                    </td>
                  </tr>

                  <tr>
                    <th>Time</th>

                    <td>
                      {
                        shipment.currentTime ||
                        "-"
                      }
                    </td>
                  </tr>

                  <tr>
                    <th>Remarks</th>

                    <td>
                      {
                        shipment.currentRemarks ||
                        "No remarks"
                      }
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

          </div>

          {/* IDENTIFICATION */}

          <div className="admin-track-section">

            <div className="admin-section-heading">

              <h3>
                Shipment Identification
              </h3>

              <p>
                Basic shipment reference details
              </p>

            </div>

            <div className="admin-detail-table-wrapper">

              <table className="admin-detail-table">

                <tbody>

                  <tr>
                    <th>
                      Tracking Number
                    </th>

                    <td>
                      <strong>
                        {
                          shipment.trackingNumber ||
                          "-"
                        }
                      </strong>
                    </td>
                  </tr>

                  <tr>
                    <th>
                      AWD Number
                    </th>

                    <td>
                      <strong>
                        {
                          shipment.awdNumber ||
                          "-"
                        }
                      </strong>
                    </td>
                  </tr>

                </tbody>

              </table>

            </div>

          </div>

          {/* SENDER RECEIVER */}

          <div className="admin-track-section">

            <div className="admin-section-heading">

              <h3>
                Sender & Receiver
              </h3>

              <p>
                Shipment contact information
              </p>

            </div>

            <div className="admin-detail-table-wrapper">

              <table className="admin-detail-table">

                <thead>

                  <tr>

                    <th>
                      Details
                    </th>

                    <th>
                      Sender
                    </th>

                    <th>
                      Receiver
                    </th>

                  </tr>

                </thead>

                <tbody>

                  <tr>

                    <th>
                      Name
                    </th>

                    <td>
                      {
                        shipment.senderName ||
                        "-"
                      }
                    </td>

                    <td>
                      {
                        shipment.receiverName ||
                        "-"
                      }
                    </td>

                  </tr>

                  <tr>

                    <th>
                      Phone
                    </th>

                    <td>
                      {
                        shipment.senderPhone ||
                        "-"
                      }
                    </td>

                    <td>
                      {
                        shipment.receiverPhone ||
                        "-"
                      }
                    </td>

                  </tr>

                  <tr>

                    <th>
                      Address
                    </th>

                    <td>
                      {
                        shipment.senderAddress ||
                        "-"
                      }
                    </td>

                    <td>
                      {
                        shipment.receiverAddress ||
                        "-"
                      }
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

          {/* PACKAGE */}

          <div className="admin-track-section">

            <div className="admin-section-heading">

              <h3>
                Package Details
              </h3>

              <p>
                Shipment package information
              </p>

            </div>

            <div className="admin-detail-table-wrapper">

              <table className="admin-detail-table">

                <tbody>

                  <tr>

                    <th>
                      Package Type
                    </th>

                    <td>
                      {
                        shipment.packageType ||
                        "-"
                      }
                    </td>

                  </tr>

                  <tr>

                    <th>
                      Weight
                    </th>

                    <td>
                      {
                        shipment.weight !==
                          undefined &&
                        shipment.weight !==
                          null
                          ? `${shipment.weight} KG`
                          : "-"
                      }
                    </td>

                  </tr>

                </tbody>

              </table>

            </div>

          </div>

          {/* HISTORY */}

          <div className="admin-track-section">

            <div className="admin-section-heading">

              <h3>
                Shipment Status History
              </h3>

              <p>
                Complete shipment movement history
              </p>

            </div>

            {shipment.statusHistory &&
            shipment.statusHistory.length >
              0 ? (

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

                    {shipment.statusHistory.map(
                      (
                        history,
                        index
                      ) => (

                        <tr
                          key={index}
                        >

                          <td>

                            <span
                              className={`history-status ${
                                history.status ===
                                "Delivered"
                                  ? "history-delivered"
                                  : history.status ===
                                    "Out For Delivery"
                                  ? "history-out"
                                  : "history-transit"
                              }`}
                            >
                              {
                                history.status
                              }
                            </span>

                          </td>

                          <td>
                            {
                              history.location ||
                              "-"
                            }
                          </td>

                          <td>
                            {
                              history.date ||
                              "-"
                            }
                          </td>

                          <td>
                            {
                              history.time ||
                              "-"
                            }
                          </td>

                          <td>
                            {
                              history.remarks ||
                              "-"
                            }
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            ) : (

              <div className="admin-no-history">
                No shipment history available.
              </div>

            )}

          </div>

        </div>
      )}

      {/* EMPTY */}

      {!shipment &&
        !loading &&
        !error && (

          <div className="admin-track-empty">

            <div className="admin-track-empty-icon">
              📦
            </div>

            <h3>
              Track Your Shipment
            </h3>

            <p>
              Enter a Tracking Number or AWD
              Number above to view complete
              shipment information.
            </p>

          </div>

        )}

    </div>
  );
}