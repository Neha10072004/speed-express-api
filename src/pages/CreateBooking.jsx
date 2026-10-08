import React, { useState } from "react";
import { createShipment } from "../services/api";
import "./AdminPages.css";

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

  packageType: "Parcel",
  weight: "",

  currentLocation: "",
  currentRemarks: "",
};

export default function CreateBooking() {
  const [formData, setFormData] = useState(initialForm);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [createdShipment, setCreatedShipment] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");

    // When Online is selected, clear manually entered IDs.
    if (name === "bookingType" && value === "Online") {
      setFormData((prev) => ({
        ...prev,
        bookingType: "Online",
        trackingNumber: "",
        awdNumber: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccess("");
    setError("");
    setCreatedShipment(null);

    // Offline validation
    if (formData.bookingType === "Offline") {
      if (!formData.trackingNumber.trim()) {
        setError("Please enter Tracking Number for offline booking.");
        return;
      }

      if (!formData.awdNumber.trim()) {
        setError("Please enter AWD ID for offline booking.");
        return;
      }
    }

    // Sender validation
    if (
      !formData.senderName.trim() ||
      !formData.senderPhone.trim() ||
      !formData.senderAddress.trim()
    ) {
      setError("Please enter all sender details.");
      return;
    }

    // Receiver validation
    if (
      !formData.receiverName.trim() ||
      !formData.receiverPhone.trim() ||
      !formData.receiverAddress.trim()
    ) {
      setError("Please enter all receiver details.");
      return;
    }

    // Weight validation
    const weight = Number(formData.weight);

    if (
      !formData.weight ||
      !Number.isFinite(weight) ||
      weight <= 0
    ) {
      setError("Please enter a valid package weight.");
      return;
    }

    // Location validation
    if (!formData.currentLocation.trim()) {
      setError("Please enter current location.");
      return;
    }

    try {
      setLoading(true);

      const shipmentData = {
        bookingType: formData.bookingType,

        // Only used for Offline.
        // Backend generates these automatically for Online.
        trackingNumber:
          formData.bookingType === "Offline"
            ? formData.trackingNumber.trim().toUpperCase()
            : "",

        awdNumber:
          formData.bookingType === "Offline"
            ? formData.awdNumber.trim().toUpperCase()
            : "",

        senderName: formData.senderName.trim(),
        senderPhone: formData.senderPhone.trim(),
        senderAddress: formData.senderAddress.trim(),

        receiverName: formData.receiverName.trim(),
        receiverPhone: formData.receiverPhone.trim(),
        receiverAddress: formData.receiverAddress.trim(),

        packageType: formData.packageType,
        weight,

        currentLocation: formData.currentLocation.trim(),
        currentRemarks: formData.currentRemarks.trim(),
      };

      console.log("Creating Shipment:", shipmentData);

      const response = await createShipment(shipmentData);

      console.log("Create Booking Response:", response);

      const shipment = response?.shipment;

      if (
        !shipment?.trackingNumber ||
        !shipment?.awdNumber
      ) {
        throw new Error(
          "Booking response is missing Tracking Number or AWD ID."
        );
      }

      setCreatedShipment(shipment);

      setSuccess("Booking created successfully.");

      // Reset form
      setFormData({
        ...initialForm,
      });

      console.log(
        "Tracking Number:",
        shipment.trackingNumber
      );

      console.log(
        "AWD Number:",
        shipment.awdNumber
      );

      console.log(
        "Booking Type:",
        shipment.bookingType
      );

      console.log(
        "Current Status:",
        shipment.currentStatus
      );
    } catch (err) {
      console.error("Create Booking Error:", err);

      setError(
        err.message ||
          "Unable to create booking."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">

      {/* PAGE HEADER */}
      <div className="admin-page-header">

        <div>
          <div className="admin-page-kicker">
            SHIPMENT MANAGEMENT
          </div>

          <h2>
            Create Booking
          </h2>

          <p>
            Create a new Speed Express shipment.
          </p>
        </div>

        <div className="admin-header-badge">
          New Shipment
        </div>

      </div>

      {/* SUCCESS */}
      {success && (
        <div
          className="admin-alert admin-alert-success"
          role="status"
        >
          <span className="alert-icon">
            ✓
          </span>

          <div>
            <strong>
              Booking Created
            </strong>

            <p>
              {success}
            </p>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div
          className="admin-alert admin-alert-error"
          role="alert"
        >
          <span className="alert-icon">
            !
          </span>

          <div>
            <strong>
              Unable to create booking
            </strong>

            <p>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* CREATED BOOKING */}
      {createdShipment && (
        <div className="created-booking-card">

          <div className="created-booking-header">

            <div>
              <span>
                BOOKING CREATED
              </span>

              <h3>
                Shipment successfully created
              </h3>
            </div>

            <div className="created-check">
              ✓
            </div>

          </div>

          <div className="created-booking-grid">

            <div className="created-info">
              <small>
                Booking Type
              </small>

              <strong>
                {createdShipment.bookingType}
              </strong>
            </div>

            <div className="created-info">
              <small>
                Tracking Number
              </small>

              <strong>
                {createdShipment.trackingNumber}
              </strong>
            </div>

            <div className="created-info">
              <small>
                AWD ID
              </small>

              <strong>
                {createdShipment.awdNumber}
              </strong>
            </div>

            <div className="created-info">
              <small>
                Status
              </small>

              <strong>
                {createdShipment.currentStatus ||
                  "In Transit"}
              </strong>
            </div>

            <div className="created-info">
              <small>
                Location
              </small>

              <strong>
                {createdShipment.currentLocation ||
                  "—"}
              </strong>
            </div>

            <div className="created-info">
              <small>
                Date
              </small>

              <strong>
                {createdShipment.currentDate ||
                  "—"}
              </strong>
            </div>

            <div className="created-info">
              <small>
                Time
              </small>

              <strong>
                {createdShipment.currentTime ||
                  "—"}
              </strong>
            </div>

          </div>
        </div>
      )}

      {/* FORM */}
      <form
        className="booking-form-card"
        onSubmit={handleSubmit}
      >

        {/* SECTION 01 */}
        <div className="form-section">

          <div className="form-section-title">

            <div className="section-number">
              01
            </div>

            <div>
              <h3>
                Booking Details
              </h3>

              <p>
                Select whether this booking is online or offline.
              </p>
            </div>

          </div>

          <div className="admin-form-grid">

            {/* BOOKING TYPE */}
            <div className="admin-field">

              <label htmlFor="bookingType">
                Booking Type
              </label>

              <select
                id="bookingType"
                name="bookingType"
                value={formData.bookingType}
                onChange={handleChange}
                required
              >
                <option value="Offline">
                  Offline
                </option>

                <option value="Online">
                  Online
                </option>
              </select>

              <small className="field-help">
                Offline = enter IDs manually. Online = IDs generated automatically.
              </small>

            </div>

          </div>

        </div>

        {/* SECTION 02 */}
        <div className="form-section">

          <div className="form-section-title">

            <div className="section-number">
              02
            </div>

            <div>
              <h3>
                Tracking Details
              </h3>

              <p>
                Tracking IDs depend on the selected booking type.
              </p>
            </div>

          </div>

          <div className="admin-form-grid">

            {/* TRACKING NUMBER */}
            <div className="admin-field">

              <label htmlFor="trackingNumber">
                Tracking Number
              </label>

              <input
                id="trackingNumber"
                type="text"
                name="trackingNumber"
                value={formData.trackingNumber}
                onChange={handleChange}
                placeholder={
                  formData.bookingType === "Online"
                    ? "Automatically generated"
                    : "Example: SPEED100001"
                }
                disabled={
                  formData.bookingType === "Online"
                }
                required={
                  formData.bookingType === "Offline"
                }
              />

              <small className="field-help">

                {formData.bookingType === "Online"
                  ? "Tracking Number will be generated automatically."
                  : "Enter the Tracking Number manually."}

              </small>

            </div>

            {/* AWD */}
            <div className="admin-field">

              <label htmlFor="awdNumber">
                AWD ID
              </label>

              <input
                id="awdNumber"
                type="text"
                name="awdNumber"
                value={formData.awdNumber}
                onChange={handleChange}
                placeholder={
                  formData.bookingType === "Online"
                    ? "Automatically generated"
                    : "Example: AWD100001"
                }
                disabled={
                  formData.bookingType === "Online"
                }
                required={
                  formData.bookingType === "Offline"
                }
              />

              <small className="field-help">

                {formData.bookingType === "Online"
                  ? "AWD ID will be generated automatically."
                  : "Enter the AWD ID manually."}

              </small>

            </div>

          </div>

          {formData.bookingType === "Online" && (
            <div className="admin-alert admin-alert-success">

              <span className="alert-icon">
                ✓
              </span>

              <div>

                <strong>
                  Automatic ID Generation Enabled
                </strong>

                <p>
                  Tracking Number and AWD ID will be generated automatically when you create the booking.
                </p>

              </div>

            </div>
          )}

        </div>

        {/* SECTION 03 */}
        <div className="form-section">

          <div className="form-section-title">

            <div className="section-number">
              03
            </div>

            <div>
              <h3>
                Sender Details
              </h3>

              <p>
                Enter the sender's information.
              </p>
            </div>

          </div>

          <div className="admin-form-grid">

            <div className="admin-field">

              <label htmlFor="senderName">
                Sender Name
              </label>

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

              <label htmlFor="senderPhone">
                Sender Phone
              </label>

              <input
                id="senderPhone"
                type="tel"
                name="senderPhone"
                value={formData.senderPhone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />

            </div>

          </div>

          <div className="admin-field">

            <label htmlFor="senderAddress">
              Sender Address
            </label>

            <textarea
              id="senderAddress"
              name="senderAddress"
              value={formData.senderAddress}
              onChange={handleChange}
              placeholder="Enter complete sender address"
              rows={3}
              required
            />

          </div>

        </div>

        {/* SECTION 04 */}
        <div className="form-section">

          <div className="form-section-title">

            <div className="section-number">
              04
            </div>

            <div>
              <h3>
                Receiver Details
              </h3>

              <p>
                Enter the receiver's information.
              </p>
            </div>

          </div>

          <div className="admin-form-grid">

            <div className="admin-field">

              <label htmlFor="receiverName">
                Receiver Name
              </label>

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

              <label htmlFor="receiverPhone">
                Receiver Phone
              </label>

              <input
                id="receiverPhone"
                type="tel"
                name="receiverPhone"
                value={formData.receiverPhone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />

            </div>

          </div>

          <div className="admin-field">

            <label htmlFor="receiverAddress">
              Receiver Address
            </label>

            <textarea
              id="receiverAddress"
              name="receiverAddress"
              value={formData.receiverAddress}
              onChange={handleChange}
              placeholder="Enter complete receiver address"
              rows={3}
              required
            />

          </div>

        </div>

        {/* SECTION 05 */}
        <div className="form-section">

          <div className="form-section-title">

            <div className="section-number">
              05
            </div>

            <div>
              <h3>
                Package Details
              </h3>

              <p>
                Enter package type and weight.
              </p>
            </div>

          </div>

          <div className="admin-form-grid">

            <div className="admin-field">

              <label htmlFor="packageType">
                Package Type
              </label>

              <select
                id="packageType"
                name="packageType"
                value={formData.packageType}
                onChange={handleChange}
              >

                <option value="Parcel">
                  Parcel
                </option>

                <option value="Document">
                  Document
                </option>

                <option value="Box">
                  Box
                </option>

                <option value="Corporate">
                  Corporate
                </option>

              </select>

            </div>

            <div className="admin-field">

              <label htmlFor="weight">
                Weight (KG)
              </label>

              <input
                id="weight"
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Example: 2"
                min="0.01"
                step="0.01"
                required
              />

            </div>

          </div>

        </div>

        {/* SECTION 06 */}
        <div className="form-section">

          <div className="form-section-title">

            <div className="section-number">
              06
            </div>

            <div>
              <h3>
                Initial Tracking Details
              </h3>

              <p>
                Add the first shipment tracking update.
              </p>
            </div>

          </div>

          <div className="admin-form-grid">

            <div className="admin-field">

              <label htmlFor="currentLocation">
                Current Location
              </label>

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

              <label htmlFor="currentRemarks">
                Remarks
              </label>

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

        </div>

        {/* FOOTER */}
        <div className="booking-form-footer">

          <div>

            <strong>
              Ready to create shipment?
            </strong>

            <span>

              {formData.bookingType === "Online"
                ? "Tracking Number and AWD ID will be generated automatically."
                : "Enter a unique Tracking Number and AWD ID."}

            </span>

          </div>

          <button
            type="submit"
            className="primary-admin-button"
            disabled={loading}
          >

            {loading
              ? "Creating Booking..."
              : "Create Booking"}

          </button>

        </div>

      </form>

    </div>
  );
}