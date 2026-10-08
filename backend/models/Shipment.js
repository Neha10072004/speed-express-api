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
      required: true,
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

    currentTime: {
      type: String,
      required: true,
    },

    currentRemarks: {
      type: String,
      default: "",
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