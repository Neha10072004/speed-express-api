
import React, { useMemo, useState } from "react";
import { API_URL } from "../services/api";
import "./Tracking.css";

// ==================================================
// SPEED EXPRESS - CUSTOMER TRACKING COMPONENT
// File: src/components/Tracking.jsx
//
// Features:
// 1. Shipment tracking
// 2. Shipment progress
// 3. Sender and receiver details
// 4. Status and scan history
// 5. View supporting documents
// 6. Download supporting documents
// ==================================================

// --------------------------------------------------
// TRACKING PROGRESS STEPS
// --------------------------------------------------

const STEPS = [
  "Shipment Booked",
  "Material Received at Origin Office",
  "In Transit to Next Hub",
  "Out For Delivery",
  "Delivered Successfully",
];

// --------------------------------------------------
// STATUS DESCRIPTIONS
// --------------------------------------------------

const STATUS_DESCRIPTIONS = {
  "Shipment Booked": "Your shipment booking has been confirmed.",

  "Material Received at Origin Office":
    "Your shipment has reached the origin office.",

  "In Transit to Next Hub":
    "Your shipment is moving to the next hub.",

  "Vehicle Delayed":
    "Your shipment movement has been delayed. Please check the latest scan.",

  "Out For Delivery":
    "Your shipment is on its way to the recipient.",

  "Delivered Successfully":
    "Your shipment has been delivered successfully.",

  "Shipment Cancelled":
    "This shipment has been cancelled.",

  "Delivery Attempted - Customer Unavailable":
    "Delivery was attempted, but the customer was unavailable.",

  "Vehicle Breakdown":
    "The shipment vehicle has experienced a breakdown.",
};

// --------------------------------------------------
// NORMALIZE SHIPMENT RESPONSE
// --------------------------------------------------

const normalizeShipment = (response) => {
  if (!response) return null;

  return (
    response.shipment ||
    response.data?.shipment ||
    response.data ||
    response
  );
};

// --------------------------------------------------
// GET CURRENT STATUS
// --------------------------------------------------

const getStatus = (shipment) =>
  shipment?.currentStatus ||
  shipment?.status ||
  "Shipment Booked";

// --------------------------------------------------
// GET SHIPMENT HISTORY
// --------------------------------------------------

const getHistory = (shipment) => {
  const history = Array.isArray(shipment?.history)
    ? shipment.history
    : Array.isArray(shipment?.statusHistory)
      ? shipment.statusHistory
      : [];

  return [...history].sort((a, b) => {
    const dateA = new Date(
      a.timestamp || a.updatedAt || a.createdAt || 0
    ).getTime();

    const dateB = new Date(
      b.timestamp || b.updatedAt || b.createdAt || 0
    ).getTime();

    return dateB - dateA;
  });
};

// --------------------------------------------------
// GET SUPPORTING DOCUMENTS
// --------------------------------------------------

const getSupportingDocuments = (shipment) => {
  const documents = Array.isArray(shipment?.supportingDocuments)
    ? shipment.supportingDocuments
    : Array.isArray(shipment?.documents)
      ? shipment.documents
      : [];

  return documents;
};

// --------------------------------------------------
// GET DOCUMENT ID
// --------------------------------------------------

const getDocumentId = (document) => {
  if (!document) return null;

  return (
    document._id ||
    document.documentId ||
    document.id ||
    null
  );
};

// --------------------------------------------------
// FIND DOCUMENT ATTACHED TO A HISTORY EVENT
// --------------------------------------------------

const getEventDocument = (event, documents = []) => {
  if (!event) return null;

  // Preferred format returned by shipmentController.js:
  // event.supportingDocument = { _id, originalName, ... }

  const attachedDocument =
    event.supportingDocument ||
    event.attachment ||
    event.document ||
    null;

  if (
    attachedDocument &&
    typeof attachedDocument === "object"
  ) {
    return attachedDocument;
  }

  // Some API responses may return the document ID as a string.
  const eventDocumentId =
    event.supportingDocumentId ||
    event.documentId ||
    (typeof attachedDocument === "string"
      ? attachedDocument
      : null);

  if (!eventDocumentId) return null;

  // Match the history event with the shipment's document list.
  const matchedDocument = documents.find((document) => {
    const documentId = getDocumentId(document);

    return (
      documentId &&
      String(documentId) === String(eventDocumentId)
    );
  });

  return matchedDocument || null;
};

