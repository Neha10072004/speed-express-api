
const express = require("express");
const router = express.Router();

const shipmentController = require("../controllers/shipmentController");

/* =========================================================
   SPEED EXPRESS - SHIPMENT ROUTES
========================================================= */

/*
  IMPORTANT:
  The controller must export every function used below.
*/

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
--------------------------------------------------------- */
router.patch(
  "/:trackingNumber/status",
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
// DELETE SHIPMENT
router.delete("/delete-test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "DELETE route is registered and responding.",
  });
});
/* ---------------------------------------------------------
   7. GET SINGLE SHIPMENT
   GET /api/shipments/:trackingNumber

   Supports searching by tracking number or AWD number
   if the controller checks both fields.
--------------------------------------------------------- */
router.get(
  "/:trackingNumber",
  shipmentController.getShipmentByTrackingNumber
);

/* =========================================================
   EXPORT ROUTER
========================================================= */
module.exports = router;
