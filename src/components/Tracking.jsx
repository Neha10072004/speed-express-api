import React from "react";
import { trackShipment } from "../services/api";
import "./Tracking.css";

export default function Tracking({
  searchNumber,
  setSearchNumber,
  shipment,
  setShipment,
  loading,
  setLoading,
  error,
  setError
}) {
  const handleTrack = async (e) => {
    e.preventDefault();

    const number = searchNumber.trim();

    if (!number) {
      setError(
        "Please enter Tracking Number or AWD Number."
      );
      setShipment(null);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setShipment(null);

      const data = await trackShipment(number);

      console.log(
        "Tracking Result:",
        data
      );

      setShipment(
        data.shipment || data
      );

    } catch (err) {
      console.error(
        "Tracking Error:",
        err
      );

      setError(
        err.message ||
        "Shipment not found."
      );

      setShipment(null);

    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (!status) {
      return "";
    }

    return String(status)
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  return (
    <div className="tracking-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="tracking-page-header">

        <div>

          <span className="tracking-kicker">
            SPEED EXPRESS
          </span>

          <h1>
            Track Your Shipment
          </h1>

          <p>
            Enter your Tracking Number or AWD Number
            to check your shipment status.
          </p>

        </div>

      </div>


      {/* ==================================================
          MAIN TRACKING AREA
      ================================================== */}

      <div className="tracking-layout">

        {/* =================================================
            LEFT SEARCH CARD
        ================================================= */}

        <div className="tracking-search-card">

          <div className="tracking-card-title">
            <span className="tracking-card-icon">
              🔎
            </span>

            <div>
              <h3>
                Track Package
              </h3>

              <p>
                Enter your shipment details
              </p>
            </div>
          </div>


          <form
            onSubmit={handleTrack}
            className="tracking-form"
          >

            <label>
              Tracking / AWD Number
            </label>

            <input
              type="text"
              value={searchNumber}
              onChange={(e) =>
                setSearchNumber(
                  e.target.value
                )
              }
              placeholder="Example: SPEED123456"
            />

            <button
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Tracking..."
                : "Track Shipment"}
            </button>

          </form>


          {/* Error */}

          {error && (

            <div className="tracking-error">

              <strong>
                Shipment Not Found
              </strong>

              <span>
                {error}
              </span>

            </div>

          )}

        </div>


        {/* =================================================
            RIGHT RESULT TABLE
        ================================================= */}

        <div className="tracking-result-card">

          {!shipment && !loading && !error && (

            <div className="tracking-placeholder">

              <div className="tracking-placeholder-icon">
                📦
              </div>

              <h3>
                Shipment Details
              </h3>

              <p>
                Enter a Tracking Number or AWD Number
                to view shipment information.
              </p>

            </div>

          )}


          {loading && (

            <div className="tracking-placeholder">

              <div className="tracking-loading-icon">
                🔄
              </div>

              <h3>
                Searching Shipment
              </h3>

              <p>
                Please wait while we fetch the
                latest shipment information.
              </p>

            </div>

          )}


          {shipment && !loading && (

            <>

              {/* Result Header */}

              <div className="tracking-result-header">

                <div>

                  <span>
                    SHIPMENT DETAILS
                  </span>

                  <h2>
                    {shipment.trackingNumber ||
                      "-"}
                  </h2>

                </div>

                <span
                  className={`tracking-status ${getStatusClass(
                    shipment.currentStatus
                  )}`}
                >
                  <span></span>

                  {shipment.currentStatus ||
                    "No Status"}

                </span>

              </div>


              {/* Main Table */}

              <div className="tracking-table-wrapper">

                <table className="tracking-table">

                  <tbody>

                    <tr>
                      <th>
                        Tracking Number
                      </th>

                      <td>
                        <strong>
                          {shipment.trackingNumber ||
                            "-"}
                        </strong>
                      </td>
                    </tr>


                    <tr>
                      <th>
                        AWD Number
                      </th>

                      <td>
                        {shipment.awdNumber ||
                          "-"}
                      </td>
                    </tr>


                    <tr>
                      <th>
                        Status
                      </th>

                      <td>
                        <span
                          className={`table-status ${getStatusClass(
                            shipment.currentStatus
                          )}`}
                        >
                          {shipment.currentStatus ||
                            "-"}
                        </span>
                      </td>
                    </tr>


                    <tr>
                      <th>
                        Current Location
                      </th>

                      <td>
                        {shipment.currentLocation ||
                          "-"}
                      </td>
                    </tr>


                    <tr>
                      <th>
                        Date
                      </th>

                      <td>
                        {shipment.currentDate ||
                          "-"}
                      </td>
                    </tr>


                    <tr>
                      <th>
                        Time
                      </th>

                      <td>
                        {shipment.currentTime ||
                          "-"}
                      </td>
                    </tr>


                    <tr>
                      <th>
                        Remarks
                      </th>

                      <td>
                        {shipment.currentRemarks ||
                          "No remarks"}
                      </td>
                    </tr>

                  </tbody>

                </table>

              </div>


              {/* Sender / Receiver */}

              <div className="tracking-people-grid">

                <div className="tracking-info-box">

                  <h3>
                    Sender Details
                  </h3>

                  <div className="tracking-info-row">

                    <span>
                      Name
                    </span>

                    <strong>
                      {shipment.senderName ||
                        "-"}
                    </strong>

                  </div>

                  <div className="tracking-info-row">

                    <span>
                      Phone
                    </span>

                    <strong>
                      {shipment.senderPhone ||
                        "-"}
                    </strong>

                  </div>

                  <div className="tracking-info-row">

                    <span>
                      Address
                    </span>

                    <strong>
                      {shipment.senderAddress ||
                        "-"}
                    </strong>

                  </div>

                </div>


                <div className="tracking-info-box">

                  <h3>
                    Receiver Details
                  </h3>

                  <div className="tracking-info-row">

                    <span>
                      Name
                    </span>

                    <strong>
                      {shipment.receiverName ||
                        "-"}
                    </strong>

                  </div>

                  <div className="tracking-info-row">

                    <span>
                      Phone
                    </span>

                    <strong>
                      {shipment.receiverPhone ||
                        "-"}
                    </strong>

                  </div>

                  <div className="tracking-info-row">

                    <span>
                      Address
                    </span>

                    <strong>
                      {shipment.receiverAddress ||
                        "-"}
                    </strong>

                  </div>

                </div>

              </div>


              {/* Package Information */}

              <div className="tracking-package-box">

                <h3>
                  Package Information
                </h3>

                <div className="tracking-package-grid">

                  <div>
                    <span>
                      Package Type
                    </span>

                    <strong>
                      {shipment.packageType ||
                        "-"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Weight
                    </span>

                    <strong>
                      {shipment.weight
                        ? `${shipment.weight} KG`
                        : "-"}
                    </strong>
                  </div>

                </div>

              </div>


              {/* Status History */}

              {shipment.statusHistory &&
                shipment.statusHistory.length > 0 && (

                <div className="tracking-history">

                  <div className="tracking-history-header">

                    <h3>
                      Shipment History
                    </h3>

                    <span>
                      Latest Updates
                    </span>

                  </div>

                  <div className="tracking-history-table-wrapper">

                    <table className="tracking-history-table">

                      <thead>

                        <tr>

                          <th>
                            Status
                          </th>

                          <th>
                            Location
                          </th>

                          <th>
                            Date
                          </th>

                          <th>
                            Time
                          </th>

                          <th>
                            Remarks
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {[
                          ...shipment.statusHistory
                        ]
                          .reverse()
                          .map(
                            (
                              history,
                              index
                            ) => (

                              <tr
                                key={index}
                              >

                                <td>

                                  <span
                                    className={`table-status ${getStatusClass(
                                      history.status
                                    )}`}
                                  >
                                    {history.status}
                                  </span>

                                </td>

                                <td>
                                  {history.location ||
                                    "-"}
                                </td>

                                <td>
                                  {history.date ||
                                    "-"}
                                </td>

                                <td>
                                  {history.time ||
                                    "-"}
                                </td>

                                <td>
                                  {history.remarks ||
                                    "-"}
                                </td>

                              </tr>

                            )
                          )}

                      </tbody>

                    </table>

                  </div>

                </div>

              )}

            </>

          )}

        </div>

      </div>

    </div>
  );
}