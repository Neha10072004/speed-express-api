const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://api.speedexp.in/api";

/* =========================
   CREATE SHIPMENT
========================= */

export const createShipment = async (shipmentData) => {
  try {
    const response = await fetch(
      `${API_URL}/shipments`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(shipmentData),
      }
    );

    const data = await response.json();

    console.log(
      "Create Shipment API Response:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to create booking."
      );
    }

    return data;

  } catch (error) {
    console.error(
      "createShipment API Error:",
      error
    );

    if (
      error instanceof TypeError &&
      error.message === "Failed to fetch"
    ) {
      throw new Error(
        `Cannot connect to Speed Express API at ${API_URL}.`
      );
    }

    throw error;
  }
};


/* =========================
   GET ALL SHIPMENTS
========================= */

export const getAllShipments = async () => {
  try {
    const response = await fetch(
      `${API_URL}/shipments`
    );

    const data = await response.json();

    console.log(
      "Get All Shipments Response:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to get shipments."
      );
    }

    return data;

  } catch (error) {
    console.error(
      "getAllShipments API Error:",
      error
    );

    if (
      error instanceof TypeError &&
      error.message === "Failed to fetch"
    ) {
      throw new Error(
        `Cannot connect to Speed Express API at ${API_URL}.`
      );
    }

    throw error;
  }
};


/* =========================
   TRACK SHIPMENT
   TRACKING NUMBER OR AWD
========================= */

export const trackShipment = async (
  trackingNumber
) => {
  const number = String(
    trackingNumber || ""
  ).trim();

  if (!number) {
    throw new Error(
      "Please enter Tracking Number or AWD Number."
    );
  }

  try {
    const url =
      `${API_URL}/shipments/` +
      encodeURIComponent(number);

    console.log(
      "Tracking Shipment URL:",
      url
    );

    const response = await fetch(url);

    console.log(
      "Tracking Shipment Status:",
      response.status
    );

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    console.log(
      "Tracking Response Content-Type:",
      contentType
    );

    const data =
      contentType.includes(
        "application/json"
      )
        ? await response.json()
        : await response.text();

    console.log(
      "Track Shipment Response:",
      data
    );

    if (!response.ok) {
      if (
        typeof data === "object"
      ) {
        throw new Error(
          data.message ||
            "Shipment not found."
        );
      }

      throw new Error(
        "Shipment not found."
      );
    }

    return data;

  } catch (error) {
    console.error(
      "trackShipment API Error:",
      error
    );

    if (
      error instanceof TypeError &&
      error.message === "Failed to fetch"
    ) {
      throw new Error(
        `Cannot connect to Speed Express API at ${API_URL}.`
      );
    }

    throw error;
  }
};


/* =========================
   UPDATE SHIPMENT STATUS
========================= */

export const updateShipmentStatus = async (
  trackingNumber,
  statusData
) => {
  const number = String(
    trackingNumber || ""
  ).trim();

  if (!number) {
    throw new Error(
      "Tracking Number or AWD Number is required."
    );
  }

  try {
    const url =
      `${API_URL}/shipments/` +
      encodeURIComponent(number) +
      `/status`;

    console.log(
      "Update Status URL:",
      url
    );

    const response = await fetch(
      url,
      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            statusData
          ),
      }
    );

    const data =
      await response.json();

    console.log(
      "Update Status Response:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to update shipment status."
      );
    }

    return data;

  } catch (error) {
    console.error(
      "updateShipmentStatus API Error:",
      error
    );

    if (
      error instanceof TypeError &&
      error.message === "Failed to fetch"
    ) {
      throw new Error(
        `Cannot connect to Speed Express API at ${API_URL}.`
      );
    }

    throw error;
  }
};


/* =========================
   DOWNLOAD SHIPPING LABEL
========================= */

