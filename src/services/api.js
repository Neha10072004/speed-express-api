 
// ============================================================
// SPEED EXPRESS - API SERVICE
// File: src/services/api.js
// ============================================================

export const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://api.speedexp.in/api"
).replace(/\/+$/, "");

// ============================================================
// LOGIN SESSION
// ============================================================

const getLoginUser = () => {
  try {
    const savedUser =
      localStorage.getItem("speedExpressAdmin") ||
      sessionStorage.getItem("speedExpressAdmin");

    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.error("Unable to read login session:", error);
    return null;
  }
};

// ============================================================
// AUTHENTICATION TOKEN
// ============================================================

const getAuthToken = () => {
  const user = getLoginUser();

  if (user?.token) {
    return user.token;
  }

  return (
    localStorage.getItem("speedExpressToken") ||
    sessionStorage.getItem("speedExpressToken") ||
    null
  );
};

// ============================================================
// AUTHENTICATION HEADERS
// ============================================================

const getAuthHeaders = (required = false) => {
  const token = getAuthToken();

  if (required && !token) {
    throw new Error(
      "Authentication token not found. Please log in again."
    );
  }

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};

// ============================================================
// COMMON API REQUEST FUNCTION
// ============================================================

const fetchApi = async (
  url,
  options = {},
  authRequired = false
) => {
  const authHeaders = getAuthHeaders(authRequired);

  const headers = {
    ...authHeaders,
    ...(options.headers || {}),
  };

  // Do not manually set Content-Type for FormData.
  // The browser must generate its multipart boundary.
  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  if (isFormData) {
    delete headers["Content-Type"];
    delete headers["content-type"];
  }

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("API connection error:", error);

    throw new Error(
      "Unable to connect to the Speed Express server. Please check your internet connection."
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  let result;

  if (contentType.includes("application/json")) {
    result = await response.json().catch(() => null);
  } else {
    result = await response.text().catch(() => "");
  }

  if (!response.ok) {
    const message =
      result?.message ||
      result?.error ||
      (typeof result === "string" && result) ||
      `Request failed with HTTP ${response.status}.`;

    const error = new Error(message);
    error.status = response.status;
    error.response = result;

    throw error;
  }

  return result;
};

// ============================================================
// BACKEND HEALTH CHECK
// GET /api/health
// ============================================================

export const checkBackendHealth = async () => {
  return fetchApi(`${API_URL}/health`);
};

// ============================================================
// CREATE SHIPMENT
// POST /api/shipments
// Admin / Staff
// ============================================================

export const createShipment = async (shipmentData) => {
  let body = shipmentData;
  const headers = {
    Accept: "application/json",
  };

  if (
    shipmentData &&
    typeof shipmentData === "object" &&
    !(shipmentData instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(shipmentData);
  }

  return fetchApi(
    `${API_URL}/shipments`,
    {
      method: "POST",
      headers,
      body,
    },
    true
  );
};

// ============================================================
// GET ALL SHIPMENTS
// GET /api/shipments
// Admin / Staff
// ============================================================

export const getAllShipments = async () => {
  return fetchApi(
    `${API_URL}/shipments`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
    true
  );
};

// ============================================================
// GET ONE SHIPMENT
// GET /api/shipments/:identifier
// Public tracking
// ============================================================

export const trackShipment = async (identifier) => {
  if (!identifier || !String(identifier).trim()) {
    throw new Error("Please enter a tracking number or AWD number.");
  }

  return fetchApi(
    `${API_URL}/shipments/${encodeURIComponent(
      String(identifier).trim()
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );
};

// ============================================================
// UPDATE SHIPMENT DETAILS
// PUT /api/shipments/:identifier
// Admin / Staff
// ============================================================

export const updateShipment = async (
  identifier,
  shipmentData
) => {
  if (!identifier) {
    throw new Error("Shipment identifier is required.");
  }

  let body = shipmentData;

  const headers = {
    Accept: "application/json",
  };

  if (
    shipmentData &&
    typeof shipmentData === "object" &&
    !(shipmentData instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(shipmentData);
  }

  return fetchApi(
    `${API_URL}/shipments/${encodeURIComponent(identifier)}`,
    {
      method: "PUT",
      headers,
      body,
    },
    true
  );
};

// ============================================================
// UPDATE SHIPMENT STATUS
// PATCH /api/shipments/:trackingNumber/status
// Admin / Staff
// ============================================================

export const updateShipmentStatus = async (
  identifier,
  status,
  location = "",
  remarks = "",
  proofFile = null,
  eventDateTime = ""
) => {
  if (!identifier) {
    throw new Error("Tracking number is required.");
  }

  if (!status) {
    throw new Error("Shipment status is required.");
  }

  const formData = new FormData();

  formData.append("status", status);
  formData.append("location", location);
  formData.append("remarks", remarks);

  if (eventDateTime) {
    formData.append("eventDateTime", eventDateTime);
  }

  if (proofFile) {
    formData.append("proofFile", proofFile);
  }

  return fetchApi(
    `${API_URL}/shipments/${encodeURIComponent(
      identifier
    )}/status`,
    {
      method: "PATCH",
      body: formData,
    },
    true
  );
};

// ============================================================
// DELETE SHIPMENT
// DELETE /api/shipments/:identifier
// Admin
// ============================================================

export const deleteShipment = async (identifier) => {
  if (!identifier || !String(identifier).trim()) {
    throw new Error("Tracking number, AWD number, or shipment ID is required.");
  }

  return fetchApi(
    `${API_URL}/shipments/${encodeURIComponent(
      String(identifier).trim()
    )}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    },
    true
  );
};

// ============================================================
// GET SHIPPING LABEL
// GET /api/shipments/:identifier/label
// Admin / Staff
// ============================================================

export const getShippingLabel = async (identifier) => {
  if (!identifier) {
    throw new Error("Shipment identifier is required.");
  }

  const headers = getAuthHeaders(true);

  let response;

  try {
    response = await fetch(
      `${API_URL}/shipments/${encodeURIComponent(
        identifier
      )}/label`,
      {
        method: "GET",
        headers,
      }
    );
  } catch (error) {
    console.error("Shipping label request failed:", error);

    throw new Error(
      "Unable to connect to the server to download the shipping label."
    );
  }

  if (!response.ok) {
    const result = await response.json().catch(() => null);

    throw new Error(
      result?.message ||
        `Unable to download shipping label (${response.status}).`
    );
  }

  return response.blob();
};

// ============================================================
// DOWNLOAD SHIPPING LABEL
// ============================================================

export const downloadShippingLabel = async (identifier) => {
  const blob = await getShippingLabel(identifier);

  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = `SpeedExpress-Label-${identifier}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
};

// ============================================================
// PRINT SHIPPING LABEL
// ============================================================

export const printShippingLabel = async (identifier) => {
  const blob = await getShippingLabel(identifier);

  const objectUrl = URL.createObjectURL(blob);

  const printWindow = window.open(
    objectUrl,
    "_blank"
  );

  if (!printWindow) {
    URL.revokeObjectURL(objectUrl);

    throw new Error(
      "The print window was blocked. Please allow pop-ups and try again."
    );
  }

  printWindow.addEventListener("load", () => {
    printWindow.focus();
    printWindow.print();
  });

  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60000);
};

// ============================================================
// EXPORT DEFAULT API OBJECT
// ============================================================

const api = {
  API_URL,
  checkBackendHealth,
  createShipment,
  getAllShipments,
  trackShipment,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
  getShippingLabel,
  downloadShippingLabel,
  printShippingLabel,
};

export default api;
 