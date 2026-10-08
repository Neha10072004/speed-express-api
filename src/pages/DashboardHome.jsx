import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllShipments } from "../services/api";

export default function DashboardHome() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     LOAD REAL ORDERS FROM MONGODB
  ===================================================== */

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllShipments();

      console.log(
        "Dashboard API Response:",
        data
      );

      if (
        data &&
        Array.isArray(data.shipments)
      ) {
        setOrders(data.shipments);
      } else {
        setOrders([]);
      }

    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );

      setError(
        error.message ||
        "Unable to load shipment data."
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     LOAD ON PAGE OPEN
  ===================================================== */

  useEffect(() => {
    loadOrders();

    /*
      Automatically refresh every 10 seconds.
      So when you update a shipment status,
      dashboard statistics update automatically.
    */

    const interval = setInterval(() => {
      loadOrders();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalOrders =
    orders.length;

  /*
    Your backend currently has only:
    In Transit
    Out For Delivery
    Delivered

    Therefore Pending = 0.
  */

  const pendingOrders = 0;

  const inTransitOrders =
    orders.filter(
      (order) =>
        order.currentStatus ===
        "In Transit"
    ).length;

  const deliveredOrders =
    orders.filter(
      (order) =>
        order.currentStatus ===
        "Delivered"
    ).length;

  /* =====================================================
     RECENT ORDERS
  ===================================================== */

  const recentOrders =
    [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      )
      .slice(0, 5);

  /* =====================================================
     STATUS CLASS
  ===================================================== */

  const getStatusClass = (status) => {
    if (!status) {
      return "";
    }

    return String(status)
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  return (
    <div className="dashboard-home">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="page-heading">

        <div>
          <div className="admin-page-kicker">
            SPEED EXPRESS
          </div>

          <h2>
            Dashboard
          </h2>

          <p>
            Welcome to Speed Express Admin Panel
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh-btn"
          onClick={loadOrders}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="dashboard-error">
          <strong>
            Unable to load dashboard
          </strong>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={loadOrders}
          >
            Try Again
          </button>
        </div>
      )}

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="dashboard-stats">

        {/* Total Orders */}

        <div className="stat-card">

          <div className="stat-icon">
            📦
          </div>

          <div>
            <span>
              Total Orders
            </span>

            <strong>
              {loading
                ? "—"
                : totalOrders}
            </strong>
          </div>

        </div>

        {/* Pending */}

        <div className="stat-card">

          <div className="stat-icon">
            ⏳
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {loading
                ? "—"
                : pendingOrders}
            </strong>
          </div>

        </div>

        {/* In Transit */}

        <div className="stat-card">

          <div className="stat-icon">
            🚚
          </div>

          <div>
            <span>
              In Transit
            </span>

            <strong>
              {loading
                ? "—"
                : inTransitOrders}
            </strong>
          </div>

        </div>

        {/* Delivered */}

        <div className="stat-card">

          <div className="stat-icon">
            ✅
          </div>

          <div>
            <span>
              Delivered
            </span>

            <strong>
              {loading
                ? "—"
                : deliveredOrders}
            </strong>
          </div>

        </div>

      </div>

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <div className="dashboard-section">

        <div className="section-header">
          <h3>
            Quick Actions
          </h3>
        </div>

        <div className="quick-actions">

          {/* Create Booking */}

          <Link
            to="/admin-dashboard/create-booking"
            className="quick-action-card"
          >
            <span>
              📦
            </span>

            <strong>
              Create Booking
            </strong>

            <small>
              Create a new shipment
            </small>
          </Link>

          {/* View Orders */}

          <Link
            to="/admin-dashboard/orders"
            className="quick-action-card"
          >
            <span>
              📋
            </span>

            <strong>
              View Orders
            </strong>

            <small>
              Manage all bookings
            </small>
          </Link>

          {/* Track Package */}

          <Link
            to="/admin-dashboard/track-package"
            className="quick-action-card"
          >
            <span>
              🚚
            </span>

            <strong>
              Track Package
            </strong>

            <small>
              Check shipment status
            </small>
          </Link>

        </div>

      </div>

      {/* =================================================
          RECENT ORDERS
      ================================================= */}

      <div className="dashboard-section">

        <div className="section-header">

          <div>
            <h3>
              Recent Orders
            </h3>

            <small>
              Latest shipments from MongoDB
            </small>
          </div>

          <Link
            to="/admin-dashboard/orders"
          >
            View All
          </Link>

        </div>

        {/* Loading */}

        {loading ? (

          <div className="empty-state">

            <div>
              ⏳
            </div>

            <h3>
              Loading Orders
            </h3>

            <p>
              Getting the latest shipments...
            </p>

          </div>

        ) : recentOrders.length === 0 ? (

          /* No Orders */

          <div className="empty-state">

            <div>
              📦
            </div>

            <h3>
              No Orders Yet
            </h3>

            <p>
              Create your first booking to see
              it here.
            </p>

            <Link
              to="/admin-dashboard/create-booking"
              className="primary-btn"
            >
              Create Booking
            </Link>

          </div>

        ) : (

          /* =================================================
             ORDERS TABLE
          ================================================= */

          <div className="table-wrapper">

            <table className="admin-table">

              <thead>

                <tr>

                  <th>
                    Tracking No.
                  </th>

                  <th>
                    AWD No.
                  </th>

                  <th>
                    Sender
                  </th>

                  <th>
                    Receiver
                  </th>

                  <th>
                    Package
                  </th>

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

                </tr>

              </thead>

              <tbody>

                {recentOrders.map(
                  (order, index) => (

                    <tr
                      key={
                        order._id ||
                        order.trackingNumber ||
                        index
                      }
                    >

                      {/* Tracking */}

                      <td>

                        <strong>
                          {order.trackingNumber ||
                            "-"}
                        </strong>

                      </td>

                      {/* AWD */}

                      <td>
                        {order.awdNumber ||
                          "-"}
                      </td>

                      {/* Sender */}

                      <td>

                        <div className="order-person">

                          <strong>
                            {order.senderName ||
                              "-"}
                          </strong>

                          {order.senderPhone && (
                            <small>
                              {order.senderPhone}
                            </small>
                          )}

                        </div>

                      </td>

                      {/* Receiver */}

                      <td>

                        <div className="order-person">

                          <strong>
                            {order.receiverName ||
                              "-"}
                          </strong>

                          {order.receiverPhone && (
                            <small>
                              {order.receiverPhone}
                            </small>
                          )}

                        </div>

                      </td>

                      {/* Package */}

                      <td>

                        {order.packageType ||
                          "-"}

                        {order.weight && (
                          <small
                            style={{
                              display:
                                "block",
                              color:
                                "#8995a7",
                              marginTop:
                                "3px"
                            }}
                          >
                            {order.weight} KG
                          </small>
                        )}

                      </td>

                      {/* Status */}

                      <td>

                        <span
                          className={`status-badge ${getStatusClass(
                            order.currentStatus
                          )}`}
                        >

                          {order.currentStatus ||
                            "No Status"}

                        </span>

                      </td>

                      {/* Location */}

                      <td>

                        {order.currentLocation ||
                          "-"}

                      </td>

                      {/* Date */}

                      <td>

                        {order.currentDate ||
                          "-"}

                      </td>

                      {/* Time */}

                      <td>

                        {order.currentTime ||
                          "-"}

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