const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "In Transit",
        "Out For Delivery",
        "Delivered"
      ],
      required: true
    },

    location: {
      type: String,
      required: true
    },

    date: {
      type: String,
      required: true
    },

    time: {
      type: String,
      required: true
    },

    remarks: {
      type: String,
      default: ""
    }
  },
  {
    _id: false
  }
);

const shipmentSchema = new mongoose.Schema(
  {
    /*
     * ONLINE / OFFLINE
     */
    bookingType: {
      type: String,
      enum: ["Online", "Offline"],
      required: true,
      default: "Offline"
    },

    /*
     * TRACKING NUMBER
     */
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true
    },

    /*
     * AWD NUMBER
     */
    awdNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true
    },

    /*
     * SENDER
     */
    senderName: {
      type: String,
      required: true,
      trim: true
    },

    senderPhone: {
      type: String,
      required: true,
      trim: true
    },

    senderAddress: {
      type: String,
      required: true,
      trim: true
    },

    /*
     * RECEIVER
     */
    receiverName: {
      type: String,
      required: true,
      trim: true
    },

    receiverPhone: {
      type: String,
      required: true,
      trim: true
    },

    receiverAddress: {
      type: String,
      required: true,
      trim: true
    },

    /*
     * PACKAGE
     */
    packageType: {
      type: String,
      required: true,
      trim: true
    },

    weight: {
      type: Number,
      required: true,
      min: 0
    },

    /*
     * CURRENT STATUS
     */
    currentStatus: {
      type: String,
      enum: [
        "In Transit",
        "Out For Delivery",
        "Delivered"
      ],
      default: "In Transit",
      required: true
    },

    /*
     * CURRENT LOCATION
     */
    currentLocation: {
      type: String,
      required: true,
      trim: true
    },

    /*
     * CURRENT DATE
     */
    currentDate: {
      type: String,
      required: true
    },

    /*
     * CURRENT TIME
     */
    currentTime: {
      type: String,
      required: true
    },

    /*
     * CURRENT REMARKS
     */
    currentRemarks: {
      type: String,
      default: ""
    },

    /*
     * TRACKING HISTORY
     */
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Shipment",
  shipmentSchema
);