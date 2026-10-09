
const Shipment = require("../models/Shipment");

const ALLOWED_STATUSES = [
  "In Transit",
  "Out For Delivery",
  "Delivered",
];

const generateTrackingNumber = () =>
  `SPEED${Math.floor(100000 + Math.random() * 900000)}`;

const generateAWDNumber = () =>
  `AWD${Math.floor(100000 + Math.random() * 900000)}`;

const getCurrentDate = () =>
  new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
  });

const getCurrentTime = () =>
  new Date().toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const normalizeNumber = (value) =>
  String(value || "").trim().toUpperCase();

const createShipment = async (req, res) => {
  try {
    const {
      bookingType = "Offline",
      senderName,
      senderPhone,
      senderAddress,
      receiverName,
      receiverPhone,
      receiverAddress,
      packageType,
      weight,
      currentLocation,
      currentRemarks = "",
    } = req.body;

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

    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !String(value || "").trim())
      .map(([key]) => key);

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
        missingFields,
      });
    }

    if (!["Online", "Offline"].includes(bookingType)) {
      return res.status(400).json({
        success: false,
        message: "bookingType must be Online or Offline.",
      });
    }

    const numericWeight = Number(weight);

    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      return res.status(400).json({
        success: false,
        message: "Weight must be a number greater than zero.",
      });
    }

    // Retry generated numbers if a duplicate is encountered.
    let shipment;
    const date = getCurrentDate();
    const time = getCurrentTime();
    const location = String(currentLocation).trim();
    const remarks = String(currentRemarks || "").trim()
      || "Shipment booked successfully";

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const trackingNumber = generateTrackingNumber();
      const awdNumber = generateAWDNumber();

      try {
        shipment = await Shipment.create({
          bookingType,
          trackingNumber,
          awdNumber,
          senderName: String(senderName).trim(),
          senderPhone: String(senderPhone).trim(),
          senderAddress: String(senderAddress).trim(),
          receiverName: String(receiverName).trim(),
          receiverPhone: String(receiverPhone).trim(),
          receiverAddress: String(receiverAddress).trim(),
          packageType: String(packageType).trim(),
          weight: numericWeight,
          currentStatus: "In Transit",
          currentLocation: location,
          currentDate: date,
          currentTime: time,
          currentRemarks: remarks,
          statusHistory: [
            {
              status: "In Transit",
              location,
              date,
              time,
              remarks,
            },
          ],
        });

        break;
      } catch (error) {
        if (error.code === 11000 && attempt < 4) {
          continue;
        }
        throw error;
      }
    }

    if (!shipment) {
      return res.status(500).json({
        success: false,
        message: "Could not generate unique shipment numbers.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Shipment created successfully.",
      shipment,
    });
  } catch (error) {
    console.error("CREATE SHIPMENT ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A duplicate tracking or AWD number was generated. Please retry.",
      });
    }

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
    });
  }
};

const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      count: shipments.length,
      shipments,
    });
  } catch (error) {
    console.error("GET SHIPMENTS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching shipments.",
    });
  }
};

const getShipment = async (req, res) => {
  try {
    const number = normalizeNumber(req.params.trackingNumber);

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

    return res.json({ success: true, shipment });
  } catch (error) {
    console.error("GET SHIPMENT ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while tracking shipment.",
    });
  }
};

const updateShipmentStatus = async (req, res) => {
  try {
    const number = normalizeNumber(req.params.trackingNumber);

    if (!number) {
      return res.status(400).json({
        success: false,
        message: "Tracking Number or AWD Number is required.",
      });
    }

    const { status, location, date, time, remarks = "" } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be In Transit, Out For Delivery, or Delivered.",
      });
    }

    if (!String(location || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Location is required when updating shipment status.",
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

    const updateDate = String(date || getCurrentDate()).trim();
    const updateTime = String(time || getCurrentTime()).trim();
    const updateLocation = String(location).trim();
    const updateRemarks = String(remarks || "").trim();

    shipment.currentStatus = status;
    shipment.currentLocation = updateLocation;
    shipment.currentDate = updateDate;
    shipment.currentTime = updateTime;
    shipment.currentRemarks = updateRemarks;

    shipment.statusHistory.push({
      status,
      location: updateLocation,
      date: updateDate,
      time: updateTime,
      remarks: updateRemarks,
    });

    await shipment.save();

    return res.json({
      success: true,
      message: "Shipment status updated successfully.",
      shipment,
    });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error while updating shipment status.",
    });
  }
};

module.exports = {
  createShipment,
  getAllShipments,
  getShipment,
  updateShipmentStatus,
};