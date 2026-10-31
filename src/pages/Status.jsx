import React, { useRef, useState } from "react";
import { updateShipmentStatus } from "../services/api";
import "./Status.css";


// Get the current date and time in India Standard Time.
const getIndiaDateTimeLocal = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
};

// Format a datetime-local value as a date/time in India.
// datetime-local has no timezone, so we explicitly interpret it as IST.
const formatIndiaDateTime = (value) => {
  if (!value) return null;

  const date = new Date(`${value}:00+05:30`);

  if (Number.isNaN(date.getTime())) return null;

  return {
    date: new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date),
  };
};


const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  "https://api.speedexp.in/api"
).replace(/\/+$/, "");

// datetime-local values are interpreted as India Standard Time (UTC+05:30).
function convertISTInputToISOString(value) {
  if (!value) throw new Error("Please select the shipment event date and time.");

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!match) throw new Error("Invalid event date and time format.");

  const [, y, m, d, hh, mm, ss = "00"] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const hour = Number(hh);
  const minute = Number(mm);
  const second = Number(ss);
  const check = new Date(Date.UTC(year, month - 1, day));

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    throw new Error("Please enter a valid shipment event date and time.");
  }

  const parsed = new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}+05:30`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid shipment event date/time.");
  }
  return parsed.toISOString();
}

function toISTDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value])
  );

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
];

const STATUS_OPTIONS = [
  {
    value: "Shipment Booked",
    description: "Shipment booking has been recorded.",
  },
  {
    value: "Material Received at Origin Office",
    description: "The parcel has arrived at the origin office.",
  },
  {
    value: "In Transit to Next Hub",
    description: "Shipment is moving to the next courier hub.",
  },
  {
    value: "Vehicle Delayed",
    description: "The shipment vehicle has been delayed.",
  },
  {
    value: "Out For Delivery",
    description: "Shipment is with the delivery team.",
  },
  {
    value: "Delivered Successfully",
    description: "The shipment has reached its destination.",
  },
  {
    value: "Shipment Cancelled",
    description: "The shipment has been cancelled.",
  },
  {
    value: "Delivery Attempted - Customer Unavailable",
    description:
      "Delivery was attempted, but the customer was unavailable.",
  },
  {
    value: "Vehicle Breakdown",
    description: "A vehicle breakdown has delayed the shipment.",
  },
];

const INITIAL_FORM = {
  trackingNumber: "",
  status: "Shipment Booked",
  location: "",
  remarks: "",
};

const PROGRESS_STEPS = [
  {
    number: "01",
    title: "Booking & Collection",
    description:
      "Shipment is booked and received at the origin office.",
  },
  {
    number: "02",
    title: "Transit & Hub Movement",
    description:
      "Shipment moves between courier hubs and transport connections.",
  },
  {
    number: "03",
    title: "Out for Delivery",
    description:
      "The local delivery team is handling the shipment.",
  },
  {
    number: "04",
    title: "Delivered Successfully",
    description:
      "The shipment has reached its intended destination.",
  },
];

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to update shipment status. Please try again."
  );
}

function formatStatus(status = "") {
  return status.replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

function getFileExtension(filename = "") {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function getStatusTone(status = "") {
  const value = status.toLowerCase();

  if (
    value.includes("delivered successfully") ||
    value === "delivered"
  ) {
    return "success";
  }

  if (
    value.includes("cancelled") ||
    value.includes("breakdown") ||
    value.includes("delayed")
  ) {
    return "warning";
  }

  if (
    value.includes("out for delivery") ||
    value.includes("delivery attempted")
  ) {
    return "delivery";
  }

  return "transit";
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m12 3 9 4.5v9L12 21l-9-4.5v-9L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m3.5 7.7 8.5 4.5 8.5-4.5M12 12.2V21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12 4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M16 3v4M8 3v4M3 10h18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Status() {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [proofFile, setProofFile] = useState(null);
  const [eventDateTime, setEventDateTime] = useState(
    getIndiaDateTimeLocal
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [updatedShipment, setUpdatedShipment] = useState(null);

  const [historySearch, setHistorySearch] = useState("");
  const [historyShipment, setHistoryShipment] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySaving, setHistorySaving] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historySuccess, setHistorySuccess] = useState("");
  const [selectedHistoryId, setSelectedHistoryId] = useState("");
  const [editHistoryForm, setEditHistoryForm] = useState({
    status: "",
    location: "",
    remarks: "",
    eventDateTime: "",
  });


  const selectedStatus = STATUS_OPTIONS.find(
    (item) => item.value === form.status
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  };

  const handleDateTimeChange = (event) => {
    setEventDateTime(event.target.value);
    setSuccess("");
    setError("");
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;

    setSuccess("");
    setError("");

    if (!file) {
      setProofFile(null);
      return;
    }

    const extension = `.${getFileExtension(file.name)}`;

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError(
        "Unsupported file type. Upload JPG, JPEG, PNG, WEBP, PDF, DOC or DOCX."
      );

      event.target.value = "";
      setProofFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The attachment must not exceed 10 MB.");

      event.target.value = "";
      setProofFile(null);
      return;
    }

    setProofFile(file);
  };

  const removeProofFile = () => {
    setProofFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setSuccess("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    const trackingNumber = form.trackingNumber.trim();
    const location = form.location.trim();

    if (!trackingNumber) {
      setError("Please enter a Tracking Number or AWD Number.");
      return;
    }

    if (!location) {
      setError("Please enter the current shipment location.");
      return;
    }

    if (!form.status) {
      setError("Please select a shipment status.");
      return;
    }

    if (!eventDateTime) {
      setError("Please select the shipment event date and time.");
      return;
    }

    let eventDateTimeISO;
    try {
      eventDateTimeISO = convertISTInputToISOString(eventDateTime);
    } catch (dateError) {
      setError(dateError.message);
      return;
    }

    try {
      setLoading(true);

      // The API service must append eventDateTime to FormData.
      // The backend must save this timestamp in shipment history.
      const response = await updateShipmentStatus(trackingNumber, {
        status: form.status,
        location,
        remarks: form.remarks.trim(),
        eventDateTime: eventDateTimeISO,
        ...(proofFile ? { proofFile } : {}),
      });

      const shipment = response?.shipment || null;
      const formattedDateTime = formatIndiaDateTime(eventDateTime);

      setUpdatedShipment({
        ...(shipment || {}),
        trackingNumber:
          shipment?.trackingNumber || trackingNumber,
        awdNumber: shipment?.awdNumber || "",
        currentStatus:
          shipment?.currentStatus || form.status,
        currentLocation:
          shipment?.currentLocation || location,
        currentDate:
          formattedDateTime?.date || "",
        currentTime:
          formattedDateTime?.time || "",
        eventDateTime,
      });

      setSuccess(
        response?.message ||
          "Shipment status updated successfully."
      );

      // Preserve the tracking number for the next update.
      setForm((previous) => ({
        ...previous,
        trackingNumber,
        status: shipment?.currentStatus || previous.status,
        location: shipment?.currentLocation || location,
        remarks: "",
      }));

      setProofFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (loading) return;

    setForm({ ...INITIAL_FORM });
    setEventDateTime(getIndiaDateTimeLocal());
    setProofFile(null);
    setSuccess("");
    setError("");
    setUpdatedShipment(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  const loadHistoryShipment = async (event) => {
    event.preventDefault();
    const identifier = historySearch.trim();

    setHistoryError("");
    setHistorySuccess("");
    setHistoryShipment(null);
    setSelectedHistoryId("");

    if (!identifier) {
      setHistoryError("Enter a tracking number or AWD number.");
      return;
    }

    try {
      setHistoryLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/shipments/${encodeURIComponent(identifier)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Shipment not found. Please check the number."
        );
      }

      const found = data.shipment || data.data || data;
      if (!found || !Array.isArray(found.history)) {
        throw new Error("Shipment history was not returned by the server.");
      }
      setHistoryShipment(found);
    } catch (loadError) {
      setHistoryError(loadError.message || "Unable to load shipment history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const chooseHistoryEntry = (entry) => {
    if (!entry?._id) {
      setHistoryError(
        "This history entry has no MongoDB ID and cannot be edited."
      );
      return;
    }

    setHistoryError("");
    setHistorySuccess("");
    setSelectedHistoryId(entry._id);
    setEditHistoryForm({
      status: entry.status || "",
      location: entry.location || "",
      remarks: entry.remarks || "",
      eventDateTime: toISTDateTimeLocal(entry.timestamp),
    });
  };

  const handleHistoryEditChange = (event) => {
    const { name, value } = event.target;
    setEditHistoryForm((previous) => ({ ...previous, [name]: value }));
    setHistoryError("");
    setHistorySuccess("");
  };

  const saveHistoryEntry = async (event) => {
    event.preventDefault();
    setHistoryError("");
    setHistorySuccess("");

    if (!historyShipment?.trackingNumber || !selectedHistoryId) {
      setHistoryError("Load a shipment and select a history entry first.");
      return;
    }
    if (!editHistoryForm.status || !editHistoryForm.location.trim()) {
      setHistoryError("Status and location are required.");
      return;
    }

    let timestamp;
    try {
      timestamp = convertISTInputToISOString(editHistoryForm.eventDateTime);
    } catch (dateError) {
      setHistoryError(dateError.message);
      return;
    }

    try {
      setHistorySaving(true);
      const response = await fetch(
        `${API_BASE_URL}/shipments/${encodeURIComponent(
          historyShipment.trackingNumber
        )}/history/${encodeURIComponent(selectedHistoryId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: editHistoryForm.status,
            location: editHistoryForm.location.trim(),
            remarks: editHistoryForm.remarks.trim(),
            eventDateTime: timestamp,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Unable to update the selected history entry."
        );
      }

      setHistorySuccess(
        data.message || "Existing shipment history entry updated."
      );

      // Reload from MongoDB so the screen shows persisted values.
      const refreshed = await fetch(
        `${API_BASE_URL}/shipments/${encodeURIComponent(
          historyShipment.trackingNumber
        )}`,
        {
          headers: { Accept: "application/json" },
          credentials: "include",
        }
      );
      const refreshedData = await refreshed.json().catch(() => ({}));
      if (!refreshed.ok || refreshedData.success === false) {
        throw new Error(
          refreshedData.message || "Saved, but unable to refresh shipment history."
        );
      }

      setHistoryShipment(refreshedData.shipment || refreshedData);
      setSelectedHistoryId("");
      setEditHistoryForm({
        status: "",
        location: "",
        remarks: "",
        eventDateTime: "",
      });
    } catch (saveError) {
      setHistoryError(saveError.message || "Unable to save history changes.");
    } finally {
      setHistorySaving(false);
    }
  };

  return (
    <main className="status-page">
      <header className="status-page-header">
        <div className="status-page-heading">
          <div className="status-eyebrow">
            <span className="status-eyebrow-line" />
            SPEED EXPRESS / OPERATIONS
          </div>

          <h1>Update Shipment Status</h1>

          <p>
            Manage shipment movement, update delivery progress,
            and attach supporting documents.
          </p>
        </div>

        <div className="status-header-indicator">
          <span className="status-live-dot" />
          <span>Shipment Management</span>
        </div>
      </header>

      <div className="status-layout">
        {/* LEFT: UPDATE FORM */}
        <section className="status-form-card">
          <div className="status-form-heading">
            <div className="status-heading-icon">
              <PackageIcon />
            </div>

            <div>
              <h2>Shipment Information</h2>
              <p>
                Enter the shipment details and save the latest update.
              </p>
            </div>
          </div>

          {error && (
            <div
              className="status-message status-message-error"
              role="alert"
            >
              <span className="status-message-symbol">!</span>
              <div>
                <strong>Update unsuccessful</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div
              className="status-message status-message-success"
              role="status"
              aria-live="polite"
            >
              <span className="status-message-symbol">
                <CheckIcon />
              </span>
              <div>
                <strong>Shipment updated successfully</strong>
                <p>{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* TRACKING NUMBER */}
            <div className="status-field">
              <label htmlFor="statusTrackingNumber">
                Tracking / AWD Number
                <span className="status-required">*</span>
              </label>

              <div className="status-input-shell">
                <span className="status-input-icon">
                  <PackageIcon />
                </span>

                <input
                  id="statusTrackingNumber"
                  type="text"
                  name="trackingNumber"
                  value={form.trackingNumber}
                  onChange={handleChange}
                  placeholder="Enter tracking or AWD number"
                  autoComplete="off"
                  required
                  disabled={loading}
                />
              </div>

              <small>
                Use the tracking number or AWD number assigned to
                the shipment.
              </small>
            </div>

            {/* SHIPMENT STATUS */}
            <div className="status-field">
              <label htmlFor="statusSelect">
                Shipment Status
                <span className="status-required">*</span>
              </label>

              <select
                id="statusSelect"
                name="status"
                value={form.status}
                onChange={handleChange}
                required
                disabled={loading}
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.value}
                  </option>
                ))}
              </select>

              {selectedStatus && (
                <div className="status-selection-hint">
                  <span
                    className={`status-indicator status-indicator-${getStatusTone(
                      form.status
                    )}`}
                  />
                  <span>{selectedStatus.description}</span>
                </div>
              )}
            </div>

            {/* LOCATION */}
            <div className="status-field">
              <label htmlFor="statusLocation">
                Current Shipment Location
                <span className="status-required">*</span>
              </label>

              <input
                id="statusLocation"
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Pune Hub, Mumbai Office"
                required
                disabled={loading}
              />
            </div>

            {/* EDITABLE DATE AND TIME */}
            <div className="status-field">
              <label htmlFor="eventDateTime">
                Shipment Event Date &amp; Time
                <span className="status-required">*</span>
              </label>

              <div className="status-input-shell status-datetime-shell">
                <span className="status-input-icon">
                  <CalendarIcon />
                </span>

                <input
                  id="eventDateTime"
                  type="datetime-local"
                  name="eventDateTime"
                  value={eventDateTime}
                  onChange={handleDateTimeChange}
                  required
                  disabled={loading}
                />
              </div>

              <small>
                Defaults to the current India time. You can change
                both the date and time to match the actual shipment event.
              </small>
            </div>

            {/* REMARKS */}
            <div className="status-field">
              <label htmlFor="statusRemarks">
                Remarks
                <span className="status-optional">OPTIONAL</span>
              </label>

              <textarea
                id="statusRemarks"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Add additional shipment information..."
                rows={3}
                disabled={loading}
              />

              <small>
                Include useful details about shipment movement or
                delivery attempts.
              </small>
            </div>

            {/* OPTIONAL PROOF ATTACHMENT */}
            <div className="status-field">
              <label htmlFor="statusProofFile">
                Supporting Documents
                <span className="status-optional">OPTIONAL</span>
              </label>

              <div
                className={`status-upload-area ${
                  proofFile ? "has-file" : ""
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="statusProofFile"
                  className="status-native-file-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  disabled={loading}
                />

                <label
                  className="status-upload-label"
                  htmlFor="statusProofFile"
                >
                  <span className="status-upload-icon">
                    <UploadIcon />
                  </span>

                  <span className="status-upload-copy">
                    <strong>
                      {proofFile
                        ? "Replace selected attachment"
                        : "Choose a file to attach"}
                    </strong>
                    <span>
                      or click to browse from your device
                    </span>
                  </span>

                  <span className="status-browse-button">
                    Browse
                  </span>
                </label>

                <div className="status-upload-meta">
                  <span>JPG, PNG, WEBP, PDF, DOC, DOCX</span>
                  <span>Maximum 10 MB</span>
                </div>
              </div>

              {proofFile && (
                <div className="status-selected-file">
                  <span className="status-file-type">
                    {getFileExtension(proofFile.name).toUpperCase()}
                  </span>

                  <div className="status-file-information">
                    <strong title={proofFile.name}>
                      {proofFile.name}
                    </strong>
                    <span>
                      {(proofFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>

                  <button
                    type="button"
                    className="status-remove-file"
                    onClick={removeProofFile}
                    disabled={loading}
                    aria-label="Remove selected attachment"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* FORM ACTIONS */}
            <div className="status-form-footer">
              <p>
                <span className="status-required">*</span>
                Required fields
              </p>

              <div className="status-form-actions">
                <button
                  type="button"
                  className="status-reset-button"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>

                <button
                  type="submit"
                  className="status-submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="status-spinner" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckIcon />
                      Update Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* RIGHT: SHIPMENT PROGRESS */}
        <aside className="status-sidebar">
          <section className="status-progress-card">
            <div className="status-sidebar-heading">
              <div>
                <span className="status-sidebar-eyebrow">
                  TRACKING OVERVIEW
                </span>
                <h2>Shipment Progress</h2>
              </div>

              <span className="status-sidebar-package-icon">
                <PackageIcon />
              </span>
            </div>

            <p className="status-sidebar-description">
              Use these stages as a guide when selecting the
              appropriate shipment status.
            </p>

            <div className="status-progress-list">
              {PROGRESS_STEPS.map((step, index) => (
                <div
                  className="status-progress-item"
                  key={step.number}
                >
                  <div className="status-progress-rail">
                    <span className="status-progress-number">
                      {step.number}
                    </span>

                    {index < PROGRESS_STEPS.length - 1 && (
                      <span className="status-progress-connector" />
                    )}
                  </div>

                  <div className="status-progress-copy">
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="status-sidebar-note">
              <span className="status-note-icon">i</span>
              <p>
                Record the actual shipment event date and time.
                Delays, cancellations, and unsuccessful delivery
                attempts should reflect the actual shipment condition.
              </p>
            </div>
          </section>

          {/* LAST SUCCESSFUL UPDATE */}
          {updatedShipment && (
            <section className="status-latest-card">
              <div className="status-latest-heading">
                <span className="status-latest-check">
                  <CheckIcon />
                </span>

                <div>
                  <span className="status-sidebar-eyebrow">
                    LAST SUBMITTED EVENT
                  </span>
                  <h2>Update Saved</h2>
                </div>
              </div>

              <div className="status-latest-number">
                <span>TRACKING NUMBER</span>
                <strong>{updatedShipment.trackingNumber}</strong>
              </div>

              {updatedShipment.awdNumber && (
                <div className="status-latest-row">
                  <span>AWD Number</span>
                  <strong>{updatedShipment.awdNumber}</strong>
                </div>
              )}

              <div className="status-latest-row">
                <span>Current Status</span>
                <strong
                  className={`status-latest-badge status-tone-${getStatusTone(
                    updatedShipment.currentStatus
                  )}`}
                >
                  {formatStatus(updatedShipment.currentStatus)}
                </strong>
              </div>

              <div className="status-latest-row">
                <span>Location</span>
                <strong>
                  {updatedShipment.currentLocation || "—"}
                </strong>
              </div>

              <div className="status-latest-row">
                <span>Event Date</span>
                <strong>{updatedShipment.currentDate || "—"}</strong>
              </div>

              <div className="status-latest-row">
                <span>Event Time (IST)</span>
                <strong>{updatedShipment.currentTime || "—"}</strong>
              </div>
            </section>
          )}

          <div className="status-security-note">
            <span className="status-security-icon">✓</span>
            <p>
              <strong>Operational accuracy matters.</strong>{" "}
              Verify the tracking number, actual location, status,
              and event date/time before saving.
            </p>
          </div>
        </aside>
      </div>

      {/* EDIT AN EXISTING HISTORY ENTRY — does not create a new event */}
      <section className="status-history-panel">
        <div className="status-form-heading">
          <div className="status-heading-icon">
            <PackageIcon />
          </div>
          <div>
            <h2>Edit Already Updated Status</h2>
            <p>
              Find a shipment, select one saved history entry, and edit it
              without adding a duplicate event.
            </p>
          </div>
        </div>

        {historyError && (
          <div className="status-message status-message-error" role="alert">
            <span className="status-message-symbol">!</span>
            <div>
              <strong>Unable to edit history</strong>
              <p>{historyError}</p>
            </div>
          </div>
        )}

        {historySuccess && (
          <div className="status-message status-message-success" role="status">
            <span className="status-message-symbol"><CheckIcon /></span>
            <div>
              <strong>History entry updated</strong>
              <p>{historySuccess}</p>
            </div>
          </div>
        )}

        <form className="status-history-search" onSubmit={loadHistoryShipment}>
          <input
            type="text"
            value={historySearch}
            onChange={(event) => setHistorySearch(event.target.value)}
            placeholder="Enter tracking number or AWD number"
            aria-label="Search shipment for history editing"
          />
          <button type="submit" disabled={historyLoading}>
            {historyLoading ? "Searching..." : "Find Shipment"}
          </button>
        </form>

        {historyShipment && (
          <>
            <div className="status-history-shipment">
              <div>
                <span>TRACKING NUMBER</span>
                <strong>{historyShipment.trackingNumber}</strong>
              </div>
              <div>
                <span>AWD NUMBER</span>
                <strong>{historyShipment.awdNumber || "—"}</strong>
              </div>
              <div>
                <span>CURRENT STATUS</span>
                <strong>
                  {historyShipment.currentStatus || historyShipment.status || "—"}
                </strong>
              </div>
            </div>

            <div className="status-history-table-wrap">
              <table className="status-history-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Event Date &amp; Time (IST)</th>
                    <th>Remarks</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(historyShipment.history || [])]
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp || 0).getTime() -
                        new Date(a.timestamp || 0).getTime()
                    )
                    .map((entry, index) => (
                      <tr
                        key={entry._id || `${entry.timestamp}-${index}`}
                        className={
                          selectedHistoryId === entry._id ? "is-selected" : ""
                        }
                      >
                        <td>{entry.status || "—"}</td>
                        <td>{entry.location || "—"}</td>
                        <td>
                          {entry.timestamp
                            ? new Intl.DateTimeFormat("en-IN", {
                                timeZone: "Asia/Kolkata",
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              }).format(new Date(entry.timestamp))
                            : "—"}
                        </td>
                        <td>{entry.remarks || "—"}</td>
                        <td>
                          <button
                            type="button"
                            className="status-history-edit-button"
                            onClick={() => chooseHistoryEntry(entry)}
                            disabled={!entry._id || historySaving}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {historyShipment.history?.length === 0 && (
              <p className="status-history-empty">
                No saved status-history entries were found.
              </p>
            )}
          </>
        )}

        {selectedHistoryId && (
          <form className="status-history-edit-form" onSubmit={saveHistoryEntry}>
            <h3>Edit Selected History Entry</h3>
            <div className="status-history-edit-grid">
              <div className="status-field">
                <label htmlFor="editHistoryStatus">Shipment Status *</label>
                <select
                  id="editHistoryStatus"
                  name="status"
                  value={editHistoryForm.status}
                  onChange={handleHistoryEditChange}
                  required
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="status-field">
                <label htmlFor="editHistoryLocation">Location *</label>
                <input
                  id="editHistoryLocation"
                  name="location"
                  value={editHistoryForm.location}
                  onChange={handleHistoryEditChange}
                  required
                />
              </div>

              <div className="status-field">
                <label htmlFor="editHistoryDateTime">Event Date &amp; Time (IST) *</label>
                <input
                  id="editHistoryDateTime"
                  type="datetime-local"
                  name="eventDateTime"
                  value={editHistoryForm.eventDateTime}
                  onChange={handleHistoryEditChange}
                  required
                />
              </div>

              <div className="status-field">
                <label htmlFor="editHistoryRemarks">Remarks</label>
                <textarea
                  id="editHistoryRemarks"
                  name="remarks"
                  value={editHistoryForm.remarks}
                  onChange={handleHistoryEditChange}
                  rows={3}
                />
              </div>
            </div>

            <div className="status-history-edit-actions">
              <button
                type="button"
                className="status-reset-button"
                onClick={() => setSelectedHistoryId("")}
                disabled={historySaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="status-submit-button"
                disabled={historySaving}
              >
                {historySaving ? "Saving..." : "Save Edited Entry"}
              </button>
            </div>
          </form>
        )}
      </section>

    </main>
  );
}

export default Status;
