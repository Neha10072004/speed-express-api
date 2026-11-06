
const express = require("express");

const router = express.Router();

// ============================================================
// SPEED EXPRESS - SHIPMENT ROUTES
// File: backend/routes/shipmentRoutes.js
// ============================================================


// ============================================================
// IMPORT CONTROLLER
// ============================================================

const shipmentController = require("../controllers/shipmentController");


// ============================================================
// IMPORT AUTHENTICATION MIDDLEWARE
// ============================================================

const { protect } = require("../middleware/authMiddleware");


// ============================================================
// IMPORT FILE UPLOAD MIDDLEWARE
// ============================================================

const uploadProof = require("../middleware/uploadProof");

const handleUploadError = uploadProof.handleUploadError;


// ============================================================
// 1. CREATE SHIPMENT
// POST /api/shipments
// ADMIN ONLY
// ============================================================

router.post(
  "/",
  protect,
  shipmentController.createShipment
);


// ============================================================
// 2. GET ALL SHIPMENTS
// GET /api/shipments
// ADMIN ONLY
// ============================================================

router.get(
  "/",
  protect,
  shipmentController.getAllShipments
);


// ============================================================
// 3. VIEW SUPPORTING DOCUMENT
// GET /api/shipments/:trackingNumber/documents/:documentId/view
// PUBLIC
// ============================================================

router.get(
  "/:trackingNumber/documents/:documentId/view",
  shipmentController.viewSupportingDocument
);


// ============================================================
// 4. DOWNLOAD SUPPORTING DOCUMENT
// GET /api/shipments/:trackingNumber/documents/:documentId/download
// PUBLIC
// ============================================================

router.get(
  "/:trackingNumber/documents/:documentId/download",
  shipmentController.downloadSupportingDocument
);


// ============================================================
// 5. VIEW / DOWNLOAD SHIPPING LABEL
// GET /api/shipments/:trackingNumber/label
// ADMIN ONLY
// ============================================================

router.get(
  "/:trackingNumber/label",
  protect,
  shipmentController.getShippingLabel
);


// ============================================================
// 6. UPDATE SHIPMENT STATUS
// PATCH /api/shipments/:trackingNumber/status
// ADMIN ONLY
//
// Expected FormData:
// - status
// - location
// - remarks
// - eventDateTime
// - visibleToCustomer
// - proofFile (optional)
// ============================================================

router.patch(
  "/:trackingNumber/status",
  protect,
  uploadProof.single("proofFile"),
  handleUploadError,
  shipmentController.updateShipmentStatus
);


// ============================================================
// 7. EDIT EXISTING SHIPMENT HISTORY ENTRY
// PATCH /api/shipments/:trackingNumber/history/:historyId
// ADMIN ONLY
//
// Updates an existing history entry.
// Does not create a duplicate history entry.
// ============================================================

router.patch(
  "/:trackingNumber/history/:historyId",
  protect,
  shipmentController.updateShipmentHistoryEntry
);


// ============================================================
// 8. DELETE ONE SHIPMENT HISTORY ENTRY
// DELETE /api/shipments/:trackingNumber/history/:historyId
// ADMIN ONLY
//
// Deletes only the selected history entry.
// Does not delete the complete shipment.
// ============================================================

router.delete(
  "/:trackingNumber/history/:historyId",
  protect,
  shipmentController.deleteShipmentHistoryEntry
);


// ============================================================
// 9. DELETE COMPLETE SHIPMENT
// DELETE /api/shipments/:trackingNumber
// ADMIN ONLY
// ============================================================

router.delete(
  "/:trackingNumber",
  protect,
  shipmentController.deleteShipment
);


// ============================================================
// 10. PUBLIC SHIPMENT TRACKING
// GET /api/shipments/:trackingNumber
// PUBLIC
//
// Customers can track shipments without logging in.
// ============================================================

router.get(
  "/:trackingNumber",
  shipmentController.getShipmentByTrackingNumber
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;
