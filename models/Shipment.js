
const mongoose = require("mongoose");

const ALLOWED_STATUSES = [
  "In Transit",
  "Out For Delivery",
  "Delivered",
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ALLOWED_STATUSES,
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
    time: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    bookingType: {
      type: String,
      enum: ["Online", "Offline"],
      default: "Offline",
      required: true,
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
      required: true,
      min: 0.01,
    },

    currentStatus: {
      type: String,
      enum: ALLOWED_STATUSES,
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

    currentTime: {
      type: String,
      required: true,
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
  { timestamps: true }
);

module.exports = mongoose.model("Shipment", shipmentSchema);