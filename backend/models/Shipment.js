
const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "In Transit",
        "Out For Delivery",
        "Delivered",
      ],
      required: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    date: {
      type: String,
      required: true,
    },

    day: {
      type: String,
      default: "",
    },

    time: {
      type: String,
      required: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const shipmentSchema = new mongoose.Schema(
  {
    bookingType: {
      type: String,
      enum: ["Online", "Offline"],
      required: true,
      default: "Offline",
    },

    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },

    awdNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },

    senderName: {
      type: String,
      required: true,
      trim: true,
    },

    senderPhone: {
      type: String,
      required: true,
      trim: true,
    },

    senderAddress: {
      type: String,
      required: true,
      trim: true,
    },

    receiverName: {
      type: String,
      required: true,
      trim: true,
    },

    receiverPhone: {
      type: String,
      required: true,
      trim: true,
    },

    receiverAddress: {
      type: String,
      required: true,
      trim: true,
    },

    packageType: {
      type: String,
      required: true,
      trim: true,
    },

   weight: {
  type: Number,
  default: null,
  min: 0,
},

    currentStatus: {
      type: String,
      enum: [
        "In Transit",
        "Out For Delivery",
        "Delivered",
      ],
      default: "In Transit",
      required: true,
    },

    currentLocation: {
      type: String,
      required: true,
      trim: true,
    },

    currentDate: {
      type: String,
      required: true,
    },

    currentDay: {
      type: String,
      default: "",
    },

    currentTime: {
      type: String,
      required: true,
    },

    currentTimestamp: {
      type: Date,
      default: Date.now,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },

    currentRemarks: {
      type: String,
      default: "",
      trim: true,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Shipment",
  shipmentSchema
);
