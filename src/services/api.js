
const API_URL = (
  import.meta.env.VITE_API_URL || "https://api.speedexp.in/api"
).replace(/\/+$/, "");

/* =====================================
   AUTHENTICATION HELPERS
===================================== */

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

const getAuthHeaders = (required = false) => {
  const user = getLoginUser();
  const token = user?.token;

  if (required && !token) {
    throw new Error("Please log in before performing this action.");
  }

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
};

/* =====================================
   COMMON HELPERS
===================================== */

const validateNumber = (value, message) => {
  const number = String(value || "").trim();

  if (!number) {
    throw new Error(message);
  }

  return number;
};

const getShipmentUrl = (number) =>
  `${API_URL}/shipments/${encodeURIComponent(number)}`;

const parseResponse = async (response) => {
  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

const getErrorMessage = (data, fallback) => {
  if (
    data &&
    typeof data === "object" &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return fallback;
};

const fetchApi = async (
  url,
  options = {},
  authRequired = false
) => {
  let response;

  try {
    const headers = {
      ...getAuthHeaders(authRequired),
      ...(options.headers || {}),
    };

    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Cannot connect to Speed Express API at ${API_URL}. ` +
        "Check your internet connection, backend server, and CORS settings."
      );
    }

    throw error;
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        `Request failed with HTTP ${response.status}.`
      )
    );
  }

  return data;
};

/* =====================================
   BACKEND HEALTH CHECK
   Public endpoint
===================================== */

export const checkBackendHealth = async () => {
  return fetchApi(`${API_URL}/health`);
};

/* =====================================
   CREATE SHIPMENT
   Admin + Staff
===================================== */

export const createShipment = async (shipmentData) => {
  try {
    const data = await fetchApi(
      `${API_URL}/shipments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shipmentData),
      },
      true
    );

    console.log("Create Shipment Response:", data);
    return data;
  } catch (error) {
    console.error("createShipment Error:", error);
    throw error;
  }
};

/* =====================================
   GET ALL SHIPMENTS
   Admin + Staff
===================================== */

export const getAllShipments = async () => {
  try {
    const data = await fetchApi(
      `${API_URL}/shipments`,
      {},
      true
    );

    console.log("All Shipments Response:", data);
    return data;
  } catch (error) {
    console.error("getAllShipments Error:", error);
    throw error;
  }
};

/* =====================================
   TRACK SHIPMENT
   TRACKING NUMBER OR AWD NUMBER

   Public endpoint
===================================== */

export const trackShipment = async (trackingNumber) => {
  const number = validateNumber(
    trackingNumber,
    "Please enter Tracking Number or AWD Number."
  );

  try {
    const data = await fetchApi(getShipmentUrl(number));

    console.log("Track Shipment Response:", data);
    return data;
  } catch (error) {
    console.error("trackShipment Error:", error);
    throw error;
  }
};

/* =====================================
   UPDATE SHIPMENT STATUS
   Admin + Staff
===================================== */

export const updateShipmentStatus = async (
  trackingNumber,
  statusData
) => {
  const number = validateNumber(
    trackingNumber,
    "Tracking Number or AWD Number is required."
  );

  const formData = new FormData();

  formData.append("status", statusData.status);
  formData.append("location", statusData.location);
  formData.append("remarks", statusData.remarks || "");
  formData.append("eventDateTime", statusData.eventDateTime);

  if (statusData.proofFile) {
    formData.append("proofFile", statusData.proofFile);
  }

  try {
    return await fetchApi(
      `${API_URL}/shipments/${encodeURIComponent(number)}/status`,
      {
        method: "PATCH",
        body: formData,
      },
      true
    );
  } catch (error) {
    console.error("updateShipmentStatus Error:", error);
    throw error;
  }
};

/* =====================================
   FETCH SHIPPING LABEL PDF
   Admin + Staff
===================================== */

const fetchShippingLabel = async (trackingNumber) => {
  const number = validateNumber(
    trackingNumber,
    "Tracking Number is missing."
  );

  const url = `${getShipmentUrl(number)}/label`;

  let response;

  try {
    response = await fetch(url, {
      headers: getAuthHeaders(true),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Cannot connect to Speed Express API at ${API_URL}.`
      );
    }

    throw error;
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!response.ok) {
    let message =
      `Failed to retrieve shipping label. HTTP ${response.status}.`;

    if (contentType.includes("application/json")) {
      const errorData = await response.json();
      message = getErrorMessage(errorData, message);
    } else {
      const errorText = await response.text();

      if (errorText.trim()) {
        message = errorText;
      }
    }

    throw new Error(message);
  }

  if (!contentType.toLowerCase().includes("application/pdf")) {
    throw new Error(
      "Server did not return a PDF. Check the backend label endpoint."
    );
  }

  const blob = await response.blob();

  if (blob.size === 0) {
    throw new Error("The PDF file is empty.");
  }

  const signature = await blob.slice(0, 5).text();

  if (signature !== "%PDF-") {
    throw new Error("The server returned an invalid PDF file.");
  }

  return { blob, number };
};

/* =====================================
   DOWNLOAD SHIPPING LABEL
===================================== */

export const downloadShippingLabel = async (trackingNumber) => {
  let blobUrl;

  try {
    const { blob, number } =
      await fetchShippingLabel(trackingNumber);

    blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `SpeedExpress-${number}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 5000);

    console.log("Shipping label download started.");
    return true;
  } catch (error) {
    console.error("downloadShippingLabel Error:", error);
    throw error;
  }
};

/* =====================================
   PRINT SHIPPING LABEL
===================================== */

export const printShippingLabel = async (trackingNumber) => {
  let printWindow = null;
  let blobUrl = null;
  let cleanupTimer = null;

  try {
    printWindow = window.open("about:blank", "_blank");

    if (!printWindow) {
      throw new Error(
        "Popup blocked. Allow popups for Speed Express and try again."
      );
    }

    printWindow.document.title = "Speed Express Shipping Label";
    printWindow.document.body.textContent =
      "Preparing shipping label...";

    const result = await fetchShippingLabel(trackingNumber);

    blobUrl = window.URL.createObjectURL(result.blob);
    printWindow.location.replace(blobUrl);

    const activeWindow = printWindow;
    const activeBlobUrl = blobUrl;

    cleanupTimer = window.setInterval(() => {
      if (activeWindow.closed) {
        window.clearInterval(cleanupTimer);
        window.URL.revokeObjectURL(activeBlobUrl);
        cleanupTimer = null;
        blobUrl = null;
      }
    }, 1000);

    return true;
  } catch (error) {
    if (cleanupTimer !== null) {
      window.clearInterval(cleanupTimer);
    }

    if (printWindow && !printWindow.closed) {
      printWindow.close();
    }

    if (blobUrl) {
      window.URL.revokeObjectURL(blobUrl);
    }

    console.error("printShippingLabel Error:", error);
    throw error;
  }
};

/* =====================================
   EXPORT API URL
===================================== */

export { API_URL };
