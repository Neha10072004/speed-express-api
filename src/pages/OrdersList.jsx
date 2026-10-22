
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./AdminPages.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const STATUSES = [
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

const getTrackingNumber = (shipment) =>
  shipment?.trackingNumber || shipment?.awdNumber || "";

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getStatusClass = (status = "") => {
  const value = status.toLowerCase();

  if (value.includes("delivered")) return "orders-status-delivered";
  if (value.includes("out for delivery")) return "orders-status-out";
  if (value.includes("cancelled")) return "orders-status-cancelled";
  if (value.includes("delay") || value.includes("breakdown"))
    return "orders-status-warning";
  if (value.includes("transit")) return "orders-status-transit";

  return "orders-status-booked";
};

function OrdersList() {
  const [shipments, setShipments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(null);

  // ==================================================
  // LOAD SHIPMENTS
  // ==================================================
  const fetchShipments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(`${API_BASE_URL}/shipments`);
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message || `Unable to load shipments (${response.status}).`
        );
      }

      const list = Array.isArray(result)
        ? result
        : result?.shipments || result?.data || [];

      if (!Array.isArray(list)) {
        throw new Error("The server returned an unexpected shipment format.");
      }

      setShipments(list);
    } catch (err) {
      console.error("Load shipments failed:", err);
      setError(
        `${err.message || "Unable to load shipments."} API: ${API_BASE_URL}/shipments`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);


  // ==================================================
  // DELETE SHIPMENT
  // ==================================================
  const handleDeleteShipment = async (shipment) => {
    const trackingNumber = getTrackingNumber(shipment);

    // Prefer tracking number, then AWD number, then database ID.
    const identifier =
      trackingNumber ||
      shipment?.awdNumber ||
      shipment?._id;

    if (!identifier) {
      setError(
        "Cannot delete shipment: tracking number, AWD number, and database ID are missing."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete shipment ${identifier}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(String(identifier));
    setError("");
    setNotice("");

    const deleteUrl =
      `${API_BASE_URL}/shipments/${encodeURIComponent(identifier)}`;

    try {
      console.log("DELETE URL:", deleteUrl);
      console.log("Shipment:", shipment);

      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      const result = await response.json().catch(() => null);

      console.log("DELETE STATUS:", response.status);
      console.log("DELETE RESPONSE:", result);

      if (!response.ok) {
        throw new Error(
          result?.message ||
          `Delete failed with HTTP ${response.status}.`
        );
      }

      if (!result || result.success !== true) {
        throw new Error(
          result?.message ||
          "The backend did not confirm that the shipment was deleted."
        );
      }

      // Remove the deleted shipment from the current UI.
      setShipments((current) =>
        current.filter((item) => {
          if (
            shipment._id &&
            item._id &&
            String(item._id) === String(shipment._id)
          ) {
            return false;
          }

          const itemTrackingNumber = getTrackingNumber(item);

          if (
            trackingNumber &&
            itemTrackingNumber &&
            itemTrackingNumber === trackingNumber
          ) {
            return false;
          }

          if (
            shipment.awdNumber &&
            item.awdNumber === shipment.awdNumber
          ) {
            return false;
          }

          return true;
        })
      );

      // Close the selected shipment if it was deleted.
      setSelectedShipment((current) => {
        if (!current) return null;

        const sameId =
          shipment._id &&
          current._id &&
          String(shipment._id) === String(current._id);

        const sameTracking =
          trackingNumber &&
          getTrackingNumber(current) === trackingNumber;

        const sameAwd =
          shipment.awdNumber &&
          current.awdNumber === shipment.awdNumber;

        return sameId || sameTracking || sameAwd
          ? null
          : current;
      });

      setNotice(
        result.message || `Shipment ${identifier} deleted successfully.`
      );

      console.log("Shipment deleted successfully:", identifier);
    } catch (err) {
      console.error("Delete shipment failed:", err);

      setError(
        `${err.message || "Delete failed."} Check the Network tab and backend terminal.`
      );
    } finally {
      setDeletingId("");
    }
  };

  // ==================================================
  // SEARCH AND FILTER
  // ==================================================
  const filteredShipments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return shipments.filter((shipment) => {
      const searchableValues = [
        shipment.trackingNumber,
        shipment.awdNumber,
        shipment.senderName,
        shipment.senderPhone,
        shipment.receiverName,
        shipment.receiverPhone,
        shipment.currentLocation,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === "All" || shipment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shipments, searchTerm, statusFilter]);

  // ==================================================
  // SUMMARY COUNTS
  // ==================================================
  const counts = useMemo(
    () => ({
      total: shipments.length,
      transit: shipments.filter((s) =>
        /in transit/i.test(s.status || "")
      ).length,
      outForDelivery: shipments.filter((s) =>
        /out for delivery/i.test(s.status || "")
      ).length,
      delivered: shipments.filter((s) =>
        /delivered/i.test(s.status || "")
      ).length,
    }),
    [shipments]
  );

  // ==================================================
  // LOADING
  // ==================================================
  if (loading) {
    return (
      <div className="admin-page orders-page">
        <div className="orders-loading">
          <span className="orders-spinner" />
          <h3>Loading shipments...</h3>
          <p>Connecting to the Speed Express API.</p>
        </div>
      </div>
    );
  }

  // ==================================================
  // PAGE
  // ==================================================
  return (
    <div className="admin-page orders-page">
      <div className="admin-page-header orders-page-header">
        <div>
          <span className="orders-eyebrow">SHIPMENT MANAGEMENT</span>
          <h1>Orders</h1>
          <p>View and manage all Speed Express shipment bookings.</p>
        </div>

        <button
          type="button"
          className="orders-refresh-btn"
          disabled={refreshing}
          onClick={() => fetchShipments(true)}
        >
          <span className={refreshing ? "orders-refresh-icon spinning" : "orders-refresh-icon"}>
            ↻
          </span>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {notice && (
        <div className="orders-notice" role="status">
          <span>✓</span>
          {notice}
          <button type="button" onClick={() => setNotice("")}>×</button>
        </div>
      )}

      {error && (
        <div className="orders-error" role="alert">
          <span>!</span>
          <div>
            <strong>Request failed</strong>
            <p>{error}</p>
          </div>
          <button type="button" onClick={() => fetchShipments(true)}>
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="orders-stats-grid">
        <div className="orders-stat-card">
          <div className="orders-stat-icon orders-icon-blue">▤</div>
          <div>
            <p>Total Orders</p>
            <h2>{counts.total}</h2>
            <span>All shipment bookings</span>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon orders-icon-cyan">↗</div>
          <div>
            <p>In Transit</p>
            <h2>{counts.transit}</h2>
            <span>Moving between hubs</span>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon orders-icon-orange">➜</div>
          <div>
            <p>Out For Delivery</p>
            <h2>{counts.outForDelivery}</h2>
            <span>Pending delivery</span>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="orders-stat-icon orders-icon-green">✓</div>
          <div>
            <p>Delivered</p>
            <h2>{counts.delivered}</h2>
            <span>Delivered shipments</span>
          </div>
        </div>
      </div>

      {/* SHIPMENT TABLE */}
      <section className="orders-table-card">
        <div className="orders-table-heading">
          <div>
            <h2>All Shipments</h2>
            <p>
              Showing {filteredShipments.length} of {shipments.length} bookings
            </p>
          </div>
          <span className="orders-live-indicator">
            <span />
            Shipment Records
          </span>
        </div>

        <div className="orders-toolbar">
          <div className="orders-search-box">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search tracking number, sender, receiver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search shipments"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="orders-filter-box">
            <label htmlFor="orders-status-filter">Status:</label>
            <select
              id="orders-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>TRACKING NUMBER</th>
                <th>SENDER</th>
                <th>RECEIVER</th>
                <th>BOOKING DATE</th>
                <th>STATUS</th>
                <th>CURRENT LOCATION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="orders-empty-state">
                      <div>▤</div>
                      <h3>No shipments found</h3>
                      <p>
                        {shipments.length === 0
                          ? "Your bookings will appear here."
                          : "Try a different search or status filter."}
                      </p>
                      {(searchTerm || statusFilter !== "All") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("All");
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => {
                  const trackingNumber = getTrackingNumber(shipment);
                  const identifier = trackingNumber || shipment._id;
                  const isDeleting = deletingId === String(identifier);

                  return (
                    <tr key={shipment._id || identifier}>
                      <td>
                        <div className="orders-tracking-cell">
                          <strong>{trackingNumber || "—"}</strong>
                          <span>{shipment.bookingType || "Offline"} Booking</span>
                        </div>
                      </td>

                      <td>
                        <div className="orders-person-cell">
                          <strong>{shipment.senderName || "—"}</strong>
                          <span>{shipment.senderPhone || "No phone"}</span>
                        </div>
                      </td>

                      <td>
                        <div className="orders-person-cell">
                          <strong>{shipment.receiverName || "—"}</strong>
                          <span>{shipment.receiverPhone || "No phone"}</span>
                        </div>
                      </td>

                      <td>{formatDate(shipment.createdAt || shipment.bookingDate)}</td>

                      <td>
                        <span className={`orders-status-badge ${getStatusClass(shipment.status)}`}>
                          <span className="orders-status-dot" />
                          {shipment.status || "Shipment Booked"}
                        </span>
                      </td>

                      <td>
                        <span className="orders-location">
                          <span aria-hidden="true">⌖</span>
                          {shipment.currentLocation || "Not updated"}
                        </span>
                      </td>

                      <td>
                        <div className="orders-actions">
                          <button
                            type="button"
                            className="orders-view-btn"
                            onClick={() => setSelectedShipment(shipment)}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="orders-delete-btn"
                            disabled={isDeleting || !identifier}
                            onClick={() => handleDeleteShipment(shipment)}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="orders-table-footer">
          <span>
            Total records: <strong>{filteredShipments.length}</strong>
          </span>
          <span>Speed Express Admin</span>
        </div>
      </section>

      {/* SHIPMENT DETAILS MODAL */}
      {selectedShipment && (
        <div
          className="orders-modal-overlay"
          onClick={() => setSelectedShipment(null)}
        >
          <section
            className="orders-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="orders-details-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="orders-modal-header">
              <div>
                <span className="orders-eyebrow">SHIPMENT DETAILS</span>
                <h2 id="orders-details-title">
                  {getTrackingNumber(selectedShipment) || "Shipment"}
                </h2>
              </div>
              <button
                type="button"
                className="orders-modal-close"
                onClick={() => setSelectedShipment(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="orders-details-grid">
              <Detail label="Tracking Number" value={selectedShipment.trackingNumber} />
              <Detail label="AWD Number" value={selectedShipment.awdNumber} />
              <Detail label="Booking Type" value={selectedShipment.bookingType} />
              <Detail label="Package Type" value={selectedShipment.packageType} />
              <Detail
                label="Weight"
                value={selectedShipment.weight != null ? `${selectedShipment.weight} kg` : "—"}
              />
              <Detail label="Product Count" value={selectedShipment.productCount} />
              <Detail label="Sender" value={selectedShipment.senderName} />
              <Detail label="Sender Phone" value={selectedShipment.senderPhone} />
              <Detail label="Sender Address" value={selectedShipment.senderAddress} />
              <Detail label="Receiver" value={selectedShipment.receiverName} />
              <Detail label="Receiver Phone" value={selectedShipment.receiverPhone} />
              <Detail label="Receiver Address" value={selectedShipment.receiverAddress} />
              <Detail label="Status" value={selectedShipment.status} />
              <Detail label="Current Location" value={selectedShipment.currentLocation} />
              <Detail label="Booking Date" value={formatDate(selectedShipment.createdAt || selectedShipment.bookingDate)} />
              <Detail label="Last Updated" value={formatDate(selectedShipment.updatedAt)} />
              <Detail label="Remarks" value={selectedShipment.remarks || "No remarks"} full />
            </div>

            <div className="orders-modal-footer">
              <button
                type="button"
                className="orders-modal-secondary"
                onClick={() => setSelectedShipment(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="orders-delete-btn"
                disabled={deletingId === String(getTrackingNumber(selectedShipment) || selectedShipment._id)}
                onClick={() => handleDeleteShipment(selectedShipment)}
              >
                Delete Shipment
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, full = false }) {
  return (
    <div className={`orders-detail-item ${full ? "orders-detail-full" : ""}`}>
      <span>{label}</span>
      <strong>{value == null || value === "" ? "—" : String(value)}</strong>
    </div>
  );
}

export default OrdersList;
