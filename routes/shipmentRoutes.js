const express = require("express");

const {
  createShipment,
  getAllShipments,
  getShipment,
  updateShipmentStatus
} = require("../controllers/shipmentController");

const router = express.Router();

/*
POST
Create new shipment
*/
router.post(
  "/",
  createShipment
);

/*
GET
Get all shipments
*/
router.get(
  "/",
  getAllShipments
);

/*
GET
Track shipment using Tracking Number or AWD
*/
router.get(
  "/:trackingNumber",
  getShipment
);

/*
PATCH
Update shipment status
*/
router.patch(
  "/:trackingNumber/status",
  updateShipmentStatus
);

module.exports = router;