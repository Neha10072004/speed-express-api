
const Shipment = require("../models/Shipment");
const generateShippingLabel = require("../utils/generateShippingLabel");
const { saveProof, deleteProof } = require("../utils/proofStorage");

/* =========================================================
   HELPERS
========================================================= */

const clean = (value) =>
  value === undefined || value === null
    ? ""
    : String(value).trim();

const normalizeIdentifier = (value) => clean(value).toUpperCase();

const findShipmentByIdentifier = async (identifier) => {
  const number = normalizeIdentifier(identifier);

  if (!number) return null;

  return Shipment.findOne({
    $or: [
      { trackingNumber: number },
      { awdNumber: number },
    ],
  });
};

const identifierExists = async (identifier) => {
  const number = normalizeIdentifier(identifier);

  if (!number) return false;

  return Boolean(
    await Shipment.exists({
      $or: [
        { trackingNumber: number },
        { awdNumber: number },
      ],
    })
  );
};

const generateTrackingNumber = async () => {
  const MAX_ATTEMPTS = 100;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate =
      "SPEED" + Math.floor(100000 + Math.random() * 900000);

    // Check both identifier fields to avoid collisions.
    if (!(await identifierExists(candidate))) {
      return candidate;
    }
  }

  throw new Error(
    "Unable to generate a unique tracking number. Please try again."
  );
};

const duplicateKeyResponse = (error, res) => {
  const keyPattern = error.keyPattern || {};
  const keyValue = error.keyValue || {};
  const duplicateField = Object.keys(keyPattern)[0] || "unknown";
  const duplicateValue = keyValue[duplicateField];

  console.error("MongoDB duplicate-key details:", {
    index: error.index,
    keyPattern,
    keyValue,
    message: error.message,
  });

  if (duplicateField === "trackingNumber") {
    return res.status(409).json({
      success: false,
      field: "trackingNumber",
      value: duplicateValue,
      message: `Tracking number "${duplicateValue || ""}" already exists. Please enter a different tracking number.`,
    });
  }

  if (duplicateField === "awdNumber") {
    return res.status(409).json({
      success: false,
      field: "awdNumber",
      value: duplicateValue,
      message:
        "MongoDB has a unique AWD-number index. AWD should be optional and non-unique. Remove the obsolete AWD unique index in MongoDB Atlas.",
    });
  }

  return res.status(409).json({
    success: false,
    field: duplicateField,
    value: duplicateValue,
    message:
      `Duplicate value detected for database field "${duplicateField}". Check the server log for the MongoDB index details.`,
  });
};

