
const Shipment = require("../models/Shipment");
const generateShippingLabel = require("../utils/generateShippingLabel");

/* =========================================================
   HELPERS
========================================================= */

const findShipmentByIdentifier = async (identifier) => {
  return Shipment.findOne({
    $or: [
      { trackingNumber: identifier },
      { awdNumber: identifier },
    ],
  });
};

const generateTrackingNumber = async () => {
  let trackingNumber;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 20) {
    trackingNumber =
      "SPEED" + Math.floor(100000 + Math.random() * 900000);

    exists = await Shipment.exists({ trackingNumber });
    attempts++;
  }

  if (exists) {
    throw new Error("Unable to generate a unique tracking number.");
  }

  return trackingNumber;
};

/* =========================================================
   CREATE SHIPMENT
   POST /api/shipments
========================================================= */

const createShipment = async (req, res) => {
  try {
    const {
      bookingType = "Offline",
      trackingNumber,
      awdNumber,
      senderName,
      senderPhone,
      senderAddress,
      receiverName,
      receiverPhone,
      receiverAddress,
      packageType,
      weight,
      productCount,
      invoiceNumber,
      eWayBillNumber,
      status = "Shipment Booked",
      currentLocation,
      remarks,
    } = req.body;

    if (
      !senderName ||
      !senderPhone ||
      !senderAddress ||
      !receiverName ||
      !receiverPhone ||
      !receiverAddress
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sender name, phone, address and receiver name, phone, address are required.",
      });
    }

    if (!["Online", "Offline"].includes(bookingType)) {
      return res.status(400).json({
        success: false,
        message: "Booking type must be Online or Offline.",
      });
    }

    let finalTrackingNumber = trackingNumber
      ? String(trackingNumber).trim()
      : "";

    if (bookingType === "Online" && !finalTrackingNumber) {
      finalTrackingNumber = await generateTrackingNumber();
    }

    if (!finalTrackingNumber) {
      return res.status(400).json({
        success: false,
        message: "Tracking number is required for offline bookings.",
      });
    }

    const duplicate = await Shipment.findOne({
      trackingNumber: finalTrackingNumber,
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This tracking number already exists.",
      });
    }

    const shipmentData = {
      bookingType,
      trackingNumber: finalTrackingNumber,
      senderName: String(senderName).trim(),
      senderPhone: String(senderPhone).trim(),
      senderAddress: String(senderAddress).trim(),
      receiverName: String(receiverName).trim(),
      receiverPhone: String(receiverPhone).trim(),
      receiverAddress: String(receiverAddress).trim(),
      packageType,
      status,
      currentLocation: currentLocation || "",
      remarks: remarks || "",
    };

    if (awdNumber) {
      shipmentData.awdNumber = String(awdNumber).trim();
    }

    if (weight !== undefined && weight !== null && weight !== "") {
      const parsedWeight = Number(weight);

      if (!Number.isFinite(parsedWeight) || parsedWeight < 0) {
        return res.status(400).json({
          success: false,
          message: "Weight must be a valid non-negative number.",
        });
      }

      shipmentData.weight = parsedWeight;
    }

    if (
      productCount !== undefined &&
      productCount !== null &&
      productCount !== ""
    ) {
      const parsedCount = Number(productCount);

      if (!Number.isInteger(parsedCount) || parsedCount < 0) {
        return res.status(400).json({
          success: false,
          message: "Product count must be a non-negative integer.",
        });
      }

      shipmentData.productCount = parsedCount;
    }

    if (invoiceNumber !== undefined) {
      shipmentData.invoiceNumber = invoiceNumber;
    }

    if (eWayBillNumber !== undefined) {
      shipmentData.eWayBillNumber = eWayBillNumber;
    }

    const shipment = await Shipment.create(shipmentData);

    return res.status(201).json({
      success: true,
      message: "Shipment booked successfully.",
      shipment,
    });
  } catch (error) {
    console.error("Create shipment error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A shipment with this number already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create shipment.",
      error: error.message,
    });
  }
};

/* =========================================================
   GET ALL SHIPMENTS
   GET /api/shipments
========================================================= */

const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: shipments.length,
      shipments,
    });
  } catch (error) {
    console.error("Get shipments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve shipments.",
      error: error.message,
    });
  }
};

/* =========================================================
   GET SHIPMENT BY TRACKING NUMBER OR AWD NUMBER
   GET /api/shipments/:trackingNumber
========================================================= */

