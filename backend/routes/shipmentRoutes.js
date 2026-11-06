
const express = require("express");
const router = express.Router();

const shipmentController = require("../controllers/shipmentController");
const uploadProof = require("../middleware/uploadProof");
const { protect } = require("../middleware/authMiddleware");

/* =========================================================
   SPEED EXPRESS - SHIPMENT ROUTES

   Admin and authenticated staff users can manage shipments.

   Public customers can:
   - Track shipments.
   - View customer-approved supporting documents.
   - Download customer-approved supporting documents.
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

   Supports:
   - Existing proof of delivery upload (proofFile).
   - Supporting document upload.
   - Customer visibility checkbox (visibleToCustomer).
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
   8. VIEW CUSTOMER-APPROVED SUPPORTING DOCUMENT
   GET /api/shipments/:trackingNumber/documents/:documentId/view

   Public customer access:
   - Only documents with visibleToCustomer = true.
--------------------------------------------------------- */

router.get(
  "/:trackingNumber/documents/:documentId/view",
  shipmentController.viewSupportingDocument
);

/* ---------------------------------------------------------
   9. DOWNLOAD CUSTOMER-APPROVED SUPPORTING DOCUMENT
   GET /api/shipments/:trackingNumber/documents/:documentId/download

   Public customer access:
   - Only documents with visibleToCustomer = true.
--------------------------------------------------------- */

router.get(
  "/:trackingNumber/documents/:documentId/download",
  shipmentController.downloadSupportingDocument
);

/* ---------------------------------------------------------
   10. PUBLIC SHIPMENT TRACKING
   GET /api/shipments/:trackingNumber

   Customers can track shipments without logging in.
--------------------------------------------------------- */

router.get(
  "/:trackingNumber",
  shipmentController.getShipmentByTrackingNumber
);

/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;
