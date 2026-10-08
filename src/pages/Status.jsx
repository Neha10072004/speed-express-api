import React, { useState } from "react";
import { updateShipmentStatus } from "../services/api";
import "./AdminPages.css";

const initialForm = {
  trackingNumber: "",
  status: "In Transit",
  location: "",
  remarks: "",
};

const statusOptions = [
  {
    value: "In Transit",
    description: "Shipment is moving to its destination",
  },
  {
    value: "Out For Delivery",
    description: "Shipment is with the delivery team",
  },
  {
    value: "Delivered",
    description: "Shipment has reached the receiver",
  },
];

export default function Status() {
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [updatedShipment, setUpdatedShipment] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setUpdatedShipment(null);

    const trackingNumber = formData.trackingNumber.trim();
    const location = formData.location.trim();

    if (!trackingNumber) {
      setError("Please enter a Tracking Number or AWD Number.");
      return;
    }

    if (!location) {
      setError("Please enter the current shipment location.");
      return;
    }

    try {
      setLoading(true);

      const data = await updateShipmentStatus(trackingNumber, {
        status: formData.status,
        location,
        remarks: formData.remarks.trim(),
      });

      const shipment = data.shipment;

      setMessage(data.message || "Shipment status updated successfully.");
      setUpdatedShipment(shipment || null);

      // Keep the tracking number so another update is easier.
      setFormData((prev) => ({
        ...prev,
        trackingNumber,
        location: shipment?.currentLocation || location,
        remarks: "",
        status: shipment?.currentStatus || prev.status,
      }));
    } catch (err) {
      setError(err.message || "Unable to update shipment status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page status-page">
      {/* PAGE HEADER */}
      <div className="admin-page-header status-page-header">
        <div>
          <div className="admin-page-kicker">
            SHIPMENT MANAGEMENT
          </div>

          <h2>Update Shipment Status</h2>

          <p>
            Track shipment progress by updating its status,
            current location, and remarks.
          </p>
        </div>

        <div className="status-header-badge">
          <span className="status-header-dot" />
          Shipment Updates
        </div>
      </div>

      <div className="status-layout">
        {/* FORM CARD */}
        <div className="status-form-card">
          <div className="status-card-heading">
            <div className="status-heading-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"
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
            </div>

            <div>
              <h3>Shipment Information</h3>
              <p>Enter the details for this tracking update.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* TRACKING NUMBER */}
            <div className="status-field">
              <label htmlFor="trackingNumber">
                Tracking Number / AWD Number
                <span className="required-star">*</span>
              </label>

              <div className="status-input-wrap">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="10.8"
                    cy="10.8"
                    r="6.8"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="m16 16 4.2 4.2"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>

                <input
                  id="trackingNumber"
                  type="text"
                  name="trackingNumber"
                  value={formData.trackingNumber}
                  onChange={handleChange}
                  placeholder="e.g. SPEED123456 or AWD123456"
                  autoComplete="off"
                  required
                />
              </div>

              <small>
                Enter the tracking number generated during booking.
              </small>
            </div>

            {/* STATUS */}
            <div className="status-field">
              <label htmlFor="shipmentStatus">
                Shipment Status
                <span className="required-star">*</span>
              </label>

              <select
                id="shipmentStatus"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value}
                  </option>
                ))}
              </select>

              <div className="status-selected-info">
                <span
                  className={`status-indicator ${
                    formData.status === "Delivered"
                      ? "status-indicator-delivered"
                      : formData.status === "Out For Delivery"
                      ? "status-indicator-out"
                      : "status-indicator-transit"
                  }`}
                />

                <span>
                  {
                    statusOptions.find(
                      (option) => option.value === formData.status
                    )?.description
                  }
                </span>
              </div>
            </div>

            {/* LOCATION */}
            <div className="status-field">
              <label htmlFor="currentLocation">
                Current Location
                <span className="required-star">*</span>
              </label>

              <div className="status-input-wrap">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="10"
                    r="2.5"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                </svg>

                <input
                  id="currentLocation"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter city or delivery location"
                  required
                />
              </div>
            </div>

            {/* REMARKS */}
            <div className="status-field">
              <label htmlFor="shipmentRemarks">
                Remarks
                <span className="optional-label">Optional</span>
              </label>

              <textarea
                id="shipmentRemarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Add an update for this shipment..."
                rows={4}
              />
            </div>

            {/* ERROR */}
            {error && (
              <div className="status-message status-message-error" role="alert">
                <span className="status-message-icon">!</span>
                <div>
                  <strong>Update failed</strong>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* SUCCESS */}
            {message && (
              <div
                className="status-message status-message-success"
                role="status"
              >
                <span className="status-message-icon">✓</span>
                <div>
                  <strong>Update successful</strong>
                  <p>{message}</p>
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="status-form-footer">
              <p>
                <span className="required-star">*</span>
                Required fields
              </p>

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
                    Update Shipment
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* INFORMATION CARD */}
        <aside className="status-side-card">
          <div className="status-side-top">
            <div className="status-side-icon">↗</div>
            <h3>Shipment Progress</h3>
            <p>
              Keep your customers informed with accurate shipment
              tracking updates.
            </p>
          </div>

          <div className="status-progress-list">
            <div className="status-progress-item">
              <div className="status-progress-marker">
                <span>1</span>
              </div>
              <div>
                <strong>In Transit</strong>
                <p>Shipment is moving through the network.</p>
              </div>
            </div>

            <div className="status-progress-item">
              <div className="status-progress-marker">
                <span>2</span>
              </div>
              <div>
                <strong>Out For Delivery</strong>
                <p>Shipment is with the delivery team.</p>
              </div>
            </div>

            <div className="status-progress-item">
              <div className="status-progress-marker">
                <span>3</span>
              </div>
              <div>
                <strong>Delivered</strong>
                <p>Shipment has reached its destination.</p>
              </div>
            </div>
          </div>

          <div className="status-side-note">
            <span>i</span>
            <p>
              Every successful update is saved in the shipment's
              tracking history.
            </p>
          </div>

          {updatedShipment && (
            <div className="status-last-update">
              <span className="status-last-update-label">
                LAST UPDATED SHIPMENT
              </span>

              <strong>
                {updatedShipment.trackingNumber}
              </strong>

              <span>
                AWD: {updatedShipment.awdNumber}
              </span>

              <span>
                Status: {updatedShipment.currentStatus}
              </span>

              <span>
                Location: {updatedShipment.currentLocation}
              </span>

              <span>
                Date: {updatedShipment.currentDate}
              </span>

              <span>
                Time: {updatedShipment.currentTime}
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}