const validateOptionalNumber = (
  value,
  fieldName,
  { integer = false } = {}
) => {
  if (value === undefined || value === null || value === "") {
    return { value: null, error: null };
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0 ||
    (integer && !Number.isInteger(number))
  ) {
    return {
      value: null,
      error: `${fieldName} must be a valid non-negative ${
        integer ? "whole number" : "number"
      }.`,
    };
  }

  return { value: number, error: null };
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
      invoiceNumber = "",
      eWayBillNumber = "",
      status = "Shipment Booked",
      currentLocation = "",
      remarks = "",
    } = req.body;

    if (!["Online", "Offline"].includes(bookingType)) {
      return res.status(400).json({
        success: false,
        message: "Booking type must be Online or Offline.",
      });
    }

    const requiredFields = {
      senderName,
      senderPhone,
      senderAddress,
      receiverName,
      receiverPhone,
      receiverAddress,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !clean(value))
      .map(([field]) => field);

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required sender and receiver fields.",
        fields: missingFields,
      });
    }

    let finalTrackingNumber = normalizeIdentifier(trackingNumber);

    if (bookingType === "Online" && !finalTrackingNumber) {
      finalTrackingNumber = await generateTrackingNumber();
    }

    if (bookingType === "Offline" && !finalTrackingNumber) {
      return res.status(400).json({
        success: false,
        field: "trackingNumber",
        message: "Tracking number is required for offline bookings.",
      });
    }

    // AWD is OPTIONAL. Empty values are not checked for duplicates.
    const finalAwdNumber = normalizeIdentifier(awdNumber);

    // Do not allow a supplied AWD to conflict with another shipment's
    // tracking number or AWD number.
    if (finalAwdNumber) {
      if (finalAwdNumber === finalTrackingNumber) {
        return res.status(409).json({
          success: false,
          field: "awdNumber",
          message: "AWD number and tracking number must be different.",
        });
      }

      const awdDuplicate = await identifierExists(finalAwdNumber);

      if (awdDuplicate) {
        return res.status(409).json({
          success: false,
          field: "awdNumber",
          value: finalAwdNumber,
          message: `AWD number "${finalAwdNumber}" is already assigned to a shipment.`,
        });
      }
    }

    const trackingDuplicate = await Shipment.exists({
      trackingNumber: finalTrackingNumber,
    });

    if (trackingDuplicate) {
      return res.status(409).json({
        success: false,
        field: "trackingNumber",
        value: finalTrackingNumber,
        message: `Tracking number "${finalTrackingNumber}" already exists. Please enter a different tracking number.`,
      });
    }

    // If the supplied tracking number matches an existing AWD, it
    // would make tracking lookups ambiguous. Reject it clearly.
    const trackingMatchesAwd = await Shipment.exists({
      awdNumber: finalTrackingNumber,
    });

    if (trackingMatchesAwd) {
      return res.status(409).json({
        success: false,
        field: "trackingNumber",
        value: finalTrackingNumber,
        message:
          "This tracking number is already being used as an AWD number. Please enter a different tracking number.",
      });
    }

    const checkedWeight = validateOptionalNumber(weight, "Weight");
    if (checkedWeight.error) {
      return res.status(400).json({
        success: false,
        field: "weight",
        message: checkedWeight.error,
      });
    }

    const checkedProductCount = validateOptionalNumber(
      productCount,
      "Product count",
      { integer: true }
    );

    if (checkedProductCount.error) {
      return res.status(400).json({
        success: false,
        field: "productCount",
        message: checkedProductCount.error,
      });
    }

    const shipmentData = {
      bookingType,
      trackingNumber: finalTrackingNumber,
      senderName: clean(senderName),
      senderPhone: clean(senderPhone),
      senderAddress: clean(senderAddress),
      receiverName: clean(receiverName),
      receiverPhone: clean(receiverPhone),
      receiverAddress: clean(receiverAddress),
      packageType: clean(packageType) || "Parcel",
      weight: checkedWeight.value,
      productCount: checkedProductCount.value,
      invoiceNumber: clean(invoiceNumber),
      eWayBillNumber: clean(eWayBillNumber),
      status: clean(status) || "Shipment Booked",
      currentLocation: clean(currentLocation),
      remarks: clean(remarks),
    };

    // Do not store an empty AWD string.
    if (finalAwdNumber) {
      shipmentData.awdNumber = finalAwdNumber;
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
      return duplicateKeyResponse(error, res);
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
      if (
        Object.prototype.hasOwnProperty.call(req.body, field)
      ) {
        const value = clean(req.body[field]);

        shipment[field] = value;

        // Keep both status fields synchronized.
        if (field === "status" && value) {
          shipment.currentStatus = value;
        }
      }
    }

    // Validate and update optional weight.
    if (
      Object.prototype.hasOwnProperty.call(req.body, "weight")
    ) {
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

      shipment.weight = weight;
    }

    // Validate and update optional product count.
    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "productCount"
      )
    ) {
      const productCount = validateOptionalNumber(
        req.body.productCount,
        "productCount"
      );

      if (
        productCount === null ||
        (productCount !== undefined &&
          productCount !== "" &&
          (!Number.isInteger(Number(productCount)) ||
            Number(productCount) < 0))
      ) {
        return res.status(400).json({
          success: false,
          message: "Product count must be a non-negative integer.",
        });
      }

      shipment.productCount =
        productCount === "" || productCount === undefined
          ? undefined
          : Number(productCount);
    }

    // Update AWD number safely.
    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "awdNumber"
      )
    ) {
      const awdNumber = normalizeIdentifier(req.body.awdNumber);

      if (
        awdNumber &&
        awdNumber ===
          normalizeIdentifier(shipment.trackingNumber)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "AWD number must be different from the tracking number.",
        });
      }

      if (awdNumber) {
        const duplicate = await Shipment.findOne({
          _id: { $ne: shipment._id },
          awdNumber: awdNumber,
        });

        if (duplicate) {
          return res.status(409).json({
            success: false,
            message: "This AWD number already exists.",
          });
        }
      }

      shipment.awdNumber = awdNumber || undefined;
    }

    // Persist changes.
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
        message:
          "Please provide a tracking number or AWD number.",
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

    // Save a valid event timestamp.
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

    // Update the current shipment status.
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

    // Avoid duplicate history if your model middleware
    // supports this flag.
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
        message:
          "A duplicate shipment identifier already exists.",
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
    const identifier = normalizeIdentifier(req.params.trackingNumber);

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
    const identifier = normalizeIdentifier(req.params.trackingNumber);

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

module.exports = {
  createShipment,
  getAllShipments,
  getShipmentByTrackingNumber,
  updateShipment,
  updateShipmentStatus,
  deleteShipment,
  getShippingLabel,
};
