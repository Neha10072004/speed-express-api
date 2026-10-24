import React, { useState } from "react";
 

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://api.speedexp.in/api"
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

const INITIAL_FORM = {
  bookingType: "Offline",
  trackingNumber: "",
  awdNumber: "",
  senderName: "",
  senderPhone: "",
  senderAddress: "",
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  packageType: "Parcel",
  weight: "",
  productCount: "1",
  invoiceNumber: "",
  eWayBillNumber: "",
  status: "Shipment Booked",
  currentLocation: "",
  remarks: "",
};

export default function CreateBooking() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  // IMPORTANT: Store the selected VALUE, never the HTML element.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    setError("");
  };

  const handleBookingTypeChange = (event) => {
    const selectedType = event.target.value;

    setForm((previousForm) => ({
      ...previousForm,
      bookingType: selectedType,
      trackingNumber:
        selectedType === "Online" ? "" : previousForm.trackingNumber,
    }));

    setError("");
  };

  const generateTrackingNumber = () => {
    const number = Math.floor(100000 + Math.random() * 900000);
    return `SPEED${number}`;
  };

  const validateForm = () => {
    if (
      form.bookingType === "Offline" &&
      !form.trackingNumber.trim()
    ) {
      return "Please enter a tracking number for Offline booking.";
    }

    const requiredFields = [
      ["senderName", "Sender name"],
      ["senderPhone", "Sender phone"],
      ["senderAddress", "Sender address"],
      ["receiverName", "Receiver name"],
      ["receiverPhone", "Receiver phone"],
      ["receiverAddress", "Receiver address"],
    ];

    for (const [field, label] of requiredFields) {
      if (!form[field].trim()) {
        return `Please enter ${label.toLowerCase()}.`;
      }
    }

    if (
      form.weight !== "" &&
      (!Number.isFinite(Number(form.weight)) || Number(form.weight) < 0)
    ) {
      return "Weight must be a valid non-negative number.";
    }

    if (
      !Number.isInteger(Number(form.productCount)) ||
      Number(form.productCount) < 1
    ) {
      return "Product count must be a whole number of at least 1.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");
    setSuccess(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const trackingNumber =
        form.bookingType === "Online"
          ? generateTrackingNumber()
          : form.trackingNumber.trim().toUpperCase();

      // Construct a plain JSON object. Never include event.target,
      // HTMLOptionElement, or other DOM elements in this payload.
      const payload = {
        bookingType: form.bookingType,
        trackingNumber,
        senderName: form.senderName.trim(),
        senderPhone: form.senderPhone.trim(),
        senderAddress: form.senderAddress.trim(),
        receiverName: form.receiverName.trim(),
        receiverPhone: form.receiverPhone.trim(),
        receiverAddress: form.receiverAddress.trim(),
        packageType: form.packageType,
        productCount: Number(form.productCount),
        status: form.status,
        currentLocation: form.currentLocation.trim(),
        remarks: form.remarks.trim(),
        invoiceNumber: form.invoiceNumber.trim(),
        eWayBillNumber: form.eWayBillNumber.trim(),
      };

      // AWD is optional. Do not send it if it is blank.
      if (form.awdNumber.trim()) {
        payload.awdNumber = form.awdNumber.trim().toUpperCase();
      }

      // Weight is optional. Omit it when the field is empty.
      if (form.weight !== "") {
        payload.weight = Number(form.weight);
      }

      const response = await fetch(`${API_BASE_URL}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            responseData.error ||
            `Booking failed with HTTP ${response.status}.`
        );
      }

      const savedShipment =
        responseData.shipment ||
        responseData.data ||
        responseData.result ||
        responseData;

      setSuccess({
        trackingNumber:
          savedShipment.trackingNumber || trackingNumber,
        awdNumber: savedShipment.awdNumber || "",
        bookingType: form.bookingType,
      });

      setForm(INITIAL_FORM);
    } catch (err) {
      console.error("Create booking error:", err);
      setError(
        err.message ||
          "Unable to create booking. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setError("");
    setSuccess(null);
  };

  return (
    <main className="create-booking-page">
      <header className="booking-page-header">
        <div>
          <span className="booking-eyebrow">SHIPMENT MANAGEMENT</span>
          <h1>Create New Booking</h1>
          <p>
            Enter shipment details to register and manage a Speed Express
            delivery.
          </p>
        </div>

        <div className="booking-header-icon" aria-hidden="true">
          <span>✈</span>
        </div>
      </header>

      {error && (
        <div className="booking-alert booking-alert-error" role="alert">
          <strong>Booking failed</strong>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="booking-alert booking-alert-success" role="status">
          <strong>Booking created successfully!</strong>
          <p>
            Tracking Number: <b>{success.trackingNumber}</b>
          </p>
          {success.awdNumber && (
            <p>
              AWD Number: <b>{success.awdNumber}</b>
            </p>
          )}
          <p>Booking Type: {success.bookingType}</p>
          <p>Save the tracking number to track this shipment.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="booking-form">
        <section className="booking-card">
          <div className="booking-section-heading">
            <span className="booking-step">01</span>
            <div>
              <h2>Booking Information</h2>
              <p>Choose how this shipment is being registered.</p>
            </div>
          </div>

          <div className="booking-grid">
            <div className="booking-field">
              <label htmlFor="bookingType">Booking Type *</label>
              <select
                id="bookingType"
                name="bookingType"
                value={form.bookingType}
                onChange={handleBookingTypeChange}
                required
              >
                <option value="Offline">Offline Booking</option>
                <option value="Online">Online Booking</option>
              </select>
            </div>

            <div className="booking-field">
              <label htmlFor="trackingNumber">
                Tracking Number {form.bookingType === "Offline" ? "*" : ""}
              </label>
              <input
                id="trackingNumber"
                name="trackingNumber"
                type="text"
                value={form.trackingNumber}
                onChange={handleChange}
                placeholder={
                  form.bookingType === "Offline"
                    ? "Enter manual tracking number"
                    : "Generated automatically"
                }
                disabled={form.bookingType === "Online"}
                required={form.bookingType === "Offline"}
              />
              <small>
                {form.bookingType === "Online"
                  ? "A SPEED tracking number will be generated when you submit."
                  : "Enter a unique tracking number for this offline shipment."}
              </small>
            </div>

            <div className="booking-field">
              <label htmlFor="awdNumber">AWD Number (Optional)</label>
              <input
                id="awdNumber"
                name="awdNumber"
                type="text"
                value={form.awdNumber}
                onChange={handleChange}
                placeholder="Enter AWD number if available"
              />
            </div>

            <div className="booking-field">
              <label htmlFor="status">Shipment Status *</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                required
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="booking-card">
          <div className="booking-section-heading">
            <span className="booking-step">02</span>
            <div>
              <h2>Sender Information</h2>
              <p>Enter the person or business sending the package.</p>
            </div>
          </div>

          <div className="booking-grid">
            <div className="booking-field">
              <label htmlFor="senderName">Sender Name *</label>
              <input
                id="senderName"
                name="senderName"
                value={form.senderName}
                onChange={handleChange}
                placeholder="Enter sender's full name"
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="senderPhone">Sender Phone *</label>
              <input
                id="senderPhone"
                name="senderPhone"
                type="tel"
                value={form.senderPhone}
                onChange={handleChange}
                placeholder="Enter sender's phone number"
                required
              />
            </div>

            <div className="booking-field booking-field-full">
              <label htmlFor="senderAddress">Sender Address *</label>
              <textarea
                id="senderAddress"
                name="senderAddress"
                value={form.senderAddress}
                onChange={handleChange}
                placeholder="Enter complete pickup address"
                rows="3"
                required
              />
            </div>
          </div>
        </section>

        <section className="booking-card">
          <div className="booking-section-heading">
            <span className="booking-step">03</span>
            <div>
              <h2>Receiver Information</h2>
              <p>Enter the destination and recipient details.</p>
            </div>
          </div>

          <div className="booking-grid">
            <div className="booking-field">
              <label htmlFor="receiverName">Receiver Name *</label>
              <input
                id="receiverName"
                name="receiverName"
                value={form.receiverName}
                onChange={handleChange}
                placeholder="Enter receiver's full name"
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="receiverPhone">Receiver Phone *</label>
              <input
                id="receiverPhone"
                name="receiverPhone"
                type="tel"
                value={form.receiverPhone}
                onChange={handleChange}
                placeholder="Enter receiver's phone number"
                required
              />
            </div>

            <div className="booking-field booking-field-full">
              <label htmlFor="receiverAddress">Receiver Address *</label>
              <textarea
                id="receiverAddress"
                name="receiverAddress"
                value={form.receiverAddress}
                onChange={handleChange}
                placeholder="Enter complete delivery address"
                rows="3"
                required
              />
            </div>
          </div>
        </section>

        <section className="booking-card">
          <div className="booking-section-heading">
            <span className="booking-step">04</span>
            <div>
              <h2>Package Details</h2>
              <p>Add the package information and shipment references.</p>
            </div>
          </div>

          <div className="booking-grid">
            <div className="booking-field">
              <label htmlFor="packageType">Package Type *</label>
              <select
                id="packageType"
                name="packageType"
                value={form.packageType}
                onChange={handleChange}
                required
              >
                <option value="Parcel">Parcel</option>
                <option value="Document">Document</option>
                <option value="Box">Box</option>
                <option value="Corporate Gift">Corporate Gift</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="booking-field">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                id="weight"
                name="weight"
                type="number"
                min="0"
                step="0.01"
                value={form.weight}
                onChange={handleChange}
                placeholder="Enter weight (optional)"
              />
            </div>

            <div className="booking-field">
              <label htmlFor="productCount">Number of Packages *</label>
              <input
                id="productCount"
                name="productCount"
                type="number"
                min="1"
                step="1"
                value={form.productCount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="booking-field">
              <label htmlFor="invoiceNumber">Invoice Number</label>
              <input
                id="invoiceNumber"
                name="invoiceNumber"
                value={form.invoiceNumber}
                onChange={handleChange}
                placeholder="Optional invoice reference"
              />
            </div>

            <div className="booking-field">
              <label htmlFor="eWayBillNumber">E-Way Bill Number</label>
              <input
                id="eWayBillNumber"
                name="eWayBillNumber"
                value={form.eWayBillNumber}
                onChange={handleChange}
                placeholder="Optional e-way bill reference"
              />
            </div>

            <div className="booking-field">
              <label htmlFor="currentLocation">Current Location</label>
              <input
                id="currentLocation"
                name="currentLocation"
                value={form.currentLocation}
                onChange={handleChange}
                placeholder="Enter current shipment location"
              />
            </div>

            <div className="booking-field booking-field-full">
              <label htmlFor="remarks">Remarks</label>
              <textarea
                id="remarks"
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                placeholder="Add special instructions or remarks (optional)"
                rows="3"
              />
            </div>
          </div>
        </section>

        <div className="booking-form-actions">
          <button
            type="button"
            className="booking-reset-button"
            onClick={handleReset}
            disabled={loading}
          >
            Reset Form
          </button>

          <button
            type="submit"
            className="booking-submit-button"
            disabled={loading}
          >
            {loading ? "Creating Booking..." : "Create Booking"}
          </button>
        </div>
      </form>
    </main>
  );
}