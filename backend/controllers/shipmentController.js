const Shipment = require("../models/Shipment");

/* =====================================
   INDIA DATE, WEEKDAY, TIME & TIMESTAMP
===================================== */

const getIndiaDateTime = () => {
  const now = new Date();
  const timeZone = "Asia/Kolkata";

  const dateParts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(now);

  const getPart = (parts, type) =>
    parts.find((part) => part.type === type)?.value || "";

  const date = `${getPart(dateParts, "day")}/${getPart(
    dateParts,
    "month"
  )}/${getPart(dateParts, "year")}`;

  const day = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "long",
  }).format(now);

  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);

  return {
    date,
    day,
    time,
    timestamp: now,
    timezone: timeZone,
  };
};

/* =====================================
   GENERATE TRACKING NUMBER
===================================== */

const generateTrackingNumber = () => {
  const randomNumber = Math.floor(
    100000 + Math.random() * 900000
  );

  return `SPEED${randomNumber}`;
};

/* =====================================
   GENERATE AWD NUMBER
===================================== */

const generateAWDNumber = () => {
  const randomNumber = Math.floor(
    100000 + Math.random() * 900000
  );

  return `AWD${randomNumber}`;
};

/* =====================================
   GET UNIQUE NUMBERS FOR ONLINE BOOKING
===================================== */

const generateUniqueNumbers = async () => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const trackingNumber = generateTrackingNumber();
    const awdNumber = generateAWDNumber();

    const existingShipment = await Shipment.findOne({
      $or: [
        { trackingNumber },
        { awdNumber },
      ],
    }).select("_id");

    if (!existingShipment) {
      return {
        trackingNumber,
        awdNumber,
      };
    }
  }

  throw new Error(
    "Could not generate unique shipment numbers. Please try again."
  );
};

/* =====================================
   CREATE SHIPMENT
===================================== */

const createShipment = async (req, res) => {
  try {
    const {
      bookingType = "Offline",
      trackingNumber: enteredTrackingNumber,
      awdNumber: enteredAWDNumber,
      senderName,
      senderPhone,
      senderAddress,
      receiverName,
      receiverPhone,
      receiverAddress,
      packageType,
      weight,
      currentLocation,
      currentRemarks,
    } = req.body;

    /* Validate booking type */

    if (!["Online", "Offline"].includes(bookingType)) {
      return res.status(400).json({
        success: false,
        message: "Booking type must be Online or Offline.",
      });
    }

    /* Validate required fields */

    const requiredFields = {
      senderName,
      senderPhone,
      senderAddress,
      receiverName,
      receiverPhone,
      receiverAddress,
      packageType,
      currentLocation,
    };

    const missingField = Object.entries(requiredFields).some(
      ([, value]) =>
        typeof value !== "string" || !value.trim()
    );

    if (missingField) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    /* =====================================
       VALIDATE OPTIONAL WEIGHT
    ===================================== */

    let numericWeight = null;

    const weightIsProvided =
      weight !== undefined &&
      weight !== null &&
      String(weight).trim() !== "";

    if (weightIsProvided) {
      numericWeight = Number(weight);

      if (
        !Number.isFinite(numericWeight) ||
        numericWeight <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Weight must be a positive number when provided.",
        });
      }
    }

    /* =====================================
       TRACKING & AWD NUMBERS
    ===================================== */

    let trackingNumber;
    let awdNumber;

    if (bookingType === "Offline") {
      /* Offline: preserve manually entered numbers */

      trackingNumber = String(
        enteredTrackingNumber || ""
      )
        .trim()
        .toUpperCase();

      awdNumber = String(
        enteredAWDNumber || ""
      )
        .trim()
        .toUpperCase();

      if (!trackingNumber || !awdNumber) {
        return res.status(400).json({
          success: false,
          message:
            "For Offline booking, enter both the Tracking Number and AWD Number.",
        });
      }
    } else {
      /* Online: generate numbers on the backend */

      const generated = await generateUniqueNumbers();

      trackingNumber = generated.trackingNumber;
      awdNumber = generated.awdNumber;
    }

    /* =====================================
       GET INDIA-LOCAL DATE AND TIME
    ===================================== */

    const india = getIndiaDateTime();

    const location = currentLocation.trim();

    const remarks =
      typeof currentRemarks === "string" &&
      currentRemarks.trim()
        ? currentRemarks.trim()
        : "Shipment booked successfully";

    /* =====================================
       PREPARE INITIAL STATUS HISTORY
    ===================================== */

    const initialHistory = {
      status: "In Transit",
      location,
      date: india.date,
      day: india.day,
      time: india.time,
      timestamp: india.timestamp,
      timezone: india.timezone,
      remarks,
    };

    /* =====================================
       PREPARE SHIPMENT DOCUMENT
    ===================================== */

    const shipmentData = {
      bookingType,

      trackingNumber,
      awdNumber,

      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      senderAddress: senderAddress.trim(),

      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverAddress: receiverAddress.trim(),

      packageType: packageType.trim(),

      // Optional: null when the user leaves weight blank
      weight: numericWeight,

      currentStatus: "In Transit",
      currentLocation: location,
      currentDate: india.date,
      currentDay: india.day,
      currentTime: india.time,
      currentTimestamp: india.timestamp,
      timezone: india.timezone,
      currentRemarks: remarks,

      statusHistory: [initialHistory],
    };

    /* =====================================
       SAVE SHIPMENT IN MONGODB
    ===================================== */

    const shipment = await Shipment.create(shipmentData);

    return res.status(201).json({
      success: true,
      message: "Shipment created successfully.",
      shipment,
    });
  } catch (error) {
    console.error("CREATE SHIPMENT ERROR:", error);

    /* Handle duplicate tracking/AWD numbers */

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "The Tracking Number or AWD Number already exists. Check the entered numbers and try again.",
      });
    }

    /* Handle MongoDB validation errors */

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Shipment validation failed.",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating shipment.",
      error: error.message,
    });
  }
};

