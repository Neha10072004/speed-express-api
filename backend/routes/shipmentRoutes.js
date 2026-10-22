
const express = require("express");
const router = express.Router();

const shipmentController = require("../controllers/shipmentController");
const uploadProof = require("../middleware/uploadProof");

/* =========================================================
   SPEED EXPRESS - SHIPMENT ROUTES
========================================================= */

/* ---------------------------------------------------------
   1. CREATE NEW BOOKING
   POST /api/shipments
--------------------------------------------------------- */
router.post("/", shipmentController.createShipment);

/* ---------------------------------------------------------
   2. GET ALL BOOKINGS / ORDERS
   GET /api/shipments
--------------------------------------------------------- */
router.get("/", shipmentController.getAllShipments);

/* ---------------------------------------------------------
   3. UPDATE SHIPMENT STATUS
   PATCH /api/shipments/:trackingNumber/status

   Supports:
   - Status
   - Location
   - Remarks
   - Event date/time
   - Optional proof attachment
--------------------------------------------------------- */
router.patch(
  "/:trackingNumber/status",
  uploadProof.single("proofFile"),
  shipmentController.updateShipmentStatus
);

/* ---------------------------------------------------------
   4. DOWNLOAD SHIPPING LABEL
   GET /api/shipments/:trackingNumber/label
--------------------------------------------------------- */
router.get(
  "/:trackingNumber/label",
  shipmentController.getShippingLabel
);

/* ---------------------------------------------------------
   5. EDIT EXISTING BOOKING
   PATCH /api/shipments/:trackingNumber
--------------------------------------------------------- */
router.patch(
  "/:trackingNumber",
  shipmentController.updateShipment
);

/* ---------------------------------------------------------
   6. DELETE BOOKING
   DELETE /api/shipments/:trackingNumber
--------------------------------------------------------- */
router.delete(
  "/:trackingNumber",
  shipmentController.deleteShipment
);

/* ---------------------------------------------------------
   7. GET SINGLE SHIPMENT
   GET /api/shipments/:trackingNumber

   Supports tracking number or AWD number if the
   controller's lookup function supports both.
--------------------------------------------------------- */
router.get(
  "/:trackingNumber",
  shipmentController.getShipmentByTrackingNumber
);

/* =========================================================
   EXPORT ROUTER
========================================================= */
module.exports = router;
