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
router.post(
  "/",
  shipmentController.createShipment
);

/* ---------------------------------------------------------
   2. GET ALL BOOKINGS / ORDERS
   GET /api/shipments
--------------------------------------------------------- */
router.get(
  "/",
  shipmentController.getAllShipments
);

/* ---------------------------------------------------------
   3. UPDATE SHIPMENT STATUS
   Adds a NEW status-history entry.
   PATCH /api/shipments/:trackingNumber/status
--------------------------------------------------------- */
router.patch(
  "/:trackingNumber/status",
  uploadProof.single("proofFile"),
  shipmentController.updateShipmentStatus
);

/* ---------------------------------------------------------
   4. EDIT AN EXISTING STATUS-HISTORY ENTRY
   Updates an existing entry without adding a new one.
   PATCH /api/shipments/:trackingNumber/history/:historyId
--------------------------------------------------------- */

router.patch(
  "/:trackingNumber/history/:historyId",
  shipmentController.updateShipmentHistoryEntry
);

/* ---------------------------------------------------------
   5. DOWNLOAD SHIPPING LABEL
   GET /api/shipments/:trackingNumber/label
--------------------------------------------------------- */
router.get(
  "/:trackingNumber/label",
  shipmentController.getShippingLabel
);

/* ---------------------------------------------------------
   6. EDIT EXISTING BOOKING
   PATCH /api/shipments/:trackingNumber
--------------------------------------------------------- */
router.patch(
  "/:trackingNumber",
  shipmentController.updateShipment
);

/* ---------------------------------------------------------
   7. DELETE BOOKING
   DELETE /api/shipments/:trackingNumber
--------------------------------------------------------- */
router.delete(
  "/:trackingNumber",
  shipmentController.deleteShipment
);

/* ---------------------------------------------------------
   8. GET SINGLE SHIPMENT
   GET /api/shipments/:trackingNumber
--------------------------------------------------------- */
router.get(
  "/:trackingNumber",
  shipmentController.getShipmentByTrackingNumber
);

/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;