
const STORAGE_KEY = "speedExpressShipments";

export function getShipments() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Unable to read saved shipments:", error);
    return [];
  }
}

export function saveShipment(shipment) {
  const shipments = getShipments();

  const updatedShipments = [
    shipment,
    ...shipments.filter(
      (item) => item.trackingNumber !== shipment.trackingNumber
    ),
  ];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedShipments)
  );

  return updatedShipments;
}