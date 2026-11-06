
const express = require("express");

const router = express.Router();

// ==================================================
// SPEED EXPRESS - SHIPMENT ROUTES
// File: backend/routes/shipmentRoutes.js
// ==================================================

// --------------------------------------------------
// CONTROLLER
// --------------------------------------------------

const shipmentController = require("../controllers/shipmentController");

// --------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

const { protect } = require("../middleware/authMiddleware");

// --------------------------------------------------
// FILE UPLOAD MIDDLEWARE
// --------------------------------------------------

const uploadProof = require("../middleware/uploadProof");

const handleUploadError = uploadProof.handleUploadError;

// ==================================================
// 1. CREATE SHIPMENT
// ==================================================

// POST /api/shipments
// Admin only.

router.post(
  "/",
  protect,
  shipmentController.createShipment
);

// ==================================================
// 2. GET ALL SHIPMENTS
// ==================================================

// GET /api/shipments
// Admin only.

router.get(
  "/",
  protect,
  shipmentController.getAllShipments
);

// ==================================================
// 3. VIEW SUPPORTING DOCUMENT
// ==================================================

// GET /api/shipments/:trackingNumber/documents/:documentId/view
//
// Public route.
// Allows customers to view an attachment from tracking.

router.get(
  "/:trackingNumber/documents/:documentId/view",
  shipmentController.viewSupportingDocument
);

// ==================================================
// 4. DOWNLOAD SUPPORTING DOCUMENT
// ==================================================

// GET /api/shipments/:trackingNumber/documents/:documentId/download
//
// Public route.
// Allows customers to download an attachment.

router.get(
  "/:trackingNumber/documents/:documentId/download",
  shipmentController.downloadSupportingDocument
);

// ==================================================
// 5. DOWNLOAD / VIEW SHIPPING LABEL
// ==================================================

// GET /api/shipments/:trackingNumber/label
//
// Admin only.

router.get(
  "/:trackingNumber/label",
  protect,
  shipmentController.getShippingLabel
);

// ==================================================
// 6. UPDATE SHIPMENT STATUS
// ==================================================

// PATCH /api/shipments/:trackingNumber/status
//
// Admin only.
//
// Expected FormData:
//
// status
// location
// remarks
// eventDateTime
// visibleToCustomer
// proofFile
//
// proofFile is optional.

router.patch(
  "/:trackingNumber/status",
  protect,
  uploadProof.single("proofFile"),
  handleUploadError,
  shipmentController.updateShipmentStatus
);

// ==================================================
// 7. UPDATE SHIPMENT HISTORY
// ==================================================

// PATCH /api/shipments/:trackingNumber/history/:historyId
//
// Admin only.

router.patch(
  "/:trackingNumber/history/:historyId",
  protect,
  shipmentController.updateShipmentHistoryEntry
);

// ==================================================
// 8. DELETE SHIPMENT
// ==================================================

// DELETE /api/shipments/:trackingNumber
//
// Admin only.

router.delete(
  "/:trackingNumber",
  protect,
  shipmentController.deleteShipment
);

// ==================================================
// 9. GET SHIPMENT BY TRACKING NUMBER
// ==================================================

// GET /api/shipments/:trackingNumber
//
// Public route.
// Customers can track shipments without logging in.

router.get(
  "/:trackingNumber",
  shipmentController.getShipmentByTrackingNumber
);

// ==================================================
// EXPORT ROUTER
// ==================================================

module.exports = router;
