import React, { useState } from "react";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const initialForm = {
  bookingType: "Offline",
  trackingNumber: "",
  awdNumber: "",
  senderName: "",
  senderPhone: "",
  senderAddress: "",
  receiverName: "",
  receiverPhone: "",
  receiverAddress: "",
  packageType: "",
  weight: "",
  currentStatus: "In Transit",
  currentLocation: "",
  currentRemarks: "",
};

export default function CreateBooking() {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdShipment, setCreatedShipment] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "trackingNumber" || name === "awdNumber"
          ? value.toUpperCase()
          : value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setCreatedShipment(null);

    // Validate required fields.
    const requiredFields = [
      ["senderName", "Please enter the sender name."],
      ["senderPhone", "Please enter the sender phone number."],
      ["senderAddress", "Please enter the sender address."],
      ["receiverName", "Please enter the receiver name."],
      ["receiverPhone", "Please enter the receiver phone number."],
      ["receiverAddress", "Please enter the receiver address."],
      ["packageType", "Please select a package type."],
      ["currentLocation", "Please enter the current location."],
    ];

    for (const [field, message] of requiredFields) {
      if (!String(formData[field] ?? "").trim()) {
        setError(message);
        return;
      }
    }

    // Weight is OPTIONAL. Validate it only when provided.
    const weightText = String(formData.weight ?? "").trim();
    const weight =
      weightText === "" ? null : Number(weightText);

    if (
      weight !== null &&
      (!Number.isFinite(weight) || weight <= 0)
    ) {
      setError("Weight must be a positive number when provided.");
      return;
    }

    // Offline bookings require manually entered shipment IDs.
    if (formData.bookingType === "Offline") {
      if (!formData.trackingNumber.trim()) {
        setError("Please enter the tracking number for an offline booking.");
        return;
      }

      if (!formData.awdNumber.trim()) {
        setError("Please enter the AWD number for an offline booking.");
        return;
      }
    }

    const payload = {
      bookingType: formData.bookingType,
      senderName: formData.senderName.trim(),
      senderPhone: formData.senderPhone.trim(),
      senderAddress: formData.senderAddress.trim(),
      receiverName: formData.receiverName.trim(),
      receiverPhone: formData.receiverPhone.trim(),
      receiverAddress: formData.receiverAddress.trim(),
      packageType: formData.packageType,
      weight,
      currentStatus: formData.currentStatus,
      currentLocation: formData.currentLocation.trim(),
      currentRemarks: formData.currentRemarks.trim(),
    };

    if (formData.bookingType === "Offline") {
      payload.trackingNumber = formData.trackingNumber.trim().toUpperCase();
      payload.awdNumber = formData.awdNumber.trim().toUpperCase();
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            "Unable to create the shipment."
        );
      }

      const shipment = result.shipment || result.data || result;

      setCreatedShipment(shipment);
      setSuccess("Booking created successfully!");
      setFormData(initialForm);
    } catch (err) {
      console.error("Create booking error:", err);
      setError(
        err.message ||
          "Unable to create the booking. Please check your API connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const getShipmentNumber = () => {
    return (
      createdShipment?.trackingNumber ||
      createdShipment?.shipment?.trackingNumber ||
      ""
    );
  };

  const downloadLabel = async () => {
    const trackingNumber = getShipmentNumber();

    if (!trackingNumber) {
      setError("Tracking number is not available for this shipment.");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/shipments/${encodeURIComponent(
          trackingNumber
        )}/label`,
        { method: "GET" }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(
          result.message || "Unable to download the shipping label."
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${trackingNumber}-shipping-label.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download label error:", err);
      setError(err.message || "Unable to download the shipping label.");
    }
  };

  const printLabel = async () => {
    const trackingNumber = getShipmentNumber();

    if (!trackingNumber) {
      setError("Tracking number is not available for this shipment.");
      return;
    }

    let objectUrl;

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/shipments/${encodeURIComponent(
          trackingNumber
        )}/label`,
        { method: "GET" }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(
          result.message || "Unable to prepare the shipping label for printing."
        );
      }

      const blob = await response.blob();
      objectUrl = window.URL.createObjectURL(blob);

      const printWindow = window.open(objectUrl, "_blank");

      if (!printWindow) {
        window.URL.revokeObjectURL(objectUrl);
        setError(
          "The print window was blocked. Allow pop-ups and try again."
        );
        return;
      }

      // Give the PDF viewer time to load before opening the print dialog.
      printWindow.addEventListener("load", () => {
        printWindow.focus();
        printWindow.print();
      });
    } catch (err) {
      console.error("Print label error:", err);
      setError(err.message || "Unable to print the shipping label.");
    }
  };

  return (
    <div className="create-booking-page">
      <div className="page-heading">
        <div>
          <div className="admin-page-kicker">SPEED EXPRESS</div>
          <h2>Create Booking</h2>
          <p>Create and manage shipment bookings.</p>
        </div>
      </div>

      {error && (
        <div className="admin-alert admin-alert-error" role="alert">
          <span className="alert-icon">!</span>
          <div>
            <strong>Booking Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success" role="status">
          <span className="alert-icon">✓</span>
          <div>
            <strong>{success}</strong>
            <p>Your shipment has been saved.</p>
          </div>
        </div>
      )}

      {createdShipment && (
        <div className="booking-confirmation">
          <h3>Booking Confirmation</h3>

          <p>
            <strong>Tracking Number:</strong>{" "}
            {createdShipment.trackingNumber || "-"}
          </p>

          <p>
            <strong>AWD Number:</strong>{" "}
            {createdShipment.awdNumber || "-"}
          </p>

          <div className="booking-confirmation-actions">
            <button
              type="button"
              className="primary-admin-button"
              onClick={downloadLabel}
            >
              Download Label
            </button>

            <button
              type="button"
              className="secondary-admin-button"
              onClick={printLabel}
            >
              Print Label
            </button>
          </div>
        </div>
      )}

      <form className="booking-form-card" onSubmit={handleSubmit}>
        {/* Section 01: Booking Information */}
        <section className="form-section">
          <div className="form-section-title">
            <div className="section-number">01</div>
            <div>
              <h3>Booking Information</h3>
              <p>Select the type of booking.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="bookingType">Booking Type</label>
              <select
                id="bookingType"
                name="bookingType"
                value={formData.bookingType}
                onChange={handleChange}
                required
              >
                <option value="Offline">Offline</option>
                <option value="Online">Online</option>
              </select>
            </div>

            {formData.bookingType === "Offline" && (
              <>
                <div className="admin-field">
                  <label htmlFor="trackingNumber">Tracking Number</label>
                  <input
                    id="trackingNumber"
                    type="text"
                    name="trackingNumber"
                    value={formData.trackingNumber}
                    onChange={handleChange}
                    placeholder="Example: SPEED123456"
                    required
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="awdNumber">AWD Number</label>
                  <input
                    id="awdNumber"
                    type="text"
                    name="awdNumber"
                    value={formData.awdNumber}
                    onChange={handleChange}
                    placeholder="Enter AWD number"
                    required
                  />
                </div>
              </>
            )}
          </div>

          {formData.bookingType === "Online" && (
            <p>
              Tracking Number and AWD Number will be generated by the backend
              according to your server configuration.
            </p>
          )}
        </section>

        {/* Section 02: Sender Information */}
        <section className="form-section">
          <div className="form-section-title">
            <div className="section-number">02</div>
            <div>
              <h3>Sender Information</h3>
              <p>Enter the sender's contact details.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="senderName">Sender Name</label>
              <input
                id="senderName"
                type="text"
                name="senderName"
                value={formData.senderName}
                onChange={handleChange}
                placeholder="Enter sender name"
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="senderPhone">Sender Phone</label>
              <input
                id="senderPhone"
                type="tel"
                name="senderPhone"
                value={formData.senderPhone}
                onChange={handleChange}
                placeholder="Enter sender phone number"
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="senderAddress">Sender Address</label>
              <textarea
                id="senderAddress"
                name="senderAddress"
                value={formData.senderAddress}
                onChange={handleChange}
                placeholder="Enter complete sender address"
                rows="3"
                required
              />
            </div>
          </div>
        </section>

        {/* Section 03: Receiver Information */}
        <section className="form-section">
          <div className="form-section-title">
            <div className="section-number">03</div>
            <div>
              <h3>Receiver Information</h3>
              <p>Enter the receiver's contact details.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="receiverName">Receiver Name</label>
              <input
                id="receiverName"
                type="text"
                name="receiverName"
                value={formData.receiverName}
                onChange={handleChange}
                placeholder="Enter receiver name"
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="receiverPhone">Receiver Phone</label>
              <input
                id="receiverPhone"
                type="tel"
                name="receiverPhone"
                value={formData.receiverPhone}
                onChange={handleChange}
                placeholder="Enter receiver phone number"
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="receiverAddress">Receiver Address</label>
              <textarea
                id="receiverAddress"
                name="receiverAddress"
                value={formData.receiverAddress}
                onChange={handleChange}
                placeholder="Enter complete receiver address"
                rows="3"
                required
              />
            </div>
          </div>
        </section>

        {/* Section 04: Package Information */}
        <section className="form-section">
          <div className="form-section-title">
            <div className="section-number">04</div>
            <div>
              <h3>Package Information</h3>
              <p>Enter the package type and weight, if available.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="packageType">Package Type</label>
              <select
                id="packageType"
                name="packageType"
                value={formData.packageType}
                onChange={handleChange}
                required
              >
                <option value="">Select package type</option>
                <option value="Document">Document</option>
                <option value="Parcel">Parcel</option>
                <option value="Box">Box</option>
                <option value="Corporate Gift">Corporate Gift</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="admin-field">
              <label htmlFor="weight">Weight (KG) (Optional)</label>
              <input
                id="weight"
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Enter weight in KG (optional)"
                min="0.01"
                step="0.01"
              />
              <small className="field-help">
                Weight is optional. Leave blank if it is not available.
              </small>
            </div>
          </div>
        </section>

        {/* Section 05: Initial Tracking Details */}
        <section className="form-section">
          <div className="form-section-title">
            <div className="section-number">05</div>
            <div>
              <h3>Initial Tracking Details</h3>
              <p>Add the first shipment tracking update.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="currentStatus">Shipment Status</label>
              <select
                id="currentStatus"
                name="currentStatus"
                value={formData.currentStatus}
                onChange={handleChange}
                required
              >
                <option value="In Transit">In Transit</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div className="admin-field">
              <label htmlFor="currentLocation">Current Location</label>
              <input
                id="currentLocation"
                type="text"
                name="currentLocation"
                value={formData.currentLocation}
                onChange={handleChange}
                placeholder="Example: Pune"
                required
              />
            </div>

            <div className="admin-field">
              <label htmlFor="currentRemarks">Remarks</label>
              <input
                id="currentRemarks"
                type="text"
                name="currentRemarks"
                value={formData.currentRemarks}
                onChange={handleChange}
                placeholder="Optional remarks"
              />
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="booking-form-footer">
          <div>
            <strong>Ready to create shipment?</strong>
            <span>
              {formData.bookingType === "Online"
                ? "Tracking Number and AWD Number will be generated automatically."
                : "The tracking and AWD numbers will use the IDs you entered."}
            </span>
          </div>

          <button
            type="submit"
            className="primary-admin-button"
            disabled={loading}
          >
            {loading ? "Creating Booking..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
