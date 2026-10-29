
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");
const { Readable } = require("stream");

const Shipment = require("../models/Shipment");
const generateShippingLabel = require("../utils/generateShippingLabel");

const PROOF_BUCKET_NAME = "shipmentProofs";

/* =========================================================
   INDIA DATE/TIME HELPERS
========================================================= */

const getIndiaBookingDateTime = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    bookingDate: `${values.year}-${values.month}-${values.day}`,
    bookingTime: `${values.hour}:${values.minute}`,
  };
};

const hasOwn = (object, field) =>
  Object.prototype.hasOwnProperty.call(object, field);

/* =========================================================
   MISSING HELPER FUNCTIONS — TRACKING AND VALIDATION FIX
========================================================= */

// Normalize tracking/AWD identifiers so spaces and letter case
// do not matter.
const normalizeIdentifier = (value) => {
  if (value === null || value === undefined) return "";

  return String(value).trim().replace(/\s+/g, "").toUpperCase();
};

// Convert optional text to a trimmed string.
const clean = (value) => {
  if (value === null || value === undefined) return "";

  return String(value).trim();
};

// Validate optional non-negative numeric fields.
// Returns undefined for blank input and null for invalid input.
const validateOptionalNumber = (value, fieldName) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const normalizeOptionalString = (value) => {
  if (value === null || value === undefined) return null;

  const normalized = String(value).trim();

  return normalized === "" ? null : normalized;
};

const validateBookingDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  (() => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  })();

const validateBookingTime = (value) =>
  typeof value === "string" &&
  /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

/* =========================================================
   GRIDFS PROOF HELPERS
========================================================= */

const getProofBucket = () => {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  return new GridFSBucket(db, {
    bucketName: PROOF_BUCKET_NAME,
  });
};

