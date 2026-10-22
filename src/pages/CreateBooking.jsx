
import React, { useState } from "react";
import "./AdminPages.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const STATUS_OPTIONS = [
  "Shipment Booked",
  "Material Received at Origin Office",
  "In Transit to Next Hub",
  "Vehicle Delayed",
  "Out For Delivery",
  "Delivered Successfully",
  "Shipment Cancelled",
  "Delivery Attempted - Customer Unavailable",
  "Vehicle Breakdown",
];

const PACKAGE_TYPES = [
  "Parcel",
  "Document",
  "Box",
  "Corporate Gift",
  "Other",
];

const EMPTY_FORM = {
  bookingType: "Offline",
  trackingNumber: "",
  senderName: "",
  senderPhone: "",
  senderAddress: "",
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  status: "Shipment Booked",
  currentLocation: "",
  remarks: "",
  packageType: "Parcel",
  weight: "",
  productCount: "1",
  invoiceNumber: "",
  eWayBillNumber: "",
};

const getShipmentFromResponse = (result) =>
  result?.shipment || result?.data?.shipment || result?.data || result;

const toFormValues = (shipment) => ({
  bookingType: shipment.bookingType || "Offline",
  trackingNumber: shipment.trackingNumber || "",
  senderName: shipment.senderName || "",
  senderPhone: shipment.senderPhone || "",
  senderAddress: shipment.senderAddress || "",
  receiverName: shipment.receiverName || "",
  receiverPhone: shipment.receiverPhone || "",
  receiverAddress: shipment.receiverAddress || "",
  status:
    shipment.currentStatus ||
    shipment.status ||
    "Shipment Booked",
  currentLocation: shipment.currentLocation || "",
  remarks:
    shipment.currentRemarks ??
    shipment.remarks ??
    "",
  packageType: shipment.packageType || "Parcel",
  weight:
    shipment.weight === undefined || shipment.weight === null
      ? ""
      : String(shipment.weight),
  productCount:
    shipment.productCount === undefined ||
    shipment.productCount === null
      ? "1"
      : String(shipment.productCount),
  invoiceNumber: shipment.invoiceNumber || "",
  eWayBillNumber: shipment.eWayBillNumber || "",
});