export const downloadShippingLabel =
  async (trackingNumber) => {

    const number = String(
      trackingNumber || ""
    ).trim();

    if (!number) {
      throw new Error(
        "Tracking Number is missing."
      );
    }

    try {
      const url =
        `${API_URL}/shipments/` +
        encodeURIComponent(number) +
        `/label`;

      console.log(
        "================================"
      );

      console.log(
        "DOWNLOAD SHIPPING LABEL"
      );

      console.log(
        "Tracking Number:",
        number
      );

      console.log(
        "API URL:",
        API_URL
      );

      console.log(
        "Label URL:",
        url
      );

      console.log(
        "================================"
      );

      const response =
        await fetch(url);

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      console.log(
        "Response Status:",
        response.status
      );

      console.log(
        "Response Content-Type:",
        contentType
      );

      /* =========================
         ERROR RESPONSE
      ========================= */

      if (!response.ok) {

        if (
          contentType.includes(
            "application/json"
          )
        ) {
          const errorData =
            await response.json();

          throw new Error(
            errorData.message ||
              "Failed to download shipping label."
          );
        }

        throw new Error(
          `Failed to download shipping label. HTTP ${response.status}`
        );
      }

      /* =========================
         CHECK PDF
      ========================= */

      if (
        !contentType.includes(
          "application/pdf"
        )
      ) {
        throw new Error(
          "Server did not return a PDF file."
        );
      }

      /* =========================
         GET PDF BLOB
      ========================= */

      const blob =
        await response.blob();

      if (
        !blob ||
        blob.size === 0
      ) {
        throw new Error(
          "The PDF file is empty."
        );
      }

      console.log(
        "PDF Size:",
        blob.size,
        "bytes"
      );

      /* =========================
         DOWNLOAD PDF
      ========================= */

      const blobUrl =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        blobUrl;

      link.download =
        `SpeedExpress-${number}.pdf`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      /* =========================
         CLEANUP
      ========================= */

      setTimeout(() => {
        window.URL.revokeObjectURL(
          blobUrl
        );
      }, 1000);

      console.log(
        "Shipping label downloaded successfully."
      );

      return true;

    } catch (error) {

      console.error(
        "downloadShippingLabel API Error:",
        error
      );

      if (
        error instanceof TypeError &&
        error.message === "Failed to fetch"
      ) {
        throw new Error(
          `Cannot connect to Speed Express API at ${API_URL}.`
        );
      }

      throw error;
    }
  };


/* =========================
   PRINT SHIPPING LABEL
========================= */

export const printShippingLabel =
  async (trackingNumber) => {

    const number = String(
      trackingNumber || ""
    ).trim();

    if (!number) {
      throw new Error(
        "Tracking Number is missing."
      );
    }

    try {

      const url =
        `${API_URL}/shipments/` +
        encodeURIComponent(number) +
        `/label`;

      console.log(
        "Print Shipping Label URL:",
        url
      );

      const response =
        await fetch(url);

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (!response.ok) {

        if (
          contentType.includes(
            "application/json"
          )
        ) {
          const errorData =
            await response.json();

          throw new Error(
            errorData.message ||
              "Failed to print shipping label."
          );
        }

        throw new Error(
          `Failed to print shipping label. HTTP ${response.status}`
        );
      }

      if (
        !contentType.includes(
          "application/pdf"
        )
      ) {
        throw new Error(
          "Server did not return a PDF file."
        );
      }

      const blob =
        await response.blob();

      if (
        !blob ||
        blob.size === 0
      ) {
        throw new Error(
          "The PDF file is empty."
        );
      }

      const blobUrl =
        window.URL.createObjectURL(
          blob
        );

      const printWindow =
        window.open(
          blobUrl,
          "_blank"
        );

      if (!printWindow) {

        window.URL.revokeObjectURL(
          blobUrl
        );

        throw new Error(
          "Popup blocked. Please allow popups for this website."
        );
      }

      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };

      return true;

    } catch (error) {

      console.error(
        "printShippingLabel API Error:",
        error
      );

      if (
        error instanceof TypeError &&
        error.message === "Failed to fetch"
      ) {
        throw new Error(
          `Cannot connect to Speed Express API at ${API_URL}.`
        );
      }

      throw error;
    }
  };


/* =========================
   API URL EXPORT
========================= */

export { API_URL };