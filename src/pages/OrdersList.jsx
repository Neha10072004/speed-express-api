import React, { useEffect, useState } from "react";
import { getAllShipments } from "../services/api";
import "./AdminPages.css";

export default function OrdersList() {
  const [shipments, setShipments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllShipments();

      const orders =
        response?.shipments ||
        response?.data ||
        response ||
        [];

      setShipments(
        Array.isArray(orders) ? orders : []
      );
    } catch (err) {
      console.error("Orders Error:", err);

      setError(
        err.message || "Failed to load orders."
      );

      setShipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredShipments = shipments.filter(
    (shipment) => {
      const value = search
        .trim()
        .toLowerCase();

      if (!value) {
        return true;
      }

      return (
        String(shipment.trackingNumber || "")
          .toLowerCase()
          .includes(value) ||

        String(shipment.awdNumber || "")
          .toLowerCase()
          .includes(value) ||

        String(shipment.senderName || "")
          .toLowerCase()
          .includes(value) ||

        String(shipment.receiverName || "")
          .toLowerCase()
          .includes(value) ||

        String(shipment.currentLocation || "")
          .toLowerCase()
          .includes(value) ||

        String(shipment.currentStatus || "")
          .toLowerCase()
          .includes(value)
      );
    }
  );

  const totalOrders = shipments.length;

  const inTransit = shipments.filter(
    (item) =>
      item.currentStatus === "In Transit"
  ).length;

  const outForDelivery = shipments.filter(
    (item) =>
      item.currentStatus === "Out For Delivery"
  ).length;

  const delivered = shipments.filter(
    (item) =>
      item.currentStatus === "Delivered"
  ).length;

  const getStatusClass = (status) => {
    if (status === "Delivered") {
      return "order-status delivered";
    }

    if (status === "Out For Delivery") {
      return "order-status out";
    }

    return "order-status transit";
  };

  return (
    <div className="admin-page orders-page">

      {/* HEADER */}
      <div className="admin-page-header">

        <div>
          <div className="admin-page-kicker">
            SHIPMENT MANAGEMENT
          </div>

          <h2>Orders</h2>

          <p>
            View and manage all Speed Express
            shipment bookings.
          </p>
        </div>

        <button
          className="admin-refresh-btn"
          onClick={loadOrders}
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : "↻ Refresh"}
        </button>

      </div>

      {/* ERROR */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <strong>
            Unable to Load Orders
          </strong>

          <p>{error}</p>
        </div>
      )}

      {/* STATISTICS */}
      <div className="orders-stat-grid">

        <div className="orders-stat-card">
          <div className="orders-stat-icon">
            📦
          </div>

          <div>
            <span>Total Orders</span>
            <strong>
              {totalOrders}
            </strong>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon">
            🚚
          </div>

          <div>
            <span>In Transit</span>
            <strong>
              {inTransit}
            </strong>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon">
            🛵
          </div>

          <div>
            <span>Out For Delivery</span>
            <strong>
              {outForDelivery}
            </strong>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon">
            ✓
          </div>

          <div>
            <span>Delivered</span>
            <strong>
              {delivered}
            </strong>
          </div>
        </div>

      </div>

      {/* SEARCH */}
      <div className="orders-search-card">

        <span className="orders-search-icon">
          🔍
        </span>

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search Tracking Number, AWD, Sender, Receiver..."
        />

        {search && (
          <button
            type="button"
            className="orders-clear-btn"
            onClick={() => setSearch("")}
          >
            Clear
          </button>
        )}

      </div>

      {/* TABLE */}
      <div className="orders-table-card">

        <div className="orders-table-header">

          <div>
            <h3>
              Shipment Orders
            </h3>

            <p>
              Showing{" "}
              <strong>
                {filteredShipments.length}
              </strong>{" "}
              of{" "}
              <strong>
                {shipments.length}
              </strong>{" "}
              orders
            </p>
          </div>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="orders-loading">

            <div className="orders-loader"></div>

            <p>
              Loading shipment orders...
            </p>

          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          filteredShipments.length === 0 && (
            <div className="orders-empty">

              <div className="orders-empty-icon">
                📦
              </div>

              <h3>
                No Orders Found
              </h3>

              <p>
                {search
                  ? "No shipment matches your search."
                  : "No shipment bookings have been created yet."}
              </p>

            </div>
          )}

        {/* ORDERS TABLE */}
        {!loading &&
          filteredShipments.length > 0 && (
            <div className="orders-table-wrapper">

              <table className="orders-table">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Tracking</th>
                    <th>AWD</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Package</th>
                    <th>Weight</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th>Time</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredShipments.map(
                    (shipment, index) => (
                      <tr
                        key={
                          shipment._id ||
                          shipment.trackingNumber ||
                          index
                        }
                      >

                        {/* NUMBER */}
                        <td>
                          <span className="order-number">
                            {index + 1}
                          </span>
                        </td>

                        {/* TRACKING */}
                        <td>
                          <div className="order-tracking">

                            <strong>
                              {shipment.trackingNumber ||
                                "-"}
                            </strong>

                            <span>
                              Speed Express
                            </span>

                          </div>
                        </td>

                        {/* AWD */}
                        <td>
                          <span className="order-awd">
                            {shipment.awdNumber ||
                              "-"}
                          </span>
                        </td>

                        {/* SENDER */}
                        <td>
                          <div className="order-person">

                            <strong>
                              {shipment.senderName ||
                                "-"}
                            </strong>

                            <span>
                              {shipment.senderPhone ||
                                "-"}
                            </span>

                          </div>
                        </td>

                        {/* RECEIVER */}
                        <td>
                          <div className="order-person">

                            <strong>
                              {shipment.receiverName ||
                                "-"}
                            </strong>

                            <span>
                              {shipment.receiverPhone ||
                                "-"}
                            </span>

                          </div>
                        </td>

                        {/* PACKAGE */}
                        <td>
                          <span className="order-package">
                            {shipment.packageType ||
                              "-"}
                          </span>
                        </td>

                        {/* WEIGHT */}
                        <td>
                          <strong className="order-weight">
                            {shipment.weight !==
                              undefined &&
                            shipment.weight !==
                              null
                              ? `${shipment.weight} KG`
                              : "-"}
                          </strong>
                        </td>

                        {/* STATUS */}
                        <td>
                          <span
                            className={getStatusClass(
                              shipment.currentStatus
                            )}
                          >
                            <span className="order-status-dot"></span>

                            {shipment.currentStatus ||
                              "-"}
                          </span>
                        </td>

                        {/* LOCATION */}
                        <td>
                          <div className="order-location">

                            <span>📍</span>

                            <strong>
                              {shipment.currentLocation ||
                                "-"}
                            </strong>

                          </div>
                        </td>

                        {/* DATE */}
                        <td>
                          <span className="order-date">
                            {shipment.currentDate ||
                              "-"}
                          </span>
                        </td>

                        {/* TIME */}
                        <td>
                          <span className="order-time">
                            {shipment.currentTime ||
                              "-"}
                          </span>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

      </div>

    </div>
  );
}