function SectionHeader({ number, title, description }) {
  return (
    <div className="booking-section-header">
      <div className="booking-section-number">{number}</div>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  optional = false,
  min,
  step,
  help,
  disabled = false,
}) {
  return (
    <div className="booking-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="booking-required-mark"> *</span>}
        {optional && <span className="field-optional"> (Optional)</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        disabled={disabled}
      />

      {help && <small>{help}</small>}
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}) {
  return (
    <div className="booking-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="booking-required-mark"> *</span>}
      </label>

      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
      >
        {options.map((option) => {
          const item =
            typeof option === "string"
              ? { value: option, label: option }
              : option;

          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  optional = false,
}) {
  return (
    <div className="booking-field booking-field-full">
      <label htmlFor={name}>
        {label}
        {required && <span className="booking-required-mark"> *</span>}
        {optional && <span className="field-optional"> (Optional)</span>}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={3}
      />
    </div>
  );
}

export default function CreateBooking() {
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchNumber, setSearchNumber] = useState("");
  const [editingTrackingNumber, setEditingTrackingNumber] = useState("");
  const [editingAwdNumber, setEditingAwdNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });
  const [savedShipment, setSavedShipment] = useState(null);

  const setNotice = (type, text) => {
    setMessage({ type, text });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setSearchNumber("");
    setEditingTrackingNumber("");
    setEditingAwdNumber("");
    setSavedShipment(null);
    setMessage({ type: "", text: "" });
  };

  const switchMode = (nextMode) => {
    if (loading || searching) return;

    setMode(nextMode);
    resetForm();
  };

  // Find an existing shipment by tracking number or AWD number.
  const handleFindShipment = async (event) => {
    event.preventDefault();

    const identifier = searchNumber.trim();

    if (!identifier) {
      setNotice("error", "Enter a tracking number or AWD number.");
      return;
    }

    setSearching(true);
    setSavedShipment(null);
    setEditingTrackingNumber("");
    setEditingAwdNumber("");
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch(
        `${API_BASE_URL}/shipments/${encodeURIComponent(identifier)}`
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "Shipment not found. Check the number and try again."
        );
      }

      const shipment = getShipmentFromResponse(result);

      if (!shipment || !shipment.trackingNumber) {
        throw new Error(
          "The API response did not include shipment details or a tracking number."
        );
      }

      setForm(toFormValues(shipment));
      setEditingTrackingNumber(shipment.trackingNumber);
      setEditingAwdNumber(shipment.awdNumber || "");
      setSavedShipment(shipment);

      setNotice(
        "success",
        `Shipment ${shipment.trackingNumber} loaded. You can now edit the details.`
      );
    } catch (error) {
      console.error("Find shipment error:", error);
      setNotice("error", error.message || "Unable to load this shipment.");
    } finally {
      setSearching(false);
    }
  };

  const validateForm = () => {
    if (mode === "create" && form.bookingType === "Offline") {
      if (!form.trackingNumber.trim()) {
        return "Enter the manual tracking number for the offline booking.";
      }
    }

    const requiredFields = [
      ["senderName", "Enter the sender name."],
      ["senderPhone", "Enter the sender phone number."],
      ["senderAddress", "Enter the sender address."],
      ["receiverName", "Enter the receiver name."],
      ["receiverPhone", "Enter the receiver phone number."],
      ["receiverAddress", "Enter the receiver address."],
      ["currentLocation", "Enter the current shipment location."],
    ];

    for (const [key, error] of requiredFields) {
      if (!String(form[key] || "").trim()) return error;
    }

    const phonePattern = /^[+]?[\d\s()-]{7,20}$/;

    if (!phonePattern.test(form.senderPhone.trim())) {
      return "Enter a valid sender phone number.";
    }

    if (!phonePattern.test(form.receiverPhone.trim())) {
      return "Enter a valid receiver phone number.";
    }

    if (
      form.weight.trim() !== "" &&
      (!Number.isFinite(Number(form.weight)) ||
        Number(form.weight) <= 0)
    ) {
      return "Weight must be greater than zero, or leave it blank.";
    }

    if (
      form.productCount.trim() !== "" &&
      (!Number.isInteger(Number(form.productCount)) ||
        Number(form.productCount) < 1)
    ) {
      return "Product count must be a whole number of at least 1.";
    }

    if (!STATUS_OPTIONS.includes(form.status)) {
      return "Select a valid shipment status.";
    }

    if (!PACKAGE_TYPES.includes(form.packageType)) {
      return "Select a valid package type.";
    }

    return "";
  };

  const buildPayload = () => ({
    senderName: form.senderName.trim(),
    senderPhone: form.senderPhone.trim(),
    senderAddress: form.senderAddress.trim(),
    receiverName: form.receiverName.trim(),
    receiverPhone: form.receiverPhone.trim(),
    receiverAddress: form.receiverAddress.trim(),
    packageType: form.packageType,
    weight: form.weight.trim() === "" ? null : Number(form.weight),
    productCount:
      form.productCount.trim() === "" ? 1 : Number(form.productCount),
    invoiceNumber: form.invoiceNumber.trim(),
    eWayBillNumber: form.eWayBillNumber.trim(),

    // These aliases support the existing Speed Express status fields.
    currentStatus: form.status,
    status: form.status,
    currentLocation: form.currentLocation.trim(),
    currentRemarks: form.remarks.trim(),
    remarks: form.remarks.trim(),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setNotice("error", validationError);
      return;
    }

    if (mode === "edit" && !editingTrackingNumber) {
      setNotice(
        "error",
        "Find an existing shipment before trying to save edits."
      );
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = buildPayload();

      let url;
      let method;

      if (mode === "edit") {
        // The canonical tracking number is used even if the search used AWD.
        url = `${API_BASE_URL}/shipments/${encodeURIComponent(
          editingTrackingNumber
        )}`;
        method = "PATCH";
      } else {
        url = `${API_BASE_URL}/shipments`;
        method = "POST";

        payload.bookingType = form.bookingType;

        if (form.bookingType === "Offline") {
          payload.trackingNumber = form.trackingNumber.trim();
        }
        // Online bookings leave trackingNumber out so the backend can generate it.
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message ||
            (mode === "edit"
              ? "Unable to update the shipment."
              : "Unable to create the shipment.")
        );
      }

      const shipment = getShipmentFromResponse(result);

      if (mode === "edit") {
        const updatedShipment =
          shipment && shipment.trackingNumber
            ? shipment
            : {
                ...savedShipment,
                ...payload,
                trackingNumber: editingTrackingNumber,
                awdNumber: editingAwdNumber,
              };

        setSavedShipment(updatedShipment);
        setForm(toFormValues(updatedShipment));
        setNotice(
          "success",
          `Shipment ${editingTrackingNumber} updated successfully.`
        );
      } else {
        const trackingNumber = shipment?.trackingNumber;

        setSavedShipment(shipment || null);
        setNotice(
          "success",
          trackingNumber
            ? `Booking created successfully. Tracking number: ${trackingNumber}`
            : "Booking created successfully."
        );

        setForm(EMPTY_FORM);
      }
    } catch (error) {
      console.error("Save shipment error:", error);
      setNotice(
        "error",
        error.message || "Something went wrong while saving the shipment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-page booking-page">
      <header className="booking-page-header">
        <div className="booking-header-content">
          <div className="booking-breadcrumb">
            ADMIN DASHBOARD <span>/</span> SHIPMENT MANAGEMENT
          </div>

          <h1>{mode === "edit" ? "Edit Shipment Booking" : "Create Booking"}</h1>

          <p>
            {mode === "edit"
              ? "Find a saved shipment and update sender, receiver, package, status, location, and remarks."
              : "Create a new shipment with sender, receiver, package, and initial tracking details."}
          </p>
        </div>

        <div className="booking-header-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="38"
            height="38"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        </div>
      </header>

      <div
        className="booking-mode-switch"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 22,
        }}
      >
        <button
          type="button"
          className={
            mode === "create"
              ? "admin-button admin-button-primary"
              : "admin-button admin-button-secondary"
          }
          onClick={() => switchMode("create")}
          disabled={loading || searching}
        >
          + Create New Booking
        </button>

        <button
          type="button"
          className={
            mode === "edit"
              ? "admin-button admin-button-primary"
              : "admin-button admin-button-secondary"
          }
          onClick={() => switchMode("edit")}
          disabled={loading || searching}
        >
          Edit Existing Booking
        </button>
      </div>

      {message.text && (
        <div
          className={`booking-message ${
            message.type === "success"
              ? "booking-message-success"
              : "booking-message-error"
          }`}
          role={message.type === "error" ? "alert" : "status"}
          aria-live="polite"
          style={{ marginBottom: 22 }}
        >
          <span className="booking-message-icon" aria-hidden="true">
            {message.type === "success" ? "✓" : "!"}
          </span>
          <div>{message.text}</div>
        </div>
      )}

      {mode === "edit" && (
        <section className="booking-section" style={{ marginBottom: 23 }}>
          <SectionHeader
            number="🔎"
            title="Find Existing Shipment"
            description="Search using the tracking number or AWD number saved in your database."
          />

          <div className="booking-section-body">
            <form
              onSubmit={handleFindShipment}
              className="booking-field-grid"
            >
              <div className="booking-field">
                <label htmlFor="searchShipmentNumber">
                  Tracking Number / AWD Number
                  <span className="booking-required-mark"> *</span>
                </label>

                <input
                  id="searchShipmentNumber"
                  type="text"
                  value={searchNumber}
                  onChange={(event) => setSearchNumber(event.target.value)}
                  placeholder="Example: SPEED750295 or AWD357190"
                  required
                />
              </div>

              <div
                className="booking-field"
                style={{ justifyContent: "flex-end" }}
              >
                <label aria-hidden="true">&nbsp;</label>
                <button
                  type="submit"
                  className="booking-submit-btn"
                  disabled={searching || loading}
                >
                  {searching ? "Searching..." : "Find Shipment"}
                </button>
              </div>
            </form>

            {savedShipment && mode === "edit" && (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  border: "1px solid #cfe3f7",
                  borderRadius: 12,
                  background: "#f5faff",
                }}
              >
                <strong style={{ color: "#0b3d91" }}>
                  Editing: {editingTrackingNumber}
                </strong>
                {editingAwdNumber && (
                  <div style={{ marginTop: 5, color: "#61758e", fontSize: 13 }}>
                    AWD Number: {editingAwdNumber}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <form className="booking-form" onSubmit={handleSubmit}>
        {/* SECTION 01: BOOKING INFORMATION */}
        <section className="booking-section">
          <SectionHeader
            number="01"
            title="Booking Information"
            description="Review the booking type and manage the initial tracking details."
          />

          <div className="booking-section-body">
            <div className="booking-field-grid">
              <SelectField
                label="Booking Type"
                name="bookingType"
                value={form.bookingType}
                onChange={handleChange}
                required
                options={[
                  { value: "Offline", label: "Offline Booking" },
                  { value: "Online", label: "Online Booking" },
                ]}
              />

              <div className="booking-field">
                <label htmlFor="trackingNumber">
                  Tracking Number
                  {mode === "create" && form.bookingType === "Offline" && (
                    <span className="booking-required-mark"> *</span>
                  )}
                </label>

                <input
                  id="trackingNumber"
                  name="trackingNumber"
                  value={
                    mode === "edit"
                      ? editingTrackingNumber
                      : form.trackingNumber
                  }
                  onChange={handleChange}
                  placeholder={
                    mode === "edit"
                      ? "Existing tracking number"
                      : form.bookingType === "Online"
                        ? "Generated automatically"
                        : "Enter manual tracking number"
                  }
                  readOnly={mode === "edit" || form.bookingType === "Online"}
                  required={
                    mode === "create" && form.bookingType === "Offline"
                  }
                />

                {mode === "edit" && (
                  <small>
                    Tracking number cannot be changed during an edit.
                  </small>
                )}
              </div>

              {mode === "edit" && editingAwdNumber && (
                <div className="booking-field">
                  <label htmlFor="awdNumberDisplay">AWD Number</label>
                  <input
                    id="awdNumberDisplay"
                    value={editingAwdNumber}
                    readOnly
                  />
                  <small>AWD number is shown for reference only.</small>
                </div>
              )}

              <SelectField
                label="Shipment Status"
                name="status"
                value={form.status}
                onChange={handleChange}
                required
                options={STATUS_OPTIONS}
              />

              <TextField
                label="Current Location"
                name="currentLocation"
                value={form.currentLocation}
                onChange={handleChange}
                placeholder="Enter current office or shipment location"
                required
              />

              <TextAreaField
                label="Remarks"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Add or update shipment remarks"
                optional
              />
            </div>
          </div>
        </section>

        {/* SECTION 02: SENDER DETAILS */}
        <section className="booking-section">
          <SectionHeader
            number="02"
            title="Sender Details"
            description="Edit the contact information for the sender."
          />

          <div className="booking-section-body">
            <div className="booking-field-grid">
              <TextField
                label="Sender Name"
                name="senderName"
                value={form.senderName}
                onChange={handleChange}
                placeholder="Enter sender full name"
                required
              />

              <TextField
                label="Sender Phone"
                name="senderPhone"
                value={form.senderPhone}
                onChange={handleChange}
                placeholder="Enter sender phone number"
                type="tel"
                required
              />

              <TextAreaField
                label="Sender Address"
                name="senderAddress"
                value={form.senderAddress}
                onChange={handleChange}
                placeholder="Enter complete sender address"
                required
              />
            </div>
          </div>
        </section>

        {/* SECTION 03: RECEIVER DETAILS */}
        <section className="booking-section">
          <SectionHeader
            number="03"
            title="Receiver Details"
            description="Edit the recipient contact information and delivery address."
          />

          <div className="booking-section-body">
            <div className="booking-field-grid">
              <TextField
                label="Receiver Name"
                name="receiverName"
                value={form.receiverName}
                onChange={handleChange}
                placeholder="Enter receiver full name"
                required
              />

              <TextField
                label="Receiver Phone"
                name="receiverPhone"
                value={form.receiverPhone}
                onChange={handleChange}
                placeholder="Enter receiver phone number"
                type="tel"
                required
              />

              <TextAreaField
                label="Receiver Address"
                name="receiverAddress"
                value={form.receiverAddress}
                onChange={handleChange}
                placeholder="Enter complete delivery address"
                required
              />
            </div>
          </div>
        </section>

        {/* SECTION 04: PACKAGE AND BILLING */}
        <section className="booking-section">
          <SectionHeader
            number="04"
            title="Package & Billing Details"
            description="Edit package information and optional billing references."
          />

          <div className="booking-section-body">
            <div className="booking-field-grid">
              <SelectField
                label="Package Type"
                name="packageType"
                value={form.packageType}
                onChange={handleChange}
                required
                options={PACKAGE_TYPES}
              />

              <TextField
                label="Weight (kg)"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                placeholder="Enter weight in kilograms"
                type="number"
                min="0.001"
                step="any"
                optional
              />

              <TextField
                label="Product Count"
                name="productCount"
                value={form.productCount}
                onChange={handleChange}
                placeholder="Enter product count"
                type="number"
                min="1"
                step="1"
                optional
              />

              <TextField
                label="Invoice Number"
                name="invoiceNumber"
                value={form.invoiceNumber}
                onChange={handleChange}
                placeholder="Enter invoice number"
                optional
              />

              <TextField
                label="E-Way Bill Number"
                name="eWayBillNumber"
                value={form.eWayBillNumber}
                onChange={handleChange}
                placeholder="Enter e-way bill number"
                optional
              />
            </div>
          </div>
        </section>

        {/* FORM ACTIONS */}
        <div className="booking-form-footer">
          <div className="booking-footer-note">
            <span aria-hidden="true">ℹ</span>
            <span>
              {mode === "edit"
                ? "Changes are saved to the existing shipment. The tracking number remains unchanged."
                : "Fields marked * are required. Online bookings receive a tracking number from the backend."}
            </span>
          </div>

          <div className="booking-form-actions">
            <button
              type="button"
              className="booking-reset-btn"
              onClick={resetForm}
              disabled={loading || searching}
            >
              {mode === "edit" ? "Clear Form" : "Reset Form"}
            </button>

            <button
              type="submit"
              className="booking-submit-btn"
              disabled={
                loading ||
                searching ||
                (mode === "edit" && !editingTrackingNumber)
              }
            >
              {loading && <span className="booking-spinner" />}
              {loading
                ? mode === "edit"
                  ? "Saving Changes..."
                  : "Creating Booking..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Create Booking"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
