
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");
const { Readable } = require("stream");

const Shipment = require("../models/Shipment");
const generateShippingLabel = require("../utils/generateShippingLabel");

const PROOF_BUCKET_NAME = "shipmentProofs";

const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".pdf",
  ".doc",
  ".docx",
];

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

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
   TRACKING AND VALIDATION HELPERS
========================================================= */

const normalizeIdentifier = (value) => {
  if (value === null || value === undefined) return "";

  return String(value).trim().replace(/\s+/g, "").toUpperCase();
};

const clean = (value) => {
  if (value === null || value === undefined) return "";

  return String(value).trim();
};

const validateOptionalNumber = (value) => {
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
   DOCUMENT HELPERS
========================================================= */

const getDocumentExtension = (filename = "") => {
  const lastDot = filename.lastIndexOf(".");

  return lastDot >= 0
    ? filename.substring(lastDot).toLowerCase()
    : "";
};

const isCustomerVisible = (value) =>
  String(value).trim().toLowerCase() === "true";

const validateSupportingDocument = (file) => {
  if (!file) return null;

  const extension = getDocumentExtension(file.originalname);

  if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)) {
    return "Unsupported document format. Allowed formats: JPG, JPEG, PNG, WEBP, PDF, DOC and DOCX.";
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    return "Document size must not exceed 10 MB.";
  }

  if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
    return "Uploaded document data is missing. Please check the upload middleware.";
  }

  return null;
};

/* =========================================================
   GRIDFS PROOF AND DOCUMENT HELPERS
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
      "Uploaded file is missing file data. Check upload middleware."
    );
  }

  const bucket = getProofBucket();

  const originalName = file.originalname || "shipment-document";

  const filename = `${Date.now()}-${String(originalName).replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  )}`;

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: file.mimetype || "application/octet-stream",
      metadata: {
        trackingNumber,
        originalName,
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
  if (!fileId || !mongoose.isValidObjectId(String(fileId))) {
    return;
  }

  await getProofBucket().delete(new ObjectId(String(fileId)));
};

/* =========================================================
   SHIPMENT LOOKUP
========================================================= */

