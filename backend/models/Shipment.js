
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

    // IMPORTANT:
    // Connects the uploaded document to this exact history scan.
    // Without this field, Mongoose may remove supportingDocumentId
    // when saving the history subdocument.
    supportingDocumentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: false,
    strict: true,
  }
);

// --------------------------------------------------
// SUPPORTING DOCUMENT SCHEMA
// --------------------------------------------------

const supportingDocumentSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    originalName: {
      type: String,
      default: "",
      trim: true,
    },

    filename: {
      type: String,
      default: "",
      trim: true,
    },

    contentType: {
      type: String,
      default: "application/octet-stream",
    },

    size: {
      type: Number,
      default: 0,
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Only documents marked true are returned by public tracking.
    visibleToCustomer: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  }
);

// --------------------------------------------------
// SHIPMENT SCHEMA
// --------------------------------------------------

const shipmentSchema = new mongoose.Schema(
  {
    // ----------------------------------------------
    // BOOKING INFORMATION
    // ----------------------------------------------

    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    awdNumber: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    bookingType: {
      type: String,
      enum: ["Online", "Offline"],
      default: "Offline",
    },

    bookingDate: {
      type: Date,
      default: Date.now,
    },

    bookingTime: {
      type: String,
      default: "",
      trim: true,
    },

    // ----------------------------------------------
    // SENDER INFORMATION
    // ----------------------------------------------

    senderName: {
      type: String,
      default: "",
      trim: true,
    },

    senderCompany: {
      type: String,
      default: "",
      trim: true,
    },

    senderPhone: {
      type: String,
      default: "",
      trim: true,
    },

    senderEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    senderAddress: {
      type: String,
      default: "",
      trim: true,
    },

    senderCity: {
      type: String,
      default: "",
      trim: true,
    },

    senderState: {
      type: String,
      default: "",
      trim: true,
    },

    senderPincode: {
      type: String,
      default: "",
      trim: true,
    },

    // ----------------------------------------------
    // RECEIVER INFORMATION
    // ----------------------------------------------

    receiverName: {
      type: String,
      default: "",
      trim: true,
    },

    receiverCompany: {
      type: String,
      default: "",
      trim: true,
    },

    receiverPhone: {
      type: String,
      default: "",
      trim: true,
    },

    receiverEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    receiverAddress: {
      type: String,
      default: "",
      trim: true,
    },

    receiverCity: {
      type: String,
      default: "",
      trim: true,
    },

    receiverState: {
      type: String,
      default: "",
      trim: true,
    },

    receiverPincode: {
      type: String,
      default: "",
      trim: true,
    },

    // ----------------------------------------------
    // SHIPMENT INFORMATION
    // ----------------------------------------------

    origin: {
      type: String,
      default: "",
      trim: true,
    },

    destination: {
      type: String,
      default: "",
      trim: true,
    },

    packageType: {
      type: String,
      default: "",
      trim: true,
    },

    weight: {
      type: Number,
      default: 0,
      min: 0,
    },

    productCount: {
      type: Number,
      default: 1,
      min: 0,
    },

    serviceType: {
      type: String,
      default: "",
      trim: true,
    },

    // ----------------------------------------------
    // BILLING INFORMATION
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

    invoiceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ----------------------------------------------
    // CURRENT SHIPMENT STATUS
    // ----------------------------------------------

    currentStatus: {
      type: String,
      enum: ALLOWED_STATUSES,
      default: "Shipment Booked",
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
    // SHIPMENT HISTORY
    // ----------------------------------------------

    history: {
      type: [shipmentHistorySchema],
      default: [],
    },

    // ----------------------------------------------
    // SUPPORTING DOCUMENTS
    // ----------------------------------------------

    supportingDocuments: {
      type: [supportingDocumentSchema],
      default: [],
    },

    // ----------------------------------------------
    // PROOF OF DELIVERY
    // ----------------------------------------------

    proofOfDelivery: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ----------------------------------------------
    // ADDITIONAL INFORMATION
    // ----------------------------------------------

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// --------------------------------------------------
// PRE-SAVE MIDDLEWARE
// --------------------------------------------------

shipmentSchema.pre("save", function (next) {
  try {
    // Normalize current status.
    if (this.currentStatus) {
      this.currentStatus = this.currentStatus.trim();
    }

    // Normalize tracking number.
    if (this.trackingNumber) {
      this.trackingNumber = this.trackingNumber
        .trim()
        .toUpperCase();
    }

    // Normalize AWD number.
    if (this.awdNumber) {
      this.awdNumber = this.awdNumber.trim().toUpperCase();
    }

    // Skip automatic history when the controller is
    // manually managing history entries.
    if (this.$locals && this.$locals.skipAutomaticHistory) {
      return next();
    }

    // Create initial history entry for a new shipment.
    if (this.isNew && (!this.history || this.history.length === 0)) {
      this.history = [
        {
          status: this.currentStatus || "Shipment Booked",
          location: this.currentLocation || "",
          remarks: this.remarks || "Shipment booking created.",
          timestamp: this.bookingDate || new Date(),
          supportingDocumentId: null,
        },
      ];

      return next();
    }

    // Add automatic history when shipment status,
    // location, or remarks change.
    const statusChanged = this.isModified("currentStatus");
    const locationChanged = this.isModified("currentLocation");
    const remarksChanged = this.isModified("remarks");

    if (statusChanged || locationChanged || remarksChanged) {
      this.history.push({
        status: this.currentStatus || "Shipment Booked",
        location: this.currentLocation || "",
        remarks: this.remarks || "",
        timestamp: new Date(),
        supportingDocumentId: null,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});

// --------------------------------------------------
// INDEXES
// --------------------------------------------------

shipmentSchema.index({ trackingNumber: 1 }, { unique: true });
shipmentSchema.index({ awdNumber: 1 });
shipmentSchema.index({ currentStatus: 1 });
shipmentSchema.index({ createdAt: -1 });

// --------------------------------------------------
// EXPORT MODEL
// --------------------------------------------------

const Shipment =
  mongoose.models.Shipment ||
  mongoose.model("Shipment", shipmentSchema);

module.exports = Shipment;

// Export statuses if another file needs them.
module.exports.ALLOWED_STATUSES = ALLOWED_STATUSES;
