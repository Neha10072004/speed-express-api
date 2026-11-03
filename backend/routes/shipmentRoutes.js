
const express = require("express");
const router = express.Router();

const shipmentController = require("../controllers/shipmentController");
const uploadProof = require("../middleware/uploadProof");
const { protect } = require("../middleware/authMiddleware");

/* =========================================================
   SPEED EXPRESS - SHIPMENT ROUTES

   Admin and authenticated staff users can manage shipments.
   Public customers can still track a shipment by its number.
========================================================= */

/* ---------------------------------------------------------
   1. CREATE NEW BOOKING
   POST /api/shipments
   Admin + Staff
--------------------------------------------------------- */
router.post(
  "/",
  protect,
  shipmentController.createShipment
);

/* ---------------------------------------------------------
   2. GET ALL BOOKINGS / ORDERS
   GET /api/shipments
   Admin + Staff
--------------------------------------------------------- */
router.get(
  "/",
  protect,
  shipmentController.getAllShipments
);

/* ---------------------------------------------------------
   3. UPDATE SHIPMENT STATUS
   PATCH /api/shipments/:trackingNumber/status
   Admin + Staff
--------------------------------------------------------- */
router.patch(
  "/:trackingNumber/status",
  protect,
  uploadProof.single("proofFile"),
  shipmentController.updateShipmentStatus
);

/* ---------------------------------------------------------
   4. EDIT EXISTING STATUS-HISTORY ENTRY
   PATCH /api/shipments/:trackingNumber/history/:historyId
   Admin + Staff
--------------------------------------------------------- */
router.patch(
  "/:trackingNumber/history/:historyId",
  protect,
  shipmentController.updateShipmentHistoryEntry
);

/* ---------------------------------------------------------
   5. DOWNLOAD SHIPPING LABEL
   GET /api/shipments/:trackingNumber/label
   Admin + Staff
--------------------------------------------------------- */
router.get(
  "/:trackingNumber/label",
  protect,
  shipmentController.getShippingLabel
);

/* ---------------------------------------------------------
   6. EDIT EXISTING BOOKING
   PATCH /api/shipments/:trackingNumber
   Admin + Staff
--------------------------------------------------------- */
router.patch(
  "/:trackingNumber",
  protect,
  shipmentController.updateShipment
);

/* ---------------------------------------------------------
   7. DELETE BOOKING
   DELETE /api/shipments/:trackingNumber
   Admin + Staff
--------------------------------------------------------- */
router.delete(
  "/:trackingNumber",
  protect,
  shipmentController.deleteShipment
);

/* ---------------------------------------------------------
   8. PUBLIC SHIPMENT TRACKING
   GET /api/shipments/:trackingNumber

   Kept public so customers can track shipments
   from the public Speed Express Tracking page.
--------------------------------------------------------- */
router.get(
  "/:trackingNumber",
  shipmentController.getShipmentByTrackingNumber
);

/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;