const getShipmentByTrackingNumber = async (req, res) => {
  try {
    const identifier = decodeURIComponent(
      req.params.trackingNumber || ""
    ).trim();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Tracking number or AWD number is required.",
      });
    }

    const shipment = await findShipmentByIdentifier(identifier);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      shipment,
    });
  } catch (error) {
    console.error("Get shipment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve shipment.",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE SHIPMENT DETAILS
   PATCH /api/shipments/:trackingNumber
========================================================= */

const updateShipment = async (req, res) => {
  try {
    const identifier = decodeURIComponent(
      req.params.trackingNumber || ""
    ).trim();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Tracking number or AWD number is required.",
      });
    }

    const shipment = await findShipmentByIdentifier(identifier);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

    // Only these shipment fields may be edited through this endpoint.
    const editableFields = [
      "senderName",
      "senderPhone",
      "senderAddress",
      "receiverName",
      "receiverPhone",
      "receiverAddress",
      "packageType",
      "weight",
      "productCount",
      "invoiceNumber",
      "eWayBillNumber",
      "status",
      "currentLocation",
      "remarks",
      "awdNumber",
    ];

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (
          ["weight", "productCount"].includes(field) &&
          req.body[field] !== "" &&
          req.body[field] !== null
        ) {
          const value = Number(req.body[field]);

          if (!Number.isFinite(value) || value < 0) {
            return res.status(400).json({
              success: false,
              message: `${field} must be a valid non-negative number.`,
            });
          }

          if (field === "productCount" && !Number.isInteger(value)) {
            return res.status(400).json({
              success: false,
              message: "Product count must be a whole number.",
            });
          }

          shipment[field] = value;
        } else {
          shipment[field] = req.body[field];
        }
      }
    }

    await shipment.save();

    return res.status(200).json({
      success: true,
      message: "Shipment updated successfully.",
      shipment,
    });
  } catch (error) {
    console.error("Update shipment error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update shipment.",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE SHIPMENT STATUS
   PATCH /api/shipments/:trackingNumber/status
========================================================= */

const updateShipmentStatus = async (req, res) => {
  try {
    const identifier = decodeURIComponent(
      req.params.trackingNumber || ""
    ).trim();

    const { status, currentLocation, remarks } = req.body;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Tracking number or AWD number is required.",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Shipment status is required.",
      });
    }

    const shipment = await findShipmentByIdentifier(identifier);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

    shipment.status = status;

    if (currentLocation !== undefined) {
      shipment.currentLocation = currentLocation;
    }

    if (remarks !== undefined) {
      shipment.remarks = remarks;
    }

    await shipment.save();

    return res.status(200).json({
      success: true,
      message: "Shipment status updated successfully.",
      shipment,
    });
  } catch (error) {
    console.error("Update shipment status error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update shipment status.",
      error: error.message,
    });
  }
};

// ==================================================
// DELETE SHIPMENT
// ==================================================
const deleteShipment = async (req, res) => {
  try {
    const identifier = decodeURIComponent(
      req.params.trackingNumber || ""
    ).trim();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Tracking number is required.",
      });
    }

    // Find by tracking number or AWD number.
    const shipment = await Shipment.findOne({
      $or: [
        { trackingNumber: identifier },
        { awdNumber: identifier },
      ],
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: `Shipment ${identifier} was not found.`,
      });
    }

    await Shipment.deleteOne({ _id: shipment._id });

    return res.status(200).json({
      success: true,
      message: "Shipment deleted successfully.",
      trackingNumber: shipment.trackingNumber,
    });
  } catch (error) {
    console.error("Delete shipment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete shipment.",
      error: error.message,
    });
  }
};


/* =========================================================
   DOWNLOAD SHIPPING LABEL
   GET /api/shipments/:trackingNumber/label
========================================================= */

const getShippingLabel = async (req, res) => {
  try {
    const identifier = decodeURIComponent(
      req.params.trackingNumber || ""
    ).trim();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Tracking number or AWD number is required.",
      });
    }

    const shipment = await findShipmentByIdentifier(identifier);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

    if (typeof generateShippingLabel !== "function") {
      throw new Error(
        "generateShippingLabel is not exported correctly from utils/generateShippingLabel.js"
      );
    }

    // The label utility must accept (shipment, res) and stream the PDF.
    return await generateShippingLabel(shipment, res);
  } catch (error) {
    console.error("Generate shipping label error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate shipping label.",
        error: error.message,
      });
    }
  }
};

/* =========================================================
   EXPORT CONTROLLER FUNCTIONS
========================================================= */

module.exports = {
  createShipment,
  getAllShipments,
  getShipmentByTrackingNumber,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
  getShippingLabel,
};
