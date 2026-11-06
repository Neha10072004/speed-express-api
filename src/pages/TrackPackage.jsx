
import { useState } from "react";
import {
  trackShipment,
  viewSupportingDocument,
  downloadSupportingDocument,
} from "../services/api";
import "./TrackPackage.css";

// ==================================================
// SHIPMENT PROGRESS STEPS
// ==================================================

const STATUS_STEPS = [
  "Shipment Booked",
  "In Transit to Next Hub",
  "Delivered Successfully",
];

// ==================================================
// DATE AND TIME - INDIA STANDARD TIME
// ==================================================

function formatDateTime(value) {
  if (!value) {
    return { date: "—", time: "—" };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { date: "—", time: "—" };
  }

  return {
    date: date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }),

    time: date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }),
  };
}

// ==================================================
// FORMAT FILE SIZE
// ==================================================

function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size <= 0) {
    return "Size unavailable";
  }

  if (size < 1024) {
    return `${size} Bytes`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

// ==================================================
// GET DOCUMENT ID
// ==================================================

function getDocumentId(document) {
  return (
    document?._id ||
    document?.documentId ||
    document?.id ||
    ""
  );
}

// ==================================================
// GET SUPPORTING DOCUMENTS
// ==================================================

function getSupportingDocuments(shipment) {
  const documents = Array.isArray(
    shipment?.supportingDocuments
  )
    ? shipment.supportingDocuments
    : [];

  return documents
    .filter(
      (document) =>
        document &&
        document.visibleToCustomer !== false
    )
    .map((document) => ({
      ...document,

      _id: getDocumentId(document),

      originalName:
        document.originalName ||
        document.filename ||
        document.name ||
        "Shipment Document",

      uploadedAt:
        document.uploadedAt ||
        document.createdAt ||
        null,
    }))
    .filter((document) => document._id);
}

// ==================================================
// GET SHIPMENT HISTORY
// ==================================================

function getShipmentHistory(shipment, documents = []) {
  const events = Array.isArray(shipment?.history)
    ? shipment.history
    : Array.isArray(shipment?.statusHistory)
      ? shipment.statusHistory
      : [];

  return events
    .map((event, index) => {
      const documentReference =
        event.supportingDocument ||
        event.document ||
        null;

      const documentId =
        event.supportingDocumentId ||
        event.documentId ||
        documentReference?._id ||
        documentReference?.documentId ||
        documentReference?.id ||
        "";

      const matchedDocument =
        documents.find(
          (document) =>
            String(document._id) === String(documentId)
        ) ||
        (
          documentReference
            ? {
                ...documentReference,
                _id: getDocumentId(documentReference),
              }
            : null
        );

      return {
        ...event,

        status:
          event.status ||
          event.currentStatus ||
          "Status Updated",

        location:
          event.location ||
          event.currentLocation ||
          shipment.currentLocation ||
          "Location unavailable",

        remarks: event.remarks || "",

        timestamp:
          event.timestamp ||
          event.updatedAt ||
          event.createdAt ||
          null,

        supportingDocument:
          matchedDocument?._id
            ? matchedDocument
            : null,

        originalIndex: index,
      };
    })
    .sort((a, b) => {
      const timeA = a.timestamp
        ? new Date(a.timestamp).getTime()
        : 0;

      const timeB = b.timestamp
        ? new Date(b.timestamp).getTime()
        : 0;

      return timeB - timeA;
    });
}

// ==================================================
// GET STATUS PROGRESS STEP
// ==================================================

function getStatusStep(status) {
  const value = String(status || "").toLowerCase();

  if (
    value.includes("delivered successfully") ||
    value === "delivered"
  ) {
    return 2;
  }

  if (
    value.includes("transit") ||
    value.includes("out for delivery") ||
    value.includes("vehicle delayed") ||
    value.includes("vehicle breakdown") ||
    value.includes("delivery attempted")
  ) {
    return 1;
  }

  if (value.includes("cancelled")) {
    return -1;
  }

  return 0;
}

// ==================================================
// GET FIRST AVAILABLE VALUE
// ==================================================

function getValue(...values) {
  const value = values.find(
    (item) =>
      item !== undefined &&
      item !== null &&
      String(item).trim() !== ""
  );

  return value ?? "—";
}

// ==================================================
// SHIPMENT DETAIL ROW
// ==================================================

function DetailRow({ label, value }) {
  return (
    <div className="tracking-detail-row">
      <div className="tracking-detail-label">
        {label}
      </div>

      <div className="tracking-detail-value">
        {value}
      </div>
    </div>
  );
}

// ==================================================
// DOCUMENT ACTIONS
// ==================================================

function DocumentActions({
  document,
  trackingNumber,
}) {
  const documentId = getDocumentId(document);

  if (!documentId) {
    return null;
  }

  const documentName =
    document.originalName ||
    document.filename ||
    "Shipment Document";

  const handleView = async () => {
    try {
      await viewSupportingDocument(
        trackingNumber,
        documentId
      );
    } catch (error) {
      console.error("View document error:", error);

      alert(
        "Unable to open this document. Please try again."
      );
    }
  };

  const handleDownload = async () => {
    try {
      await downloadSupportingDocument(
        trackingNumber,
        documentId,
        documentName
      );
    } catch (error) {
      console.error("Download document error:", error);

      alert(
        "Unable to download this document. Please try again."
      );
    }
  };

  return (
    <div className="tracking-document-actions">
      <button
        type="button"
        className="tracking-document-view-button"
        onClick={handleView}
      >
        <span aria-hidden="true">↗</span>
        View Document
      </button>

      <button
        type="button"
        className="tracking-document-download-button"
        onClick={handleDownload}
      >
        <span aria-hidden="true">↓</span>
        Download
      </button>
    </div>
  );
}

// ==================================================
// DOCUMENT ITEM
// ==================================================

function DocumentItem({
  document,
  trackingNumber,
}) {
  const documentName =
    document.originalName ||
    document.filename ||
    "Shipment Document";

  const uploadedDate = formatDateTime(
    document.uploadedAt
  );

  const isImage =
    document.contentType?.startsWith("image/");

  const isPdf =
    document.contentType === "application/pdf";

  return (
    <div
      className="tracking-document-item"
      key={getDocumentId(document)}
    >
      <div className="tracking-document-icon">
        {isImage ? "🖼️" : isPdf ? "📕" : "📄"}
      </div>

      <div className="tracking-document-info">
        <h3>{documentName}</h3>

        <div className="tracking-document-meta">
          <span>
            Uploaded: {uploadedDate.date}
          </span>

          <span>
            {formatFileSize(document.size)}
          </span>
        </div>
      </div>

      <DocumentActions
        document={document}
        trackingNumber={trackingNumber}
      />
    </div>
  );
}

// ==================================================
// SUPPORTING DOCUMENTS SECTION
// ==================================================

function SupportingDocuments({
  documents,
  trackingNumber,
  showEmptyMessage = false,
  title = "Supporting Documents",
}) {
  if (!documents.length) {
    if (!showEmptyMessage) {
      return null;
    }

    return (
      <section className="tracking-documents-section">
        <div className="tracking-documents-heading">
          <div>
            <span className="tracking-eyebrow">
              SHIPMENT ATTACHMENTS
            </span>

            <h2>{title}</h2>

            <p>
              Documents shared by Speed Express for your
              shipment.
            </p>
          </div>

          <span className="tracking-documents-count">
            0 Documents
          </span>
        </div>

        <div className="tracking-no-documents">
          No customer-visible attachments are available
          for this shipment.
        </div>
      </section>
    );
  }

  return (
    <section className="tracking-documents-section">
      <div className="tracking-documents-heading">
        <div>
          <span className="tracking-eyebrow">
            SHIPMENT ATTACHMENTS
          </span>

          <h2>{title}</h2>

          <p>
            Documents shared by Speed Express for your
            shipment.
          </p>
        </div>

        <span className="tracking-documents-count">
          {documents.length} Document
          {documents.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="tracking-documents-list">
        {documents.map((document) => (
          <DocumentItem
            key={getDocumentId(document)}
            document={document}
            trackingNumber={trackingNumber}
          />
        ))}
      </div>
    </section>
  );
}

// ==================================================
// DOCUMENT UNDER A STATUS SCAN
// ==================================================

function ScanDocument({
  document,
  trackingNumber,
}) {
  if (!document) {
    return null;
  }

  const documentName =
    document.originalName ||
    document.filename ||
    "Shipment Document";

  return (
    <div className="tracking-scan-document">
      <div className="tracking-scan-document-name">
        <span aria-hidden="true">📎</span>

        <span>{documentName}</span>
      </div>

      <DocumentActions
        document={document}
        trackingNumber={trackingNumber}
      />
    </div>
  );
}

// ==================================================
// TRACK PACKAGE COMPONENT
// ==================================================

export default function TrackPackage() {
  const [identifier, setIdentifier] = useState("");
  const [shipment, setShipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  // ==================================================
  // SEARCH SHIPMENT
  // ==================================================

  const handleSearch = async (event) => {
    event.preventDefault();

    const searchValue = identifier.trim();

    if (!searchValue) {
      setError(
        "Please enter a tracking number or AWD number."
      );

      setShipment(null);
      setHistory([]);
      setSearched(false);

      return;
    }

    setLoading(true);
    setError("");
    setShipment(null);
    setHistory([]);
    setSearched(false);

    try {
      const response = await trackShipment(searchValue);

      const data = response?.data || response;

      console.log(
        "FULL TRACKING API RESPONSE:",
        data
      );

      const foundShipment =
        data?.shipment ||
        data?.data?.shipment ||
        data?.data;

      if (
        data?.success === false ||
        !foundShipment ||
        typeof foundShipment !== "object"
      ) {
        throw new Error(
          data?.message || "Shipment not found."
        );
      }

      console.log(
        "SUPPORTING DOCUMENTS FROM BACKEND:",
        foundShipment?.supportingDocuments || []
      );

      const normalizedDocuments =
        getSupportingDocuments(foundShipment);

      const normalizedHistory =
        getShipmentHistory(
          foundShipment,
          normalizedDocuments
        );

      console.log(
        "NORMALIZED SHIPMENT HISTORY:",
        normalizedHistory
      );

      console.log(
        "NORMALIZED SUPPORTING DOCUMENTS:",
        normalizedDocuments
      );

      setShipment({
        ...foundShipment,
        supportingDocuments: normalizedDocuments,
        history: normalizedHistory,
      });

      setHistory(normalizedHistory);
      setActiveTab("details");
      setSearched(true);
    } catch (err) {
      console.error("Track shipment error:", err);

      setError(
        err?.message ||
          "Unable to retrieve shipment details. Please try again."
      );

      setShipment(null);
      setHistory([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // CLEAR SEARCH
  // ==================================================

  const handleClear = () => {
    setIdentifier("");
    setShipment(null);
    setHistory([]);
    setError("");
    setSearched(false);
    setActiveTab("details");
  };

  // ==================================================
  // SHIPMENT INFORMATION
  // ==================================================

  const status = getValue(
    shipment?.currentStatus,
    shipment?.status
  );

  const location = getValue(
    shipment?.currentLocation
  );

  const trackingNumber = getValue(
    shipment?.trackingNumber,
    shipment?.trackingNo
  );

  const awdNumber = getValue(
    shipment?.awdNumber,
    shipment?.awdNo
  );

  const sender =
    shipment?.sender ||
    shipment?.senderDetails ||
    {};

  const receiver =
    shipment?.receiver ||
    shipment?.receiverDetails ||
    {};

  const packageDetails =
    shipment?.package ||
    shipment?.packageDetails ||
    {};

  const currentStep = getStatusStep(status);

  const isCancelled = currentStep === -1;

  const pickupDate = formatDateTime(
    shipment?.bookingDate ||
    shipment?.createdAt ||
    shipment?.pickupDate
  ).date;

  const latestHistory = history[0];

  const latestUpdate = latestHistory
    ? formatDateTime(latestHistory.timestamp)
    : { date: "—", time: "—" };

  const supportingDocuments =
    getSupportingDocuments(shipment);

  // ==================================================
  // FIND DOCUMENTS ALREADY LINKED TO HISTORY
  // ==================================================

  const linkedDocumentIds = new Set(
    history
      .map((event) =>
        getDocumentId(event.supportingDocument)
      )
      .filter(Boolean)
      .map(String)
  );

  // Documents without a matching history link are
  // displayed separately so the customer can still
  // open or download them.

  const unlinkedDocuments = supportingDocuments.filter(
    (document) =>
      !linkedDocumentIds.has(
        String(getDocumentId(document))
      )
  );

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <main className="tracking-page">

      {/* TRACKING HERO */}

      <section className="tracking-hero">
        <div className="tracking-hero-content">

          <span className="tracking-eyebrow">
            SPEED EXPRESS • SHIPMENT SERVICES
          </span>

          <h1>Track Your Shipment</h1>

          <p>
            Follow your shipment from booking to final
            delivery with the latest status updates.
          </p>

          <form
            className="tracking-search-form"
            onSubmit={handleSearch}
          >
            <div className="tracking-input-wrap">
              <span
                className="tracking-search-icon"
                aria-hidden="true"
              >
                ⌕
              </span>

              <input
                type="text"
                value={identifier}
                onChange={(event) =>
                  setIdentifier(event.target.value)
                }
                placeholder="Enter Tracking Number or AWD Number"
                aria-label="Tracking number or AWD number"
              />
            </div>

            <button
              type="submit"
              className="tracking-search-button"
              disabled={loading}
            >
              {loading
                ? "Searching..."
                : "Track Shipment"}
            </button>
          </form>

          <div className="tracking-search-hint">
            <span aria-hidden="true">🔒</span>
            Enter your shipment tracking number to view
            its status.
          </div>
        </div>
      </section>

      {/* TRACKING CONTENT */}

      <section className="tracking-content">

        {/* ERROR */}

        {error && (
          <div className="tracking-alert tracking-alert-error">
            <strong>Unable to track shipment</strong>
            <p>{error}</p>
          </div>
        )}

        {/* EMPTY STATE */}

        {!shipment &&
          !loading &&
          !error &&
          !searched && (
            <div className="tracking-empty-state">
              <div className="tracking-empty-icon">
                📦
              </div>

              <h2>Your shipment journey starts here</h2>

              <p>
                Enter your tracking number or AWD number
                above to view shipment details and status
                scans.
              </p>
            </div>
          )}

        {/* LOADING */}

        {loading && (
          <div className="tracking-loading">
            <span className="tracking-spinner" />

            <p>
              Retrieving your shipment information...
            </p>
          </div>
        )}

        {/* SHIPMENT FOUND */}

        {shipment && (
          <>

            {/* SHIPMENT SUMMARY */}

            <section className="tracking-summary-card">

              <div className="tracking-summary-top">
                <div>
                  <span className="tracking-small-label">
                    WAYBILL / TRACKING NUMBER
                  </span>

                  <h2>{trackingNumber}</h2>

                  <p className="tracking-awd-line">
                    AWD Number: {awdNumber}
                  </p>
                </div>

                <div className="tracking-status-block">
                  <span className="tracking-small-label">
                    CURRENT STATUS
                  </span>

                  <span
                    className={`tracking-status-badge ${
                      isCancelled
                        ? "status-cancelled"
                        : currentStep === 2
                          ? "status-delivered"
                          : currentStep === 1
                            ? "status-transit"
                            : "status-booked"
                    }`}
                  >
                    <span className="tracking-status-dot" />
                    {status}
                  </span>
                </div>
              </div>

              <div className="tracking-summary-bottom">

                <div>
                  <span className="tracking-small-label">
                    CURRENT LOCATION
                  </span>

                  <strong>{location}</strong>
                </div>

                <div>
                  <span className="tracking-small-label">
                    LAST STATUS UPDATE
                  </span>

                  <strong>
                    {latestUpdate.date}
                    {latestUpdate.time !== "—"
                      ? ` • ${latestUpdate.time}`
                      : ""}
                  </strong>
                </div>

                <button
                  type="button"
                  className="tracking-clear-button"
                  onClick={handleClear}
                >
                  Track Another
                </button>
              </div>
            </section>

            {/* SHIPMENT PROGRESS */}

            <section className="tracking-progress-card">

              <div className="tracking-section-heading">
                <div>
                  <span className="tracking-eyebrow">
                    DELIVERY JOURNEY
                  </span>

                  <h2>Shipment Progress</h2>
                </div>

                <span className="tracking-updated-label">
                  {history.length} status update
                  {history.length === 1 ? "" : "s"}
                </span>
              </div>

              <div
                className={`tracking-progress ${
                  isCancelled ? "progress-cancelled" : ""
                }`}
              >
                {STATUS_STEPS.map((step, index) => {
                  const completed =
                    !isCancelled && currentStep >= index;

                  const active =
                    !isCancelled && currentStep === index;

                  return (
                    <div
                      className={`tracking-progress-step ${
                        completed ? "completed" : ""
                      } ${active ? "active" : ""}`}
                      key={step}
                    >
                      <div className="tracking-progress-marker">
                        {completed ? "✓" : index + 1}
                      </div>

                      <div className="tracking-progress-title">
                        {step}
                      </div>

                      {active && (
                        <div className="tracking-progress-caption">
                          Current stage
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {isCancelled && (
                <p className="tracking-cancelled-note">
                  This shipment has been cancelled. Please
                  contact Speed Express for further
                  information.
                </p>
              )}
            </section>

            {/* SHIPMENT INFORMATION TABS */}

            <section className="tracking-information-card">

              <div className="tracking-tabs" role="tablist">

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "details"}
                  className={
                    activeTab === "details"
                      ? "tracking-tab active"
                      : "tracking-tab"
                  }
                  onClick={() => setActiveTab("details")}
                >
                  <span>▤</span>
                  Shipment Details
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "scans"}
                  className={
                    activeTab === "scans"
                      ? "tracking-tab active"
                      : "tracking-tab"
                  }
                  onClick={() => setActiveTab("scans")}
                >
                  <span>◷</span>
                  Status and Scans

                  <span className="tracking-tab-count">
                    {history.length}
                  </span>
                </button>
              </div>

              {/* ======================================
                  DETAILS TAB
              ====================================== */}

              {activeTab === "details" && (
                <div className="tracking-details-panel">

                  <div className="tracking-table-heading">
                    Shipment Information
                  </div>

                  <div className="tracking-details-grid">

                    <DetailRow
                      label="Tracking Number"
                      value={trackingNumber}
                    />

                    <DetailRow
                      label="AWD Number"
                      value={awdNumber}
                    />

                    <DetailRow
                      label="Pickup Date"
                      value={pickupDate}
                    />

                    <DetailRow
                      label="From"
                      value={getValue(
                        shipment?.origin,
                        shipment?.from,
                        shipment?.sender?.city,
                        shipment?.senderDetails?.city
                      )}
                    />

                    <DetailRow
                      label="To"
                      value={getValue(
                        shipment?.destination,
                        shipment?.to,
                        shipment?.receiver?.city,
                        shipment?.receiverDetails?.city
                      )}
                    />

                    <DetailRow
                      label="Current Status"
                      value={status}
                    />

                    <DetailRow
                      label="Current Location"
                      value={location}
                    />

                    <DetailRow
                      label="Package Type"
                      value={getValue(
                        shipment?.packageType,
                        packageDetails?.packageType,
                        packageDetails?.type
                      )}
                    />

                    <DetailRow
                      label="Weight"
                      value={
                        shipment?.weight != null
                          ? `${shipment.weight} KG`
                          : packageDetails?.weight != null
                            ? `${packageDetails.weight} KG`
                            : "—"
                      }
                    />

                    <DetailRow
                      label="Product Count"
                      value={getValue(
                        shipment?.productCount,
                        packageDetails?.productCount
                      )}
                    />

                    <DetailRow
                      label="Sender Name"
                      value={getValue(
                        sender?.name,
                        sender?.fullName,
                        shipment?.senderName
                      )}
                    />

                    <DetailRow
                      label="Sender Phone"
                      value={getValue(
                        sender?.phone,
                        sender?.mobile,
                        sender?.phoneNumber,
                        shipment?.senderPhone
                      )}
                    />

                    <DetailRow
                      label="Sender Address"
                      value={getValue(
                        sender?.address,
                        sender?.fullAddress,
                        shipment?.senderAddress
                      )}
                    />

                    <DetailRow
                      label="Receiver Name"
                      value={getValue(
                        receiver?.name,
                        receiver?.fullName,
                        shipment?.receiverName
                      )}
                    />

                    <DetailRow
                      label="Receiver Phone"
                      value={getValue(
                        receiver?.phone,
                        receiver?.mobile,
                        receiver?.phoneNumber,
                        shipment?.receiverPhone
                      )}
                    />

                    <DetailRow
                      label="Receiver Address"
                      value={getValue(
                        receiver?.address,
                        receiver?.fullAddress,
                        shipment?.receiverAddress
                      )}
                    />

                    <DetailRow
                      label="Invoice Number"
                      value={getValue(
                        shipment?.invoiceNumber
                      )}
                    />

                    <DetailRow
                      label="e-Way Bill Number"
                      value={getValue(
                        shipment?.eWayBillNumber
                      )}
                    />

                    <DetailRow
                      label="Latest Remarks"
                      value={getValue(
                        history[0]?.remarks,
                        shipment?.remarks
                      )}
                    />
                  </div>

                  <SupportingDocuments
                    documents={supportingDocuments}
                    trackingNumber={trackingNumber}
                    title="Supporting Documents"
                    showEmptyMessage={true}
                  />
                </div>
              )}

              {/* ======================================
                  STATUS AND SCANS TAB
              ====================================== */}

              {activeTab === "scans" && (
                <div className="tracking-scans-panel">

                  <div className="tracking-table-heading">
                    Status and Scans
                  </div>

                  {history.length > 0 ? (
                    <div className="tracking-history-table-wrap">

                      <table className="tracking-history-table">

                        <thead>
                          <tr>
                            <th>Location</th>
                            <th>Details</th>
                            <th>Date</th>
                            <th>Time (IST)</th>
                          </tr>
                        </thead>

                        <tbody>
                          {history.map((event, index) => {
                            const dateTime =
                              formatDateTime(event.timestamp);

                            return (
                              <tr
                                key={
                                  event._id ||
                                  `${event.timestamp}-${index}`
                                }
                              >
                                <td>
                                  <span className="tracking-location-cell">
                                    <span className="tracking-scan-dot" />

                                    {event.location}
                                  </span>
                                </td>

                                <td>
                                  <strong>
                                    {event.status}
                                  </strong>

                                  {event.remarks && (
                                    <p className="tracking-scan-remarks">
                                      {event.remarks}
                                    </p>
                                  )}

                                  {/* DOCUMENT LINKED TO THIS SCAN */}

                                  <ScanDocument
                                    document={event.supportingDocument}
                                    trackingNumber={trackingNumber}
                                  />
                                </td>

                                <td>{dateTime.date}</td>

                                <td>{dateTime.time}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      <div className="tracking-table-footer">
                        All displayed times use India
                        Standard Time (IST).
                      </div>
                    </div>
                  ) : (
                    <div className="tracking-no-history">

                      <div className="tracking-empty-icon">
                        ◷
                      </div>

                      <h3>No status scans available</h3>

                      <p>
                        Status updates will appear here when
                        the shipment history is saved in the
                        system.
                      </p>
                    </div>
                  )}

                  {/* ==================================
                      UNLINKED DOCUMENT FALLBACK
                  ================================== */}

                  {unlinkedDocuments.length > 0 && (
                    <SupportingDocuments
                      documents={unlinkedDocuments}
                      trackingNumber={trackingNumber}
                      title="Other Shipment Attachments"
                      showEmptyMessage={false}
                    />
                  )}

                  {supportingDocuments.length === 0 && (
                    <div className="tracking-no-documents">
                      No customer-visible attachments are
                      available for this shipment.
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
