const Shipment = require("../models/Shipment");

/* =========================
   GENERATE TRACKING NUMBER
========================= */

const generateTrackingNumber = () => {
  const randomNumber = Math.floor(
    100000 + Math.random() * 900000
  );

  return `SPEED${randomNumber}`;
};

/* =========================
   GENERATE AWD NUMBER
========================= */

const generateAWDNumber = () => {
  const randomNumber = Math.floor(
    100000 + Math.random() * 900000
  );

  return `AWD${randomNumber}`;
};

/* =========================
   CURRENT DATE
========================= */

const getCurrentDate = () => {
  return new Date().toLocaleDateString("en-IN");
};

/* =========================
   CURRENT TIME
========================= */

const getCurrentTime = () => {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

/* =========================
   CREATE SHIPMENT
========================= */

const createShipment = async (req, res) => {
  try {
    const {
      senderName,
      senderPhone,
      senderAddress,

      receiverName,
      receiverPhone,
      receiverAddress,

      packageType,
      weight,

      currentLocation,
      currentRemarks
    } = req.body;

    /* Required fields */

    if (
      !senderName ||
      !senderPhone ||
      !senderAddress ||
      !receiverName ||
      !receiverPhone ||
      !receiverAddress ||
      !packageType ||
      !weight ||
      !currentLocation
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields."
      });
    }

    /* Validate weight */

    const numericWeight = Number(weight);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid package weight."
      });
    }

    /* Generate tracking numbers */

    const trackingNumber =
      generateTrackingNumber();

    const awdNumber =
      generateAWDNumber();

    /* Date and time */

    const date = getCurrentDate();

    const time = getCurrentTime();

    /* Remarks */

    const remarks =
      currentRemarks ||
      "Shipment booked successfully";

    /* Data for MongoDB */

    const shipmentData = {
      trackingNumber,
      awdNumber,

      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      senderAddress: senderAddress.trim(),

      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverAddress: receiverAddress.trim(),

      packageType: packageType.trim(),
      weight: numericWeight,

      currentStatus: "In Transit",

      currentLocation:
        currentLocation.trim(),

      currentDate: date,
      currentTime: time,

      currentRemarks: remarks.trim(),

      statusHistory: [
        {
          status: "In Transit",

          location:
            currentLocation.trim(),

          date,

          time,

          remarks: remarks.trim()
        }
      ]
    };

    console.log(
      "Creating Shipment:",
      shipmentData
    );

    /* Save to MongoDB */

    const shipment =
      await Shipment.create(
        shipmentData
      );

    console.log(
      "Shipment Created:",
      shipment.trackingNumber
    );

    return res.status(201).json({
      success: true,

      message:
        "Shipment created successfully.",

      shipment
    });

  } catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "CREATE SHIPMENT ERROR"
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Name:",
      error.name
    );

    console.error(
      "Stack:",
      error.stack
    );

    console.error(
      "================================="
    );

    /* Duplicate tracking/AWD */

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Tracking number or AWD number already exists. Please try again."
      });
    }

    /* Validation error */

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          "Shipment validation failed.",
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating shipment.",
      error: error.message
    });
  }
};

/* =========================
   GET ALL SHIPMENTS
========================= */

const getAllShipments = async (
  req,
  res
) => {
  try {

    const shipments =
      await Shipment.find()
        .sort({
          createdAt: -1
        });

    return res.json({
      success: true,

      count:
        shipments.length,

      shipments
    });

  } catch (error) {

    console.error(
      "GET SHIPMENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Server error while fetching shipments."
    });
  }
};

/* =========================
   GET ONE SHIPMENT
   TRACKING OR AWD
========================= */

const getShipment = async (
  req,
  res
) => {
  try {

    const number =
      String(
        req.params.trackingNumber || ""
      )
        .trim()
        .toUpperCase();

    if (!number) {
      return res.status(400).json({
        success: false,
        message:
          "Tracking Number or AWD Number is required."
      });
    }

    const shipment =
      await Shipment.findOne({
        $or: [
          {
            trackingNumber:
              number
          },
          {
            awdNumber:
              number
          }
        ]
      });

    if (!shipment) {
      return res.status(404).json({
        success: false,

        message:
          "Shipment not found."
      });
    }

    return res.json({
      success: true,

      shipment
    });

  } catch (error) {

    console.error(
      "GET SHIPMENT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Server error while tracking shipment.",

      error: error.message
    });
  }
};

/* =========================
   UPDATE SHIPMENT STATUS
========================= */

const updateShipmentStatus =
  async (req, res) => {

    try {

      const number =
        String(
          req.params.trackingNumber || ""
        )
          .trim()
          .toUpperCase();

      if (!number) {
        return res.status(400).json({
          success: false,

          message:
            "Tracking Number or AWD Number is required."
        });
      }

      const {
        status,
        location,
        date,
        time,
        remarks
      } = req.body;

      /* Only these 3 statuses */

      const allowedStatuses = [
        "In Transit",
        "Out For Delivery",
        "Delivered"
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid status. Allowed statuses are: In Transit, Out For Delivery, Delivered."
        });
      }

      /* Find shipment */

      const shipment =
        await Shipment.findOne({
          $or: [
            {
              trackingNumber:
                number
            },
            {
              awdNumber:
                number
            }
          ]
        });

      if (!shipment) {
        return res.status(404).json({
          success: false,

          message:
            "Shipment not found."
        });
      }

      /* Update information */

      const updateDate =
        date ||
        getCurrentDate();

      const updateTime =
        time ||
        getCurrentTime();

      const updateLocation =
        location ||
        shipment.currentLocation ||
        "N/A";

      const updateRemarks =
        remarks || "";

      /* Current status */

      shipment.currentStatus =
        status;

      shipment.currentLocation =
        updateLocation;

      shipment.currentDate =
        updateDate;

      shipment.currentTime =
        updateTime;

      shipment.currentRemarks =
        updateRemarks;

      /* Add history */

      shipment.statusHistory.push({
        status,

        location:
          updateLocation,

        date:
          updateDate,

        time:
          updateTime,

        remarks:
          updateRemarks
      });

      /* Save */

      await shipment.save();

      return res.json({
        success: true,

        message:
          "Shipment status updated successfully.",

        shipment
      });

    } catch (error) {

      console.error(
        "UPDATE STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Server error while updating status.",

        error:
          error.message
      });
    }
  };

/* =========================
   EXPORT
========================= */

module.exports = {
  createShipment,
  getAllShipments,
  getShipment,
  updateShipmentStatus
};