// --------------------------------------------------
// BUILD DOCUMENT URL
// --------------------------------------------------

const getDocumentUrl = (trackingNumber, document, action) => {
  const documentId = getDocumentId(document);

  if (!trackingNumber || !documentId) {
    return null;
  }

  const baseUrl = API_URL.replace(/\/+$/, "");

  return (
    `${baseUrl}/shipments/` +
    `${encodeURIComponent(trackingNumber)}/documents/` +
    `${encodeURIComponent(documentId)}/${action}`
  );
};

// --------------------------------------------------
// FORMAT FILE SIZE
// --------------------------------------------------

const formatFileSize = (bytes) => {
  if (!bytes || Number(bytes) <= 0) {
    return "";
  }

  const size = Number(bytes);

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

// --------------------------------------------------
// FORMAT DATE
// --------------------------------------------------

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// --------------------------------------------------
// FORMAT TIME
// --------------------------------------------------

const formatTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// --------------------------------------------------
// GET EVENT TIMESTAMP
// --------------------------------------------------

const getTimestamp = (event) =>
  event?.timestamp ||
  event?.updatedAt ||
  event?.createdAt ||
  null;

// --------------------------------------------------
// GET PROGRESS INDEX
// --------------------------------------------------

const getProgressIndex = (status) => {
  if (status === "Delivered Successfully") return 4;

  if (status === "Out For Delivery") return 3;

  if (
    status === "In Transit to Next Hub" ||
    status === "Vehicle Delayed" ||
    status === "Vehicle Breakdown"
  ) {
    return 2;
  }

  if (status === "Material Received at Origin Office") {
    return 1;
  }

  if (status === "Shipment Booked") {
    return 0;
  }

  return -1;
};

// --------------------------------------------------
// GET STATUS CSS CLASS
// --------------------------------------------------

const getStatusClass = (status) => {
  if (status === "Delivered Successfully") {
    return "success";
  }

  if (
    status === "Shipment Cancelled" ||
    status === "Vehicle Breakdown" ||
    status === "Vehicle Delayed"
  ) {
    return "warning";
  }

  if (status === "Out For Delivery") {
    return "out-for-delivery";
  }

  return "in-progress";
};

// --------------------------------------------------
// GET VALUE
// --------------------------------------------------

const getValue = (...values) =>
  values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      value !== ""
  ) || "—";

// ==================================================
// MAIN TRACKING COMPONENT
// ==================================================

