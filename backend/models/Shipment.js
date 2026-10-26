

const mongoose = require("mongoose");

// --------------------------------------------------
// ALLOWED SHIPMENT STATUSES
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
// NORMALIZE LEGACY STATUS VALUES
// --------------------------------------------------

const normalizeStatus = (value) => {
  if (!value) return "Shipment Booked";

  const status = String(value).trim();

  const legacyStatuses = {
    Delivered: "Delivered Successfully",
    "In Transit": "In Transit to Next Hub",
    Booked: "Shipment Booked",
  };

  const normalized = legacyStatuses[status] || status;

  return ALLOWED_STATUSES.includes(normalized)
    ? normalized
    : "Shipment Booked";
};

// --------------------------------------------------
// SHIPMENT HISTORY SCHEMA
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
    // BOOKING INFORMATION

    bookingType: {
      type: String,
      enum: ["Online", "Offline"],
      default: "Offline",
      required: true,
    },

    trackingNumber: {
      type: String,
      required: [true, "Tracking number is required."],
      unique: true,
      trim: true,
      uppercase: true,
    },

    awdNumber: {
      type: String,
      default: undefined,
      trim: true,
      uppercase: true,

      set: (value) => {
        if (value === undefined || value === null) {
          return undefined;
        }

        const cleaned = String(value).trim().toUpperCase();

        return cleaned || undefined;
      },
    },

    // SENDER DETAILS

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

    // RECEIVER DETAILS

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

    // PACKAGE DETAILS

    packageType: {
      type: String,
      default: "Parcel",
      trim: true,
    },

    weight: {
      type: Number,
      default: undefined,
      min: [0, "Weight cannot be negative."],
    },

    productCount: {
      type: Number,
      default: 1,
      min: [1, "Product count must be at least 1."],
      validate: {
        validator: (value) =>
          value === undefined ||
          value === null ||
          Number.isInteger(value),
        message: "Product count must be a whole number.",
      },
    },

    // BILLING DETAILS

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

    // SHIPMENT STATUS
    // "status" is the primary source of truth.

    status: {
      type: String,
      enum: ALLOWED_STATUSES,
      default: "Shipment Booked",
      required: true,
    },

    // Compatibility field for existing frontend code.

    currentStatus: {
  type: String,
  enum: ALLOWED_STATUSES,
  default: "Shipment Booked",
  trim: true,
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

    // TRACKING HISTORY

    history: {
  type: [
    new mongoose.Schema(
      {
        status: {
          type: String,
          required: true,
        },
        location: {
          type: String,
          default: "",
        },
        remarks: {
          type: String,
          default: "",
        },
        timestamp: {
          type: Date,
          default: Date.now,
          required: true,
        },
      },
      { _id: true }
    ),
  ],
  default: [],
},

    // PROOF OF DELIVERY

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
// STATUS SYNCHRONIZATION + AUTOMATIC HISTORY
// --------------------------------------------------

shipmentSchema.pre("save", function (next) {
  try {
    // Normalize older status values and keep both fields aligned.
    const normalizedStatus = normalizeStatus(this.status);

    this.status = normalizedStatus;
    this.currentStatus = normalizedStatus;

    // Avoid duplicate history when the controller already
    // appended the status event.
    if (this.$locals.skipAutomaticHistory) {
      this.$locals.skipAutomaticHistory = false;
      return next();
    }

    // Add the initial booking history.
    if (this.isNew) {
      this.history.push({
        status: this.status,
        location: this.currentLocation || "",
        remarks:
          this.remarks || "Shipment booking created.",
        timestamp: new Date(),
      });
    } else if (
      this.isModified("status") ||
      this.isModified("currentLocation") ||
      this.isModified("remarks")
    ) {
      // Add history when shipment status details change.
      this.history.push({
        status: this.status,
        location: this.currentLocation || "",
        remarks: this.remarks || "",
        timestamp: new Date(),
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
});

// --------------------------------------------------
// EXPORT MODEL
// --------------------------------------------------

module.exports =
  mongoose.models.Shipment ||
  mongoose.model("Shipment", shipmentSchema);

