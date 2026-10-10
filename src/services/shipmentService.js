
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

async function apiRequest(path, options = {}, requiresAuth = false) {
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (requiresAuth) {
    const token = sessionStorage.getItem("speedExpressToken");

    if (!token) {
      throw new Error("Admin authentication required. Please log in again.");
    }

    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Unable to connect to the Speed Express API.");
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    sessionStorage.removeItem("speedExpressToken");
    localStorage.removeItem("speedExpressAdmin");

    throw new Error("Your login session has expired. Please log in again.");
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${response.status}).`);
  }

  return data;
}

export function getAllShipments() {
  return apiRequest("/shipments", {}, true);
}

export function getShipment(trackingNumber) {
  return apiRequest(
    `/shipments/${encodeURIComponent(trackingNumber)}`
  );
}

export function createShipment(shipmentData) {
  return apiRequest(
    "/shipments",
    {
      method: "POST",
      body: JSON.stringify(shipmentData),
    },
    true
  );
}

export function updateShipmentStatus(trackingNumber, statusData) {
  return apiRequest(
    `/shipments/${encodeURIComponent(trackingNumber)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(statusData),
    },
    true
  );
}