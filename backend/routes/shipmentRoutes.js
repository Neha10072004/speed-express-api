const express = require("express");

const {
  createShipment,
  getAllShipments,
  getShipment,
  updateShipmentStatus,
} = require("../controllers/shipmentController");

const Shipment = require("../models/Shipment");

const generateShippingLabel = require(
  "../utils/generateShippingLabel"
);

const router = express.Router();

console.log(
  "=============================================="
);

console.log(
  "SHIPMENT ROUTES LOADED"
);

console.log(
  "FILE:",
  __filename
);

console.log(
  "=============================================="
);

/* =====================================================
   TEST LABEL ROUTE

   GET
   /api/shipments/test-label-route
===================================================== */

router.get(
  "/test-label-route",
  (req, res) => {

    console.log(
      "TEST LABEL ROUTE CALLED"
    );

    return res.status(200).json({
      success: true,
      message:
        "Shipping label route is loaded correctly.",
    });
  }
);

/* =====================================================
   CREATE SHIPMENT

   POST
   /api/shipments
===================================================== */

router.post(
  "/",
  createShipment
);

/* =====================================================
   GET ALL SHIPMENTS

   GET
   /api/shipments
===================================================== */

router.get(
  "/",
  getAllShipments
);

/* =====================================================
   SHIPPING LABEL

   GET
   /api/shipments/:trackingNumber/label

   IMPORTANT:
   This MUST be BEFORE /:trackingNumber
===================================================== */

router.get(
  "/:trackingNumber/label",
  async (req, res) => {

    try {

      const trackingNumber =
        String(
          req.params.trackingNumber || ""
        )
          .trim()
          .toUpperCase();

      console.log(
        "=============================================="
      );

      console.log(
        "SHIPPING LABEL REQUEST"
      );

      console.log(
        "Tracking Number:",
        trackingNumber
      );

      console.log(
        "=============================================="
      );

      if (!trackingNumber) {

        return res.status(400).json({
          success: false,
          message:
            "Tracking Number is required.",
        });

      }

      const shipment =
        await Shipment.findOne({
          trackingNumber:
            trackingNumber,
        });

      if (!shipment) {

        console.log(
          "SHIPMENT NOT FOUND:",
          trackingNumber
        );

        return res.status(404).json({
          success: false,
          message:
            `Shipment not found: ${trackingNumber}`,
        });

      }

      console.log(
        "SHIPMENT FOUND:",
        shipment.trackingNumber
      );

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="SpeedExpress-${trackingNumber}.pdf"`
      );

      await generateShippingLabel(
        shipment,
        res
      );

    } catch (error) {

      console.error(
        "=============================================="
      );

      console.error(
        "SHIPPING LABEL ERROR"
      );

      console.error(error);

      console.error(
        "=============================================="
      );

      if (!res.headersSent) {

        return res.status(500).json({
          success: false,
          message:
            "Failed to generate shipping label.",
          error:
            error.message,
        });

      }

    }

  }
);

/* =====================================================
   GET SINGLE SHIPMENT

   GET
   /api/shipments/:trackingNumber

   IMPORTANT:
   This MUST be AFTER /:trackingNumber/label
===================================================== */

router.get(
  "/:trackingNumber",
  getShipment
);

/* =====================================================
   UPDATE SHIPMENT STATUS

   PATCH
   /api/shipments/:trackingNumber/status
===================================================== */

router.patch(
  "/:trackingNumber/status",
  updateShipmentStatus
);

/* =====================================================
   EXPORT
===================================================== */

module.exports = router;