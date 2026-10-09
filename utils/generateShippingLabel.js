
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateShippingLabel = (shipment, res) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [288, 432],
      margins: {
        top: 18,
        bottom: 18,
        left: 18,
        right: 18,
      },
      info: {
        Title: `Speed Express Label - ${shipment.trackingNumber}`,
        Author: "Speed Express",
      },
    });

    doc.on("error", reject);
    res.on("error", reject);
    doc.on("end", resolve);

    doc.pipe(res);

    const BLUE = "#0B3D91";
    const CYAN = "#00A7DF";
    const LEFT = 18;
    const RIGHT = 270;
    const WIDTH = RIGHT - LEFT;

    // Header background
    doc.rect(0, 0, 288, 76).fill(BLUE);

    // Logo path: backend/assets/speed-express-logo.png
    const logoPath = path.join(
      __dirname,
      "..",
      "assets",
      "speed-express-logo.png"
    );

    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, LEFT, 12, {
          fit: [58, 48],
          align: "center",
          valign: "center",
        });
      } catch (error) {
        console.error("Logo loading error:", error.message);
      }
    }

    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("SPEED EXPRESS", 80, 19, {
        width: 190,
        align: "center",
      });

    doc
      .font("Helvetica")
      .fontSize(8)
      .text("SHIPMENT SHIPPING LABEL", 80, 43, {
        width: 190,
        align: "center",
      });

    let y = 87;

    // Section heading
    const heading = (title) => {
      doc.rect(LEFT, y, WIDTH, 19).fill(BLUE);

      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(title, LEFT + 7, y + 5);

      y += 25;
    };

    // Label and value
    const field = (label, value) => {
      doc
        .fillColor("#555555")
        .font("Helvetica-Bold")
        .fontSize(7)
        .text(label, LEFT, y, {
          width: WIDTH,
        });

      y += 10;

      doc
        .fillColor("#111111")
        .font("Helvetica")
        .fontSize(9)
        .text(String(value || "-"), LEFT, y, {
          width: WIDTH,
          lineGap: 1,
        });

      y = doc.y + 5;
    };

    const separator = () => {
      doc
        .moveTo(LEFT, y)
        .lineTo(RIGHT, y)
        .strokeColor("#CCCCCC")
        .lineWidth(0.7)
        .stroke();

      y += 8;
    };

    // Tracking number
    doc
      .fillColor(CYAN)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("TRACKING NUMBER", LEFT, y);

    y += 13;

    doc
      .fillColor(BLUE)
      .font("Helvetica-Bold")
      .fontSize(18)
      .text(shipment.trackingNumber || "-", LEFT, y, {
        width: WIDTH,
      });

    y = doc.y + 5;

    doc
      .fillColor("#111111")
      .font("Helvetica")
      .fontSize(9)
      .text(`AWD Number: ${shipment.awdNumber || "-"}`, LEFT, y);

    y = doc.y + 8;
    separator();

    // Sender
    heading("FROM / SENDER");
    field("SENDER NAME", shipment.senderName);
    field("PHONE", shipment.senderPhone);
    field("ADDRESS", shipment.senderAddress);
    separator();

    // Receiver
    heading("TO / RECEIVER");
    field("RECEIVER NAME", shipment.receiverName);
    field("PHONE", shipment.receiverPhone);
    field("ADDRESS", shipment.receiverAddress);
    separator();

    // Shipment information
    heading("SHIPMENT DETAILS");
    field("PACKAGE TYPE", shipment.packageType);
    field(
      "WEIGHT",
      shipment.weight != null ? `${shipment.weight} kg` : "-"
    );
    field("BOOKING TYPE", shipment.bookingType);
    field("CURRENT STATUS", shipment.currentStatus);
    field("CURRENT LOCATION", shipment.currentLocation);

    field(
      "LAST UPDATED",
      `${shipment.currentDate || "-"} ${shipment.currentTime || ""}`.trim()
    );

    if (shipment.currentRemarks) {
      field("REMARKS", shipment.currentRemarks);
    }

    // Footer, placed after the content
    const footerY = Math.min(y + 5, 405);

    doc
      .moveTo(LEFT, footerY)
      .lineTo(RIGHT, footerY)
      .strokeColor(CYAN)
      .lineWidth(1.5)
      .stroke();

    doc
      .fillColor(BLUE)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text(
        "Thank you for choosing Speed Express!",
        LEFT,
        footerY + 7,
        {
          width: WIDTH,
          align: "center",
        }
      );

    doc.end();
  });

module.exports = generateShippingLabel;