const saveProof = async (file, trackingNumber) => {
  if (!file || !file.buffer) {
    throw new Error(
      "Uploaded proof is missing file data. Check upload middleware."
    );
  }

  const bucket = getProofBucket();

  const filename = `${Date.now()}-${String(
    file.originalname || "shipment-proof"
  ).replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: file.mimetype || "application/octet-stream",
      metadata: {
        trackingNumber,
        originalName: file.originalname || filename,
      },
    });

    uploadStream.once("error", reject);

    uploadStream.once("finish", () => {
      resolve({
        fileId: uploadStream.id,
        filename,
      });
    });

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

const deleteProof = async (fileId) => {
  if (!fileId) return;

  const id = new ObjectId(String(fileId));

  await getProofBucket().delete(id);
};

/* =========================================================
   SHIPMENT LOOKUP
========================================================= */

const findShipmentByIdentifier = async (identifier) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

  // Use normalized values to search tracking and AWD numbers.
  // Existing database values are expected to be stored normalized.
  return Shipment.findOne({
    $or: [
      { trackingNumber: normalizedIdentifier },
      { awdNumber: normalizedIdentifier },
    ],
  });
};

/* =========================================================
   TRACKING NUMBER GENERATOR
========================================================= */

const generateTrackingNumber = async () => {
  for (let attempt = 0; attempt < 50; attempt++) {
    const trackingNumber =
      "SPEED" + Math.floor(100000 + Math.random() * 900000);

    const exists = await Shipment.exists({ trackingNumber });

    if (!exists) {
      return trackingNumber;
    }
  }

  throw new Error("Unable to generate a unique tracking number.");
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
      packageType = "Parcel",
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
      ? normalizeIdentifier(trackingNumber)
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

    // If a booking date/time is omitted, use current India date/time.
    // If explicitly blank, store null.
    const indiaNow = getIndiaBookingDateTime();

    const bookingDate = hasOwn(req.body, "bookingDate")
      ? normalizeOptionalString(req.body.bookingDate)
      : indiaNow.bookingDate;

    const bookingTime = hasOwn(req.body, "bookingTime")
      ? normalizeOptionalString(req.body.bookingTime)
      : indiaNow.bookingTime;

    if (bookingDate !== null && !validateBookingDate(bookingDate)) {
      return res.status(400).json({
        success: false,
        message: "Booking date must be a valid YYYY-MM-DD date.",
      });
    }

    if (bookingTime !== null && !validateBookingTime(bookingTime)) {
      return res.status(400).json({
        success: false,
        message: "Booking time must be in HH:mm format.",
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
      bookingDate,
      bookingTime,
    };

    if (awdNumber !== undefined) {
      shipmentData.awdNumber = normalizeOptionalString(awdNumber);
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
    const identifier = normalizeIdentifier(req.params.trackingNumber);

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Please provide a tracking number.",
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
    const identifier = normalizeIdentifier(req.params.trackingNumber);

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Please provide a tracking number or AWD number.",
      });
    }

    const shipment = await findShipmentByIdentifier(identifier);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

    const editableFields = [
      "senderName",
      "senderPhone",
      "senderAddress",
      "receiverName",
      "receiverPhone",
      "receiverAddress",
      "packageType",
      "invoiceNumber",
      "eWayBillNumber",
      "status",
      "currentLocation",
      "remarks",
    ];

    // Update permitted fields only.
    for (const field of editableFields) {
      if (hasOwn(req.body, field)) {
        const value = clean(req.body[field]);

        shipment[field] = value;

        // Keep both status fields synchronized.
        if (field === "status" && value) {
          shipment.currentStatus = value;
        }
      }
    }

    // Validate and update optional weight.
    if (hasOwn(req.body, "weight")) {
      const weight = validateOptionalNumber(
        req.body.weight,
        "weight"
      );

      if (weight === null) {
        return res.status(400).json({
          success: false,
          message: "Weight must be a valid number.",
        });
      }

      if (weight === undefined) {
        shipment.weight = undefined;
      } else {
        shipment.weight = weight;
      }
    }

    // Validate and update optional product count.
    if (hasOwn(req.body, "productCount")) {
      const productCount = validateOptionalNumber(
        req.body.productCount,
        "productCount"
      );

      if (
        productCount === null ||
        (productCount !== undefined &&
          (!Number.isInteger(Number(productCount)) ||
            Number(productCount) < 0))
      ) {
        return res.status(400).json({
          success: false,
          message: "Product count must be a non-negative integer.",
        });
      }

      shipment.productCount =
        productCount === undefined
          ? undefined
          : Number(productCount);
    }

    // Update booking date when supplied.
    if (hasOwn(req.body, "bookingDate")) {
      const bookingDate = normalizeOptionalString(
        req.body.bookingDate
      );

      if (bookingDate !== null && !validateBookingDate(bookingDate)) {
        return res.status(400).json({
          success: false,
          message: "Booking date must be a valid YYYY-MM-DD date.",
        });
      }

      shipment.bookingDate = bookingDate;
    }

    // Update booking time when supplied.
    if (hasOwn(req.body, "bookingTime")) {
      const bookingTime = normalizeOptionalString(
        req.body.bookingTime
      );

      if (bookingTime !== null && !validateBookingTime(bookingTime)) {
        return res.status(400).json({
          success: false,
          message: "Booking time must be in HH:mm format.",
        });
      }

      shipment.bookingTime = bookingTime;
    }

    // Update AWD number safely. AWD is optional.
    if (hasOwn(req.body, "awdNumber")) {
      const awdNumber = normalizeIdentifier(req.body.awdNumber);

      if (
        awdNumber &&
        awdNumber === normalizeIdentifier(shipment.trackingNumber)
      ) {
        return res.status(400).json({
          success: false,
          message: "AWD number must be different from the tracking number.",
        });
      }

      if (awdNumber) {
        const duplicate = await Shipment.findOne({
          _id: { $ne: shipment._id },
          awdNumber,
        });

        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: "This AWD number already exists.",
          });
        }

        shipment.awdNumber = awdNumber;
      } else {
        shipment.awdNumber = undefined;
      }
    }

    // Do not add a status-history event for booking date/time edits.
    await shipment.save();

    return res.status(200).json({
      success: true,
      message: "Shipment updated successfully.",
      shipment,
    });
  } catch (error) {
    console.error("Update shipment error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A shipment with this tracking number or AWD number already exists.",
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipment details.",
        error: error.message,
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
  let uploadedProofId = null;
  let shipmentSaved = false;

  try {
    const identifier = normalizeIdentifier(
      req.params.trackingNumber
    );

    const status = clean(req.body.status);

    const currentLocation = clean(
      req.body.location ?? req.body.currentLocation
    );

    const remarks = clean(req.body.remarks);
    const eventDateTime = req.body.eventDateTime;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Please provide a tracking number or AWD number.",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Please select a shipment status.",
      });
    }

    if (!currentLocation) {
      return res.status(400).json({
        success: false,
        message: "Please enter the current shipment location.",
      });
    }

    const eventTimestamp =
      eventDateTime && String(eventDateTime).trim()
        ? new Date(eventDateTime)
        : new Date();

    if (Number.isNaN(eventTimestamp.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid status event date/time.",
      });
    }

    const shipment = await findShipmentByIdentifier(identifier);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

    // Ensure history exists before appending a new event.
    if (!Array.isArray(shipment.history)) {
      shipment.history = [];
    }

    // Save optional proof of delivery.
    if (req.file) {
      const proof = await saveProof(
        req.file,
        shipment.trackingNumber
      );

      uploadedProofId = proof.fileId.toString();
      shipment.proofOfDelivery = uploadedProofId;
    }

    // Update current shipment status.
    shipment.status = status;
    shipment.currentStatus = status;
    shipment.currentLocation = currentLocation;
    shipment.remarks = remarks;

    // Append a new event without deleting older events.
    shipment.history.push({
      status,
      location: currentLocation,
      remarks,
      timestamp: eventTimestamp,
    });

    // Prevent automatic duplicate history if supported by model middleware.
    shipment.$locals.skipAutomaticHistory = true;

    await shipment.save();
    shipmentSaved = true;

    return res.status(200).json({
      success: true,
      message: "Shipment status updated successfully.",
      shipment,
    });
  } catch (error) {
    console.error("Update shipment status error:", error);

    if (uploadedProofId && !shipmentSaved) {
      try {
        await deleteProof(uploadedProofId);
      } catch (cleanupError) {
        console.error(
          "Proof cleanup error:",
          cleanupError.message
        );
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A duplicate shipment identifier already exists.",
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipment status information.",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update shipment status.",
      error: error.message,
    });
  }
};

/* =========================================================
   DELETE SHIPMENT
   DELETE /api/shipments/:trackingNumber
========================================================= */

const deleteShipment = async (req, res) => {
  try {
    const identifier = normalizeIdentifier(
      req.params.trackingNumber
    );

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Tracking number is required.",
      });
    }

    const shipment = await findShipmentByIdentifier(identifier);

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
    const identifier = normalizeIdentifier(
      req.params.trackingNumber
    );

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Tracking number is required.",
      });
    }

    const shipment = await findShipmentByIdentifier(identifier);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

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
   EXPORT CONTROLLERS
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