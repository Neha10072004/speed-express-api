import { useState } from "react";
import { createShipment } from "../services/api";

export default function CreateBooking() {

  const [formData, setFormData] = useState({

    senderName: "",
    senderPhone: "",
    senderAddress: "",

    receiverName: "",
    receiverPhone: "",
    receiverAddress: "",

    packageType: "Parcel",
    weight: "",

    currentLocation: "",
    currentRemarks: ""

  });


  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  const [booking, setBooking] =
    useState(null);


  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

  };


  // ==========================================
  // SUBMIT BOOKING
  // ==========================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");
    setBooking(null);


    try {

      const response =
        await createShipment({

          ...formData,

          weight:
            Number(formData.weight)

        });


      if (response.success) {

        setSuccess(
          "Booking created successfully!"
        );

        setBooking(
          response.shipment
        );


        // Reset form

        setFormData({

          senderName: "",
          senderPhone: "",
          senderAddress: "",

          receiverName: "",
          receiverPhone: "",
          receiverAddress: "",

          packageType: "Parcel",
          weight: "",

          currentLocation: "",
          currentRemarks: ""

        });

      } else {

        setError(
          response.message ||
          "Booking creation failed"
        );

      }

    } catch (err) {

      setError(
        err.message ||
        "Something went wrong"
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="create-booking-container">

      <div className="create-booking-card">

        <div className="booking-header">

          <h1>
            Create Booking
          </h1>

          <p>
            Create a new Speed Express shipment
          </p>

        </div>


        {/* SUCCESS */}

        {success && (

          <div className="booking-success">

            ✓ {success}

          </div>

        )}


        {/* ERROR */}

        {error && (

          <div className="booking-error">

            {error}

          </div>

        )}


        {/* GENERATED BOOKING */}

        {booking && (

          <div className="booking-result">

            <h2>
              Booking Created
            </h2>

            <div className="booking-result-grid">

              <div>
                <span>
                  Tracking Number
                </span>

                <strong>
                  {booking.trackingNumber}
                </strong>
              </div>


              <div>
                <span>
                  AWD Number
                </span>

                <strong>
                  {booking.awdNumber}
                </strong>
              </div>


              <div>
                <span>
                  Status
                </span>

                <strong>
                  {booking.currentStatus}
                </strong>
              </div>


              <div>
                <span>
                  Location
                </span>

                <strong>
                  {booking.currentLocation}
                </strong>
              </div>

            </div>

            <p className="tracking-note">

              Give the Tracking Number or AWD Number
              to the customer for tracking.

            </p>

          </div>

        )}


        <form
          onSubmit={handleSubmit}
        >

          {/* ==================================
              SENDER
          ================================== */}

          <div className="form-section">

            <h2>
              Sender Details
            </h2>


            <div className="form-grid">

              <div className="form-group">

                <label>
                  Sender Name *
                </label>

                <input
                  type="text"
                  name="senderName"
                  value={formData.senderName}
                  onChange={handleChange}
                  placeholder="Enter sender name"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Sender Phone *
                </label>

                <input
                  type="tel"
                  name="senderPhone"
                  value={formData.senderPhone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />

              </div>

            </div>


            <div className="form-group">

              <label>
                Sender Address *
              </label>

              <textarea
                name="senderAddress"
                value={formData.senderAddress}
                onChange={handleChange}
                placeholder="Enter complete sender address"
                rows="3"
                required
              />

            </div>

          </div>


          {/* ==================================
              RECEIVER
          ================================== */}

          <div className="form-section">

            <h2>
              Receiver Details
            </h2>


            <div className="form-grid">

              <div className="form-group">

                <label>
                  Receiver Name *
                </label>

                <input
                  type="text"
                  name="receiverName"
                  value={formData.receiverName}
                  onChange={handleChange}
                  placeholder="Enter receiver name"
                  required
                />

              </div>


              <div className="form-group">

                <label>
                  Receiver Phone *
                </label>

                <input
                  type="tel"
                  name="receiverPhone"
                  value={formData.receiverPhone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />

              </div>

            </div>


            <div className="form-group">

              <label>
                Receiver Address *
              </label>

              <textarea
                name="receiverAddress"
                value={formData.receiverAddress}
                onChange={handleChange}
                placeholder="Enter complete receiver address"
                rows="3"
                required
              />

            </div>

          </div>


          {/* ==================================
              PACKAGE
          ================================== */}

          <div className="form-section">

            <h2>
              Package Details
            </h2>


            <div className="form-grid">

              <div className="form-group">

                <label>
                  Package Type *
                </label>

                <select
                  name="packageType"
                  value={formData.packageType}
                  onChange={handleChange}
                  required
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


              <div className="form-group">

                <label>
                  Weight (KG) *
                </label>

                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="Example: 2.5"
                  min="0.01"
                  step="0.01"
                  required
                />

              </div>

            </div>

          </div>


          {/* ==================================
              INITIAL TRACKING DETAILS
          ================================== */}

          <div className="form-section">

            <h2>
              Shipment Details
            </h2>


            <div className="form-group">

              <label>
                Current Location *
              </label>

              <input
                type="text"
                name="currentLocation"
                value={formData.currentLocation}
                onChange={handleChange}
                placeholder="Example: Pune Hub"
                required
              />

            </div>


            <div className="form-group">

              <label>
                Remarks
              </label>

              <textarea
                name="currentRemarks"
                value={formData.currentRemarks}
                onChange={handleChange}
                placeholder="Example: Shipment booked successfully"
                rows="3"
              />

            </div>

          </div>


          {/* ==================================
              SUBMIT
          ================================== */}

          <button
            type="submit"
            className="create-booking-btn"
            disabled={loading}
          >

            {loading
              ? "Creating Booking..."
              : "Create Booking"}

          </button>

        </form>

      </div>

    </div>

  );

}