const findShipmentByIdentifier = async (identifier) => {
  const normalizedIdentifier = normalizeIdentifier(identifier);

  if (!normalizedIdentifier) {
    return null;
  }

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
   GET PUBLIC SHIPMENT BY TRACKING NUMBER OR AWD NUMBER
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

    const shipmentData = shipment.toObject();

    // Return only documents explicitly approved for customers.
    // Never expose the GridFS fileId in the public tracking response.
    shipmentData.supportingDocuments = (
      shipment.supportingDocuments || []
    )
      .filter(
        (document) => document.visibleToCustomer === true
      )
      .map((document) => ({
        _id: String(document._id),
        documentId: String(document._id),
        originalName:
          document.originalName ||
          document.filename ||
          "Shipment document",
        filename:
          document.originalName ||
          document.filename ||
          "Shipment document",
        contentType:
          document.contentType || "application/octet-stream",
        size: Number(document.size || 0),
        uploadedAt: document.uploadedAt || null,
      }));

    return res.status(200).json({
      success: true,
      shipment: shipmentData,
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

    for (const field of editableFields) {
      if (hasOwn(req.body, field)) {
        const value = clean(req.body[field]);

        shipment[field] = value;

        if (field === "status" && value) {
          shipment.currentStatus = value;
        }
      }
    }

    if (hasOwn(req.body, "weight")) {
      const weight = validateOptionalNumber(req.body.weight);

      if (weight === null) {
        return res.status(400).json({
          success: false,
          message: "Weight must be a valid number.",
        });
      }

      shipment.weight =
        weight === undefined ? undefined : weight;
    }

    if (hasOwn(req.body, "productCount")) {
      const productCount = validateOptionalNumber(
        req.body.productCount
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

    // Booking date/time edits do not create status-history entries.
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
   EDIT EXISTING STATUS HISTORY ENTRY
   PATCH /api/shipments/:trackingNumber/history/:historyId
========================================================= */

const updateShipmentHistoryEntry = async (req, res) => {
  try {
    const identifier = normalizeIdentifier(
      req.params.trackingNumber
    );

    const { historyId } = req.params;

    if (!identifier || !mongoose.isValidObjectId(historyId)) {
      return res.status(400).json({
        success: false,
        message: "Valid tracking/AWD number and history ID are required.",
      });
    }

    const shipment = await findShipmentByIdentifier(identifier);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

    if (!Array.isArray(shipment.history)) {
      return res.status(404).json({
        success: false,
        message: "No shipment history is available.",
      });
    }

    const entry = shipment.history.id(historyId);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "Selected status-history entry was not found.",
      });
    }

    if (hasOwn(req.body, "status")) {
      const status = clean(req.body.status);

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status cannot be blank.",
        });
      }

      entry.status = status;
    }

    if (hasOwn(req.body, "location")) {
      const location = clean(req.body.location);

      if (!location) {
        return res.status(400).json({
          success: false,
          message: "Location cannot be blank.",
        });
      }

      entry.location = location;
    }

    if (hasOwn(req.body, "remarks")) {
      entry.remarks = clean(req.body.remarks);
    }

    if (hasOwn(req.body, "eventDateTime")) {
      const value = String(req.body.eventDateTime || "").trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message: "Event date and time are required.",
        });
      }

      const timestamp =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
          ? new Date(`${value}:00+05:30`)
          : new Date(value);

      if (Number.isNaN(timestamp.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid event date and time.",
        });
      }

      entry.timestamp = timestamp;
    }

    const latestEntry = shipment.history.reduce((latest, item) => {
      if (!latest) return item;

      return new Date(item.timestamp || 0) >
        new Date(latest.timestamp || 0)
        ? item
        : latest;
    }, null);

    if (
      latestEntry &&
      String(latestEntry._id) === String(entry._id)
    ) {
      shipment.status = entry.status;
      shipment.currentStatus = entry.status;
      shipment.currentLocation = entry.location;
      shipment.remarks = entry.remarks || "";
    }

    shipment.$locals.skipAutomaticHistory = true;

    await shipment.save();

    return res.status(200).json({
      success: true,
      message: "Existing status-history entry updated successfully.",
      shipment,
      historyEntry: entry,
    });
  } catch (error) {
    console.error("Edit shipment history entry error:", error);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status-history information.",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to edit the status-history entry.",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE SHIPMENT STATUS + OPTIONAL SUPPORTING DOCUMENT
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

    if (!Array.isArray(shipment.history)) {
      shipment.history = [];
    }

    if (!Array.isArray(shipment.supportingDocuments)) {
      shipment.supportingDocuments = [];
    }

    // Validate the optional upload before saving it to GridFS.
    if (req.file) {
      const validationError = validateSupportingDocument(req.file);

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const savedFile = await saveProof(
        req.file,
        shipment.trackingNumber
      );

      uploadedProofId = savedFile.fileId.toString();

      // Preserve existing proof-of-delivery behaviour.
      shipment.proofOfDelivery = uploadedProofId;

      // Add a separate supporting document record.
      shipment.supportingDocuments.push({
        fileId: uploadedProofId,
        filename: savedFile.filename,
        originalName: req.file.originalname || savedFile.filename,
        contentType:
          req.file.mimetype || "application/octet-stream",
        size: Number(req.file.size || req.file.buffer.length),
        uploadedAt: new Date(),
        visibleToCustomer: isCustomerVisible(
          req.body.visibleToCustomer
        ),
      });
    }

    shipment.status = status;
    shipment.currentStatus = status;
    shipment.currentLocation = currentLocation;
    shipment.remarks = remarks;

    // Add a NEW status-history entry.
    // Document visibility does not create a separate history event.
    shipment.history.push({
      status,
      location: currentLocation,
      remarks,
      timestamp: eventTimestamp,
    });

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
          "Supporting document cleanup error:",
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
   VIEW / DOWNLOAD CUSTOMER-VISIBLE SUPPORTING DOCUMENTS
========================================================= */

const findCustomerVisibleDocument = (shipment, documentId) => {
  if (!Array.isArray(shipment.supportingDocuments)) {
    return null;
  }

  return (
    shipment.supportingDocuments.find(
      (document) =>
        String(document._id) === String(documentId) &&
        document.visibleToCustomer === true
    ) || null
  );
};

const sendSupportingDocument = async (req, res, disposition) => {
  try {
    const { trackingNumber, documentId } = req.params;

    if (!mongoose.isValidObjectId(documentId)) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    const shipment = await findShipmentByIdentifier(trackingNumber);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

    const document = findCustomerVisibleDocument(
      shipment,
      documentId
    );

    if (
      !document ||
      !document.fileId ||
      !mongoose.isValidObjectId(String(document.fileId))
    ) {
      return res.status(404).json({
        success: false,
        message: "Document not found.",
      });
    }

    const bucket = getProofBucket();
    const fileId = new ObjectId(String(document.fileId));

    const files = await bucket.find({ _id: fileId }).toArray();

    if (!files.length) {
      return res.status(404).json({
        success: false,
        message: "Document file is unavailable.",
      });
    }

    const safeFilename = String(
      document.originalName || "shipment-document"
    ).replace(/[\r\n"]/g, "_");

    res.setHeader(
      "Content-Type",
      document.contentType || "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${safeFilename}"`
    );

    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on("error", (error) => {
      console.error("Supporting document stream error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Unable to retrieve document.",
        });
      } else {
        res.destroy(error);
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error("Supporting document error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Unable to retrieve document.",
      });
    }
  }
};

const viewSupportingDocument = (req, res) =>
  sendSupportingDocument(req, res, "inline");

const downloadSupportingDocument = (req, res) =>
  sendSupportingDocument(req, res, "attachment");

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

    // Delete supporting documents from GridFS when possible.
    const fileIds = new Set();

    if (
      shipment.proofOfDelivery &&
      mongoose.isValidObjectId(String(shipment.proofOfDelivery))
    ) {
      fileIds.add(String(shipment.proofOfDelivery));
    }

    for (const document of shipment.supportingDocuments || []) {
      if (
        document.fileId &&
        mongoose.isValidObjectId(String(document.fileId))
      ) {
        fileIds.add(String(document.fileId));
      }
    }

    for (const fileId of fileIds) {
      try {
        await deleteProof(fileId);
      } catch (fileError) {
        // A missing GridFS file should not prevent shipment deletion.
        console.warn(
          `Could not delete GridFS file ${fileId}:`,
          fileError.message
        );
      }
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
  updateShipmentStatus,
  updateShipmentHistoryEntry,
  getShippingLabel,
  updateShipment,
  deleteShipment,
  getShipmentByTrackingNumber,
  viewSupportingDocument,
  downloadSupportingDocument,
};
