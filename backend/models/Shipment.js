
const mongoose = require("mongoose");

// --------------------------------------------------
// ALLOWED SHIPMENT STATUSES
// Must match shipmentController.js
// --------------------------------------------------

const ALLOWED_STATUSES = [
  "Shipment Booked",
  "Material Received at Origin Office",
  "In Transit to Next Hub",
  "Vehicle Delayed",
  "Out For Delivery",
  "Delivered Successfully",
  "Shipment Cancelled",
  "Delivery Attempted - Customer Unavailable",
  "Vehicle Breakdown",
];

// --------------------------------------------------
// SHIPMENT HISTORY SCHEMA
// Records status and location changes over time
// --------------------------------------------------

const shipmentHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ALLOWED_STATUSES,
      required: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

// --------------------------------------------------
// MAIN SHIPMENT SCHEMA
// --------------------------------------------------

const shipmentSchema = new mongoose.Schema(
  {
    // ----------------------------------------------
    // BOOKING INFORMATION
    // ----------------------------------------------

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
      trim: true,
      index: true,
    },

    awdNumber: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    // ----------------------------------------------
    // SENDER DETAILS
    // ----------------------------------------------

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

    // ----------------------------------------------
    // RECEIVER DETAILS
    // ----------------------------------------------

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

    // ----------------------------------------------
    // PACKAGE DETAILS
    // ----------------------------------------------

    packageType: {
      type: String,
      default: "Parcel",
      trim: true,
    },

    // Weight is optional.
    weight: {
      type: Number,
      default: undefined,
      min: [0, "Weight cannot be negative."],
    },

    productCount: {
      type: Number,
      default: 1,
      min: [1, "Product count must be at least 1."],
    },

    // ----------------------------------------------
    // BILLING DETAILS
    // ----------------------------------------------

    invoiceNumber: {
      type: String,
      default: "",
      trim: true,
    },

    eWayBillNumber: {
      type: String,
      default: "",
      trim: true,
    },

    // ----------------------------------------------
    // SHIPMENT STATUS AND LOCATION
    // ----------------------------------------------

    status: {
      type: String,
      enum: ALLOWED_STATUSES,
      default: "Shipment Booked",
      required: true,
    },

    currentLocation: {
      type: String,
      default: "",
      trim: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    // ----------------------------------------------
    // TRACKING HISTORY
    // ----------------------------------------------

    history: {
      type: [shipmentHistorySchema],
      default: [],
    },

    // ----------------------------------------------
    // OPTIONAL PROOF / DOCUMENT INFORMATION
    // ----------------------------------------------

    proofOfDelivery: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

// --------------------------------------------------
// AUTOMATIC HISTORY ENTRY
// Record the initial status and subsequent changes.
// --------------------------------------------------

shipmentSchema.pre("save", function (next) {
  if (this.isNew) {
    this.history.push({
      status: this.status,
      location: this.currentLocation || "",
      remarks: this.remarks || "Shipment booking created.",
      timestamp: new Date(),
    });
  } else if (
    this.isModified("status") ||
    this.isModified("currentLocation") ||
    this.isModified("remarks")
  ) {
    this.history.push({
      status: this.status,
      location: this.currentLocation || "",
      remarks: this.remarks || "",
      timestamp: new Date(),
    });
  }

  next();
});

// --------------------------------------------------
// EXPORT MODEL
// --------------------------------------------------

module.exports =
  mongoose.models.Shipment ||
  mongoose.model("Shipment", shipmentSchema);