/* =====================================
   GET ALL SHIPMENTS
===================================== */

const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      count: shipments.length,
      shipments,
    });
  } catch (error) {
    console.error("GET SHIPMENTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching shipments.",
    });
  }
};

/* =====================================
   GET ONE SHIPMENT BY TRACKING OR AWD
===================================== */

const getShipment = async (req, res) => {
  try {
    const number = String(
      req.params.trackingNumber || ""
    )
      .trim()
      .toUpperCase();

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Tracking Number or AWD Number is required.",
      });
    }

    const shipment = await Shipment.findOne({
      $or: [
        { trackingNumber: number },
        { awdNumber: number },
      ],
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

    return res.json({
      success: true,
      shipment,
    });
  } catch (error) {
    console.error("GET SHIPMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while tracking shipment.",
      error: error.message,
    });
  }
};

/* =====================================
   UPDATE SHIPMENT STATUS
===================================== */

const updateShipmentStatus = async (req, res) => {
  try {
    const number = String(
      req.params.trackingNumber || ""
    )
      .trim()
      .toUpperCase();

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Tracking Number or AWD Number is required.",
      });
    }

    const { status, location, remarks } = req.body;

    const allowedStatuses = [
      "In Transit",
      "Out For Delivery",
      "Delivered",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Allowed statuses are: In Transit, Out For Delivery, Delivered.",
      });
    }

    const shipment = await Shipment.findOne({
      $or: [
        { trackingNumber: number },
        { awdNumber: number },
      ],
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

    /* Always record server India-local date and time */

    const india = getIndiaDateTime();

    const updateLocation =
      typeof location === "string" && location.trim()
        ? location.trim()
        : shipment.currentLocation || "N/A";

    const updateRemarks =
      typeof remarks === "string"
        ? remarks.trim()
        : "";

    /* Update current shipment status */

    shipment.currentStatus = status;
    shipment.currentLocation = updateLocation;
    shipment.currentDate = india.date;
    shipment.currentDay = india.day;
    shipment.currentTime = india.time;
    shipment.currentTimestamp = india.timestamp;
    shipment.timezone = india.timezone;
    shipment.currentRemarks = updateRemarks;

    /* Append status history */

    shipment.statusHistory.push({
      status,
      location: updateLocation,
      date: india.date,
      day: india.day,
      time: india.time,
      timestamp: india.timestamp,
      timezone: india.timezone,
      remarks: updateRemarks,
    });

    await shipment.save();

    return res.json({
      success: true,
      message: "Shipment status updated successfully.",
      shipment,
    });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating status.",
      error: error.message,
    });
  }
};

/* =====================================
   EXPORT CONTROLLER FUNCTIONS
===================================== */

module.exports = {
  createShipment,
  getAllShipments,
  getShipment,
  updateShipmentStatus,
};