
/* ============================================================
   SPEED EXPRESS - API SERVICE
   File: src/services/api.js
============================================================ */

/* ============================================================
   API CONFIGURATION
============================================================ */

export const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://api.speedexp.in/api"
).replace(/\/+$/, "");


/* ============================================================
   LOGIN SESSION
============================================================ */

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


/* ============================================================
   AUTHENTICATION TOKEN
============================================================ */

const getAuthToken = () => {
  const user = getLoginUser();

  if (user?.token) return user.token;

  if (user?.authToken) return user.authToken;

  return (
    localStorage.getItem("speedExpressToken") ||
    sessionStorage.getItem("speedExpressToken") ||
    null
  );
};


/* ============================================================
   AUTHENTICATION HEADERS
============================================================ */

const getAuthHeaders = (required = false) => {
  const token = getAuthToken();

  if (required && !token) {
    throw new Error(
      "Authentication token not found. Please log in again."
    );
  }

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};


/* ============================================================
   COMMON API REQUEST FUNCTION
============================================================ */

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


/* ============================================================
   FILE REQUEST HELPER
   Used for supporting document view and download.
============================================================ */

const fetchSupportingDocument = async (
  url,
  trackingNumber,
  documentId
) => {
  if (!trackingNumber || !documentId) {
    throw new Error(
      "Tracking number and document ID are required."
    );
  }

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        ...getAuthHeaders(false),
        Accept: "*/*",
      },
    });
  } catch (error) {
    console.error("Supporting document request failed:", error);

    throw new Error(
      "Unable to connect to the server to retrieve the document."
    );
  }

  if (!response.ok) {
    const contentType =
      response.headers.get("content-type") || "";

    let message = `Unable to retrieve document (${response.status}).`;

    if (contentType.includes("application/json")) {
      const result = await response.json().catch(() => null);
      message = result?.message || message;
    } else {
      const result = await response.text().catch(() => "");
      if (result) message = result;
    }

    throw new Error(message);
  }

  return response.blob();
};


/* ============================================================
   BACKEND HEALTH CHECK
   GET /api/health
============================================================ */

export const checkBackendHealth = async () => {
  return fetchApi(`${API_URL}/health`);
};


/* ============================================================
   CREATE SHIPMENT
   POST /api/shipments
============================================================ */

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


/* ============================================================
   GET ALL SHIPMENTS
   GET /api/shipments
============================================================ */

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


/* ============================================================
   GET ONE SHIPMENT
   GET /api/shipments/:identifier
   PUBLIC TRACKING
============================================================ */

export const trackShipment = async (identifier) => {
  if (!identifier || !String(identifier).trim()) {
    throw new Error(
      "Please enter a tracking number or AWD number."
    );
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


/* ============================================================
   UPDATE SHIPMENT DETAILS
   PATCH /api/shipments/:identifier
============================================================ */

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
      method: "PATCH",
      headers,
      body,
    },
    true
  );
};


/* ============================================================
   UPDATE SHIPMENT STATUS
   PATCH /api/shipments/:trackingNumber/status
============================================================ */

export const updateShipmentStatus = async (
  identifier,
  statusOrData,
  location = "",
  remarks = "",
  proofFile = null,
  eventDateTime = ""
) => {
  if (!identifier || !String(identifier).trim()) {
    throw new Error("Tracking number is required.");
  }

  let statusData = {};

  // Object format
  if (
    statusOrData &&
    typeof statusOrData === "object" &&
    !(statusOrData instanceof FormData)
  ) {
    statusData = statusOrData;
  } else {
    // Older positional format
    statusData = {
      status: statusOrData,
      location,
      remarks,
      proofFile,
      eventDateTime,
      visibleToCustomer: false,
    };
  }

  const finalStatus = String(
    statusData.status || ""
  ).trim();

  const finalLocation = String(
    statusData.location ||
    statusData.currentLocation ||
    ""
  ).trim();

  const finalRemarks = String(
    statusData.remarks || ""
  ).trim();

  const finalProofFile =
    statusData.proofFile || null;

  const finalEventDateTime =
    statusData.eventDateTime || "";

  const finalVisibleToCustomer =
    statusData.visibleToCustomer === true ||
    String(statusData.visibleToCustomer).toLowerCase() === "true";

  if (!finalStatus) {
    throw new Error("Shipment status is required.");
  }

  if (!finalLocation) {
    throw new Error(
      "Please enter the current shipment location."
    );
  }

  if (finalProofFile && !(finalProofFile instanceof File)) {
    throw new Error("Please select a valid document file.");
  }

  const formData = new FormData();

  formData.append("status", finalStatus);
  formData.append("location", finalLocation);
  formData.append("remarks", finalRemarks);

  if (finalEventDateTime) {
    formData.append("eventDateTime", finalEventDateTime);
  }

  if (finalProofFile) {
    formData.append("proofFile", finalProofFile);

    formData.append(
      "visibleToCustomer",
      String(finalVisibleToCustomer)
    );
  }

  return fetchApi(
    `${API_URL}/shipments/${encodeURIComponent(
      String(identifier).trim()
    )}/status`,
    {
      method: "PATCH",
      body: formData,
    },
    true
  );
};


