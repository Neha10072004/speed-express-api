
const express = require("express");

const {
  createShipment,
  getAllShipments,
  getShipment,
  updateShipmentStatus,
} = require("../controllers/shipmentController");

const Shipment = require("../models/Shipment");
const generateShippingLabel = require("../utils/generateShippingLabel");

const router = express.Router();

console.log("SHIPMENT ROUTES LOADED:", __filename);

// TEST ROUTE — keep before /:trackingNumber
router.get("/test-label-route", (req, res) => {
  console.log("TEST LABEL ROUTE CALLED");

  return res.status(200).json({
    success: true,
    message: "Shipping label route is loaded correctly.",
  });
});

// CREATE SHIPMENT
router.post("/", createShipment);

// GET ALL SHIPMENTS
router.get("/", getAllShipments);

// UPDATE SHIPMENT STATUS
router.patch("/:trackingNumber/status", updateShipmentStatus);

// DOWNLOAD SHIPPING LABEL
router.get("/:trackingNumber/label", async (req, res, next) => {
  try {
    const trackingNumber = String(req.params.trackingNumber || "")
      .trim()
      .toUpperCase();

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: "Tracking Number is required.",
      });
    }

    const shipment = await Shipment.findOne({ trackingNumber });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: `Shipment not found: ${trackingNumber}`,
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="SpeedExpress-${trackingNumber}.pdf"`
    );

    await generateShippingLabel(shipment, res);
  } catch (error) {
    console.error("SHIPPING LABEL ERROR:", error);

    if (res.headersSent) {
      return next(error);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate shipping label.",
      error: error.message,
    });
  }
});

// GET ONE SHIPMENT — keep after the specific routes above
router.get("/:trackingNumber", getShipment);

module.exports = router;