export default function Tracking({
  searchNumber = "",
  setSearchNumber = () => {},
  shipment = null,
  setShipment = () => {},
  loading = false,
  setLoading = () => {},
  error = "",
  setError = () => {},
}) {
  const [activeTab, setActiveTab] = useState("details");

  // ------------------------------------------------
  // SEARCH SHIPMENT
  // ------------------------------------------------

  const searchShipment = async (event) => {
    event?.preventDefault();

    const identifier = searchNumber.trim();

    if (!identifier) {
      setError(
        "Please enter a tracking number or AWD number."
      );

      setShipment(null);
      return;
    }

    setLoading(true);
    setError("");
    setShipment(null);

    try {
      const { trackShipment } = await import("../services/api");

      const response = await trackShipment(identifier);

      const result = normalizeShipment(response);

      if (
        response?.success === false ||
        response?.ok === false ||
        !result ||
        result?.success === false ||
        result?.message?.toLowerCase?.().includes("not found")
      ) {
        throw new Error(
          response?.message ||
            result?.message ||
            "Shipment not found. Please check the number."
        );
      }

      setShipment(result);
      setActiveTab("details");
    } catch (err) {
      setShipment(null);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to find this shipment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // NORMALIZE CURRENT SHIPMENT
  // ------------------------------------------------

  const currentShipment = useMemo(
    () => normalizeShipment(shipment),
    [shipment]
  );

  // ------------------------------------------------
  // SHIPMENT INFORMATION
  // ------------------------------------------------

  const currentStatus = getStatus(currentShipment);

  const statusClass = getStatusClass(currentStatus);

  const progressIndex = getProgressIndex(currentStatus);

  const history = getHistory(currentShipment);

  const supportingDocuments =
    getSupportingDocuments(currentShipment);

  const trackingNumber = getValue(
    currentShipment?.trackingNumber,
    currentShipment?.trackingNo,
    currentShipment?.waybillNumber
  );

  const documentTrackingNumber =
    currentShipment?.trackingNumber ||
    currentShipment?.trackingNo ||
    currentShipment?.waybillNumber ||
    "";

  const awdNumber = getValue(
    currentShipment?.awdNumber,
    currentShipment?.AWDNumber,
    currentShipment?.awbNumber
  );

  const sender = currentShipment?.sender || {};

  const receiver = currentShipment?.receiver || {};

  const packageInfo = currentShipment?.package || {};

  const latestEvent = history[0] || {};

  const lastUpdated = getTimestamp(latestEvent);

  const terminalStatus = [
    "Shipment Cancelled",
    "Delivery Attempted - Customer Unavailable",
    "Vehicle Breakdown",
  ].includes(currentStatus);

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <main className="se-tracking-page">

      {/* ============================================
          HERO SECTION
      ============================================ */}

      <section className="se-tracking-hero">
        <div className="se-tracking-hero-pattern" />

        <div className="se-tracking-container se-tracking-hero-content">

          <div className="se-tracking-eyebrow">
            <span className="se-tracking-eyebrow-dot" />
            SPEED EXPRESS · LIVE TRACKING
          </div>

          <h1>
            Your shipment.
            <br />
            <span>Every step, tracked.</span>
          </h1>

          <p className="se-tracking-hero-description">
            Track your parcel in real time and stay informed
            from booking to final delivery.
          </p>

          {/* SEARCH FORM */}

          <form
            className="se-tracking-search"
            onSubmit={searchShipment}
          >
            <span
              className="se-tracking-search-icon"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </span>

            <input
              type="text"
              value={searchNumber}
              onChange={(event) =>
                setSearchNumber(event.target.value)
              }
              placeholder="Enter tracking number or AWD number"
              aria-label="Tracking number or AWD number"
              autoComplete="off"
            />

            {searchNumber && (
              <button
                type="button"
                className="se-tracking-clear"
                onClick={() => {
                  setSearchNumber("");
                  setError("");
                }}
                aria-label="Clear tracking number"
              >
                ×
              </button>
            )}

            <button
              type="submit"
              className="se-tracking-search-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="se-tracking-spinner" />
                  Searching
                </>
              ) : (
                <>
                  Track Shipment
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          <div className="se-tracking-search-note">
            <span aria-hidden="true">🔒</span>
            Enter the tracking number provided when your shipment
            was booked.
          </div>
        </div>
      </section>

      {/* ============================================
          TRACKING RESULTS
      ============================================ */}

      <section className="se-tracking-container se-tracking-results">

        {/* ERROR MESSAGE */}

        {error && (
          <div className="se-tracking-alert" role="alert">
            <span className="se-tracking-alert-icon">!</span>

            <div>
              <strong>
                We couldn't find your shipment
              </strong>

              <p>{error}</p>
            </div>

            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {/* EMPTY STATE */}

        {!currentShipment && !loading && !error && (
          <div className="se-tracking-empty">

            <div className="se-tracking-empty-icon">
              <svg
                viewBox="0 0 64 64"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="10"
                  y="17"
                  width="44"
                  height="34"
                  rx="6"
                />

                <path d="M22 17v-4a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v4" />

                <path d="M10 29h44M25 40h14" />
              </svg>
            </div>

            <h2>Let's find your shipment</h2>

            <p>
              Enter your tracking or AWD number above to see the
              latest shipment status, delivery progress and scan
              history.
            </p>

            <div className="se-tracking-empty-steps">

              <div>
                <span>01</span>
                <strong>Enter number</strong>
                <small>Use your shipment ID</small>
              </div>

              <div>
                <span>02</span>
                <strong>View progress</strong>
                <small>Check the latest status</small>
              </div>

              <div>
                <span>03</span>
                <strong>Stay informed</strong>
                <small>Review scan history</small>
              </div>

            </div>
          </div>
        )}

        {/* SHIPMENT FOUND */}

        {currentShipment && (
          <div className="se-tracking-result-content">

            {/* RESULT HEADING */}

            <div className="se-tracking-result-heading">
              <div>
                <div className="se-tracking-section-kicker">
                  SHIPMENT OVERVIEW
                </div>

                <h2>Tracking results</h2>
              </div>

              <div className="se-tracking-live-label">
                <span />
                Shipment information
              </div>
            </div>

            {/* ======================================
                STATUS CARD
            ====================================== */}

            <article className="se-tracking-status-card">

              <div className="se-tracking-status-card-top">

                <div className="se-tracking-package-icon">
                  <svg
                    viewBox="0 0 32 32"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="m16 3 12 6.5v13L16 29 4 22.5v-13L16 3Z" />

                    <path d="m4.5 9.5 11.5 6 11.5-6M16 16v12M10 6.5l12 6" />
                  </svg>
                </div>

                <div className="se-tracking-number-block">
                  <span>TRACKING NUMBER</span>

                  <strong>{trackingNumber}</strong>

                  <small>
                    AWD Number: <b>{awdNumber}</b>
                  </small>
                </div>

                <span
                  className={`se-tracking-status-badge ${statusClass}`}
                >
                  <span />
                  {currentStatus}
                </span>
              </div>

              <div className="se-tracking-status-divider" />

              <div className="se-tracking-status-message">

                <div
                  className={`se-tracking-status-check ${statusClass}`}
                >
                  {currentStatus === "Delivered Successfully"
                    ? "✓"
                    : "↗"}
                </div>

                <div>
                  <strong>
                    {STATUS_DESCRIPTIONS[currentStatus] ||
                      "Your shipment status has been updated."}
                  </strong>

                  <p>
                    Current location:{" "}
                    <b>
                      {getValue(
                        currentShipment?.currentLocation,
                        latestEvent?.location
                      )}
                    </b>
                  </p>
                </div>

                <div className="se-tracking-updated">
                  <span>LAST SCAN</span>
                  <strong>{formatDate(lastUpdated)}</strong>
                  <small>{formatTime(lastUpdated)}</small>
                </div>

              </div>
            </article>

            {/* ======================================
                DELIVERY PROGRESS
            ====================================== */}

            {!terminalStatus && (
              <section className="se-tracking-progress-card">

                <div className="se-tracking-card-heading">
                  <div>
                    <span className="se-tracking-section-kicker">
                      DELIVERY JOURNEY
                    </span>

                    <h3>Shipment progress</h3>
                  </div>

                  <span className="se-tracking-progress-caption">
                    {currentStatus === "Delivered Successfully"
                      ? "Delivery complete"
                      : `Step ${Math.max(progressIndex + 1, 1)} of 5`}
                  </span>
                </div>

                <div className="se-tracking-progress-track">

                  {STEPS.map((step, index) => {
                    const complete = index < progressIndex;

                    const active = index === progressIndex;

                    return (
                      <React.Fragment key={step}>

                        <div
                          className={`se-tracking-progress-step ${
                            complete ? "complete" : ""
                          } ${active ? "active" : ""}`}
                        >
                          <div className="se-tracking-progress-marker">
                            {complete ? "✓" : index + 1}
                          </div>

                          <span>{step}</span>
                        </div>

                        {index < STEPS.length - 1 && (
                          <div
                            className={`se-tracking-progress-line ${
                              index < progressIndex ? "complete" : ""
                            }`}
                          />
                        )}

                      </React.Fragment>
                    );
                  })}

                </div>
              </section>
            )}

            {/* ======================================
                DETAILS AND HISTORY TABS
            ====================================== */}

            <section className="se-tracking-information-card">

              <div className="se-tracking-tabs" role="tablist">

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "details"}
                  className={
                    activeTab === "details" ? "active" : ""
                  }
                  onClick={() => setActiveTab("details")}
                >
                  <span>▤</span>
                  Shipment Details
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "history"}
                  className={
                    activeTab === "history" ? "active" : ""
                  }
                  onClick={() => setActiveTab("history")}
                >
                  <span>◷</span>
                  Status &amp; Scan

                  <span className="se-tracking-tab-count">
                    {history.length}
                  </span>
                </button>

              </div>

              {/* ====================================
                  SHIPMENT DETAILS TAB
              ==================================== */}

              {activeTab === "details" ? (

                <div
                  className="se-tracking-details-panel"
                  role="tabpanel"
                >

                  <div className="se-tracking-detail-grid">

                    {/* SENDER */}

                    <div className="se-tracking-detail-section">

                      <div className="se-tracking-detail-heading">

                        <span className="se-tracking-detail-heading-icon sender">
                          ↗
                        </span>

                        <div>
                          <h4>Sender information</h4>
                          <p>Shipment origin</p>
                        </div>

                      </div>

                      <div className="se-tracking-detail-list">

                        <Detail
                          label="Sender name"
                          value={getValue(
                            sender.name,
                            currentShipment?.senderName
                          )}
                        />

                        <Detail
                          label="Phone number"
                          value={getValue(
                            sender.phone,
                            sender.mobile,
                            currentShipment?.senderPhone
                          )}
                        />

                        <Detail
                          label="Address"
                          value={getValue(
                            sender.address,
                            currentShipment?.senderAddress
                          )}
                        />

                      </div>
                    </div>

                    {/* RECEIVER */}

                    <div className="se-tracking-detail-section">

                      <div className="se-tracking-detail-heading">

                        <span className="se-tracking-detail-heading-icon receiver">
                          ↙
                        </span>

                        <div>
                          <h4>Receiver information</h4>
                          <p>Shipment destination</p>
                        </div>

                      </div>

                      <div className="se-tracking-detail-list">

                        <Detail
                          label="Receiver name"
                          value={getValue(
                            receiver.name,
                            currentShipment?.receiverName
                          )}
                        />

                        <Detail
                          label="Phone number"
                          value={getValue(
                            receiver.phone,
                            receiver.mobile,
                            currentShipment?.receiverPhone
                          )}
                        />

                        <Detail
                          label="Address"
                          value={getValue(
                            receiver.address,
                            currentShipment?.receiverAddress
                          )}
                        />

                      </div>
                    </div>

                  </div>

                  {/* PACKAGE INFORMATION */}

                  <div className="se-tracking-package-details">

                    <div className="se-tracking-package-details-title">
                      <span>▣</span>
                      <h4>Package information</h4>
                    </div>

                    <div className="se-tracking-package-grid">

                      <Detail
                        label="Package type"
                        value={getValue(
                          packageInfo.type,
                          packageInfo.packageType,
                          currentShipment?.packageType
                        )}
                      />

                      <Detail
                        label="Weight"
                        value={
                          currentShipment?.weight != null
                            ? `${currentShipment.weight} KG`
                            : "—"
                        }
                      />

                      <Detail
                        label="Product count"
                        value={getValue(
                          currentShipment?.productCount
                        )}
                      />

                      <Detail
                        label="Invoice number"
                        value={getValue(
                          currentShipment?.invoiceNumber
                        )}
                      />

                      <Detail
                        label="E-way bill"
                        value={getValue(
                          currentShipment?.eWayBillNumber
                        )}
                      />

                      <Detail
                        label="Booking type"
                        value={getValue(
                          currentShipment?.bookingType
                        )}
                      />

                    </div>
                  </div>

                </div>

              ) : (

                /* ==================================
                   STATUS & SCAN HISTORY TAB
                ================================== */

                <div
                  className="se-tracking-history-panel"
                  role="tabpanel"
                >

                  <div className="se-tracking-history-heading">

                    <div>
                      <h3>Shipment scan history</h3>

                      <p>
                        Every recorded update for this shipment,
                        newest first.
                      </p>
                    </div>

                    <span className="se-tracking-history-total">
                      {history.length}{" "}
                      {history.length === 1 ? "record" : "records"}
                    </span>

                  </div>

                  {history.length > 0 ? (

                    <div className="se-tracking-table-wrap">

                      <table className="se-tracking-history-table">

                        <thead>
                          <tr>
                            <th>DATE &amp; TIME</th>
                            <th>LOCATION</th>
                            <th>STATUS &amp; REMARKS</th>
                          </tr>
                        </thead>

                        <tbody>

                          {history.map((event, index) => {
                            const eventStatus = getValue(
                              event.status,
                              event.currentStatus
                            );

                            const eventTime = getTimestamp(event);

                            // Find the document attached to this exact scan.
                            const eventDocument = getEventDocument(
                              event,
                              supportingDocuments
                            );

                            return (
                              <tr
                                key={
                                  event._id ||
                                  `${eventStatus}-${eventTime}-${index}`
                                }
                              >

                                {/* DATE AND TIME */}

                                <td>
                                  <strong>
                                    {formatDate(eventTime)}
                                  </strong>

                                  <span>
                                    {formatTime(eventTime)}
                                  </span>
                                </td>

                                {/* LOCATION */}

                                <td>
                                  <span className="se-tracking-location">
                                    <span />

                                    {getValue(event.location)}
                                  </span>
                                </td>

                                {/* STATUS, REMARKS AND DOCUMENT */}

                                <td>

                                  <span
                                    className={`se-tracking-event-status ${getStatusClass(
                                      eventStatus
                                    )}`}
                                  >
                                    {eventStatus}
                                  </span>

                                  <p className="se-tracking-event-remarks">
                                    {getValue(
                                      event.remarks,
                                      event.description
                                    )}
                                  </p>

                                  {/* ATTACHMENT FOR THIS SCAN */}

                                  {eventDocument && (
                                    <ScanDocument
                                      document={eventDocument}
                                      trackingNumber={
                                        documentTrackingNumber
                                      }
                                    />
                                  )}

                                </td>

                              </tr>
                            );
                          })}

                        </tbody>
                      </table>
                    </div>

                  ) : (

                    <div className="se-tracking-no-history">
                      <span>◷</span>

                      <strong>
                        No scan history available yet
                      </strong>

                      <p>
                        Updates will appear here when the shipment
                        status is recorded.
                      </p>
                    </div>

                  )}

                </div>
              )}

            </section>

            {/* ======================================
                CUSTOMER SUPPORT
            ====================================== */}

            <div className="se-tracking-help">

              <div className="se-tracking-help-icon">
                i
              </div>

              <p>
                <strong>
                  Need help with your shipment?
                </strong>

                <span>
                  Contact Speed Express support and share your
                  tracking number for assistance.
                </span>
              </p>

              <a
                href="/contact"
                className="se-tracking-help-link"
              >
                Contact us <span>→</span>
              </a>

            </div>

          </div>
        )}

      </section>
    </main>
  );
}

// ==================================================
// DOCUMENT VIEW AND DOWNLOAD COMPONENT
// ==================================================

function ScanDocument({ document, trackingNumber }) {
  if (!document || !trackingNumber) {
    return null;
  }

  const documentId = getDocumentId(document);

  if (!documentId) {
    return null;
  }

  const originalName =
    document.originalName ||
    document.filename ||
    "Shipment attachment";

  const viewUrl = getDocumentUrl(
    trackingNumber,
    document,
    "view"
  );

  const downloadUrl = getDocumentUrl(
    trackingNumber,
    document,
    "download"
  );

  const fileSize = formatFileSize(document.size);

  return (
    <div className="se-tracking-event-document">

      <div className="se-tracking-event-document-info">

        <span className="se-tracking-event-document-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />

            <path
              d="M14 3.5v4h4M9 13h6M9 16.5h6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </span>

        <div className="se-tracking-event-document-name">

          <strong title={originalName}>
            {originalName}
          </strong>

          {fileSize && (
            <small>{fileSize}</small>
          )}

        </div>

      </div>

      <div className="se-tracking-event-document-actions">

        {/* VIEW DOCUMENT */}

        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="se-tracking-document-view"
          aria-label={`View ${originalName}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />

            <circle
              cx="12"
              cy="12"
              r="2.8"
              stroke="currentColor"
              strokeWidth="1.7"
            />
          </svg>

          View Document
        </a>

        {/* DOWNLOAD DOCUMENT */}

        <a
          href={downloadUrl}
          className="se-tracking-document-download"
          aria-label={`Download ${originalName}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v3h16v-3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          Download
        </a>

      </div>
    </div>
  );
}

// ==================================================
// DETAIL COMPONENT
// ==================================================

function Detail({ label, value }) {
  return (
    <div className="se-tracking-detail-item">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}