/* ============================================================
   SUPPORTING DOCUMENT VIEW URL
============================================================ */

export const getSupportingDocumentViewUrl = (
  trackingNumber,
  documentId
) => {
  if (!trackingNumber || !documentId) {
    throw new Error(
      "Tracking number and document ID are required."
    );
  }

  return (
    `${API_URL}/shipments/` +
    `${encodeURIComponent(trackingNumber)}/documents/` +
    `${encodeURIComponent(documentId)}/view`
  );
};


/* ============================================================
   SUPPORTING DOCUMENT DOWNLOAD URL
============================================================ */

export const getSupportingDocumentDownloadUrl = (
  trackingNumber,
  documentId
) => {
  if (!trackingNumber || !documentId) {
    throw new Error(
      "Tracking number and document ID are required."
    );
  }

  return (
    `${API_URL}/shipments/` +
    `${encodeURIComponent(trackingNumber)}/documents/` +
    `${encodeURIComponent(documentId)}/download`
  );
};


/* ============================================================
   VIEW SUPPORTING DOCUMENT
============================================================ */

export const viewSupportingDocument = async (
  trackingNumber,
  documentId
) => {
  const url = getSupportingDocumentViewUrl(
    trackingNumber,
    documentId
  );

  const blob = await fetchSupportingDocument(
    url,
    trackingNumber,
    documentId
  );

  const objectUrl = URL.createObjectURL(blob);

  const newWindow = window.open(
    objectUrl,
    "_blank",
    "noopener,noreferrer"
  );

  if (!newWindow) {
    URL.revokeObjectURL(objectUrl);

    throw new Error(
      "The document window was blocked. Please allow pop-ups and try again."
    );
  }

  // Revoke the temporary URL after the document has had time to load.
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60000);
};


/* ============================================================
   DOWNLOAD SUPPORTING DOCUMENT
============================================================ */

export const downloadSupportingDocument = async (
  trackingNumber,
  documentId,
  filename = "shipment-document"
) => {
  const url = getSupportingDocumentDownloadUrl(
    trackingNumber,
    documentId
  );

  const blob = await fetchSupportingDocument(
    url,
    trackingNumber,
    documentId
  );

  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
};


/* ============================================================
   DELETE SHIPMENT
   DELETE /api/shipments/:identifier
============================================================ */

export const deleteShipment = async (identifier) => {
  if (!identifier || !String(identifier).trim()) {
    throw new Error(
      "Tracking number, AWD number, or shipment ID is required."
    );
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
  

/* ============================================================
   GET SHIPPING LABEL
   GET /api/shipments/:identifier/label
============================================================ */

export const getShippingLabel = async (identifier) => {
  if (!identifier) {
    throw new Error("Shipment identifier is required.");
  }

  const headers = {
    ...getAuthHeaders(true),
    Accept: "application/pdf",
  };

  let response;

  try {
    response = await fetch(
      `${API_URL}/shipments/${encodeURIComponent(identifier)}/label`,
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


/* ============================================================
   DOWNLOAD SHIPPING LABEL
============================================================ */

export const downloadShippingLabel = async (identifier) => {
  const blob = await getShippingLabel(identifier);

  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = `SpeedExpress-Label-${identifier}.pdf`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
};


/* ============================================================
   PRINT SHIPPING LABEL
============================================================ */

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

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60000);
};


/* ============================================================
   EXPORT DEFAULT API OBJECT
============================================================ */

const api = {
  API_URL,

  checkBackendHealth,

  createShipment,
  getAllShipments,
  trackShipment,

  updateShipment,
  updateShipmentStatus,

  getSupportingDocumentViewUrl,
  getSupportingDocumentDownloadUrl,
  viewSupportingDocument,
  downloadSupportingDocument,

  deleteShipment,

  getShippingLabel,
  downloadShippingLabel,
  printShippingLabel,
};

export default api;
