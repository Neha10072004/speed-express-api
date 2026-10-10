
const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");
const path = require("path");
const fs = require("fs");

const generateShippingLabel = async (shipment, res) => {
  try {
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 28,
        bottom: 28,
        left: 32,
        right: 32,
      },
      autoFirstPage: true,
      bufferPages: false,
      compress: true,
    });

    const trackingNumber = String(
      shipment.trackingNumber || "NOT-AVAILABLE"
    );

    const awdNumber = String(
      shipment.awdNumber || trackingNumber
    );

    const safeTracking = trackingNumber.replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ShippingLabel-${safeTracking}.pdf"`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const left = 32;
    const right = pageWidth - 32;
    const width = right - left;

    const blue = "#0B3D91";
    const lightBlue = "#EAF2FC";
    const borderColor = "#B8C7D9";
    const textColor = "#202B3C";
    const muted = "#536477";

    const val = (value, fallback = "-") => {
      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        return fallback;
      }

      return String(value);
    };

    const drawText = (
      value,
      x,
      y,
      w,
      options = {}
    ) => {
      doc
        .font(options.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(options.size || 9)
        .fillColor(options.color || textColor)
        .text(String(value), x, y, {
          width: w,
          height: options.height || 28,
          ellipsis: true,
          lineBreak: false,
        });
    };

    const drawLine = (x1, y1, x2, y2) => {
      doc
        .strokeColor(borderColor)
        .lineWidth(0.7)
        .moveTo(x1, y1)
        .lineTo(x2, y2)
        .stroke();
    };

    const drawSectionTitle = (title, x, y, w) => {
      doc
        .rect(x, y, w, 21)
        .fill(lightBlue);

      drawText(title, x + 7, y + 6, w - 14, {
        bold: true,
        size: 9,
        color: blue,
      });

      doc
        .rect(x, y, w, 21)
        .strokeColor(borderColor)
        .lineWidth(0.7)
        .stroke();
    };

    const drawField = (
      label,
      value,
      x,
      y,
      w,
      h = 32
    ) => {
      doc
        .rect(x, y, w, h)
        .strokeColor(borderColor)
        .lineWidth(0.6)
        .stroke();

      drawText(label.toUpperCase(), x + 6, y + 5, w - 12, {
        bold: true,
        size: 7,
        color: muted,
      });

      drawText(val(value), x + 6, y + 17, w - 12, {
        bold: true,
        size: 9,
        height: h - 18,
      });
    };

    // --------------------------------------------------
    // HEADER
    // --------------------------------------------------

    doc
      .rect(left, 25, width, 58)
      .fill(blue);

    const logoPath = path.join(
      __dirname,
      "..",
      "assets",
      "speed-express-logo.png"
    );

    let titleX = left + 12;

    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, left + 10, 34, {
          fit: [75, 40],
        });

        titleX = left + 95;
      } catch (err) {
        console.error("Could not load Speed Express logo:", err.message);
      }
    }

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#FFFFFF")
      .text("SPEED EXPRESS", titleX, 35, {
        width: right - titleX - 10,
        lineBreak: false,
      });

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#FFFFFF")
      .text("Fast • Safe • Reliable Delivery", titleX, 59, {
        width: right - titleX - 10,
        lineBreak: false,
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(blue)
      .text("SHIPPING LABEL", left, 94, {
        width,
        align: "center",
      });

    // --------------------------------------------------
    // AWD BARCODE
    // --------------------------------------------------

    const barcodeTop = 116;
    const barcodeHeight = 73;

    doc
      .rect(left, barcodeTop, width, barcodeHeight)
      .strokeColor(borderColor)
      .lineWidth(0.8)
      .stroke();

    drawText("AWD NUMBER", left + 8, barcodeTop + 7, width - 16, {
      bold: true,
      size: 8,
      color: blue,
    });

    drawText(awdNumber, left + 8, barcodeTop + 22, width - 16, {
      bold: true,
      size: 11,
    });

    try {
      const barcodeBuffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: awdNumber,
        scale: 2,
        height: 12,
        includetext: true,
        textxalign: "center",
        textsize: 9,
        backgroundcolor: "FFFFFF",
        barcolor: "000000",
      });

      doc.image(barcodeBuffer, left + 220, barcodeTop + 7, {
        fit: [width - 235, 59],
        align: "center",
        valign: "center",
      });
    } catch (err) {
      console.error("Barcode generation failed:", err);

      drawText(
        "Barcode unavailable",
        left + 220,
        barcodeTop + 32,
        width - 235,
        { color: "#B00020", bold: true }
      );
    }

    // --------------------------------------------------
    // SHIPMENT INFORMATION
    // --------------------------------------------------

    let y = 199;

    drawField(
      "Tracking Number",
      trackingNumber,
      left,
      y,
      width,
      34
    );

    y += 39;

    const gap = 8;
    const col = (width - gap * 2) / 3;

    drawField(
      "Booking Type",
      shipment.bookingType,
      left,
      y,
      col,
      36
    );

    drawField(
      "Package Type",
      shipment.packageType,
      left + col + gap,
      y,
      col,
      36
    );

    drawField(
      "Weight (KG)",
      shipment.weight,
      left + (col + gap) * 2,
      y,
      col,
      36
    );

    // --------------------------------------------------
    // SENDER AND RECEIVER TABLES
    // --------------------------------------------------

    y += 47;

    const half = (width - 10) / 2;

    drawSectionTitle("FROM / SENDER", left, y, half);
    drawSectionTitle("TO / RECEIVER", left + half + 10, y, half);

    y += 21;

    const senderX = left;
    const receiverX = left + half + 10;

    const tableRows = [
      ["Name", shipment.senderName, shipment.receiverName],
      ["Phone", shipment.senderPhone, shipment.receiverPhone],
      ["Address", shipment.senderAddress, shipment.receiverAddress],
    ];

    const rowHeights = [30, 30, 49];

    tableRows.forEach((row, index) => {
      const h = rowHeights[index];

      [senderX, receiverX].forEach((x) => {
        doc
          .rect(x, y, half, h)
          .strokeColor(borderColor)
          .lineWidth(0.6)
          .stroke();
      });

      drawText(row[0].toUpperCase(), senderX + 6, y + 4, half - 12, {
        bold: true,
        size: 7,
        color: muted,
      });

      drawText(row[1], senderX + 6, y + 15, half - 12, {
        size: 8,
        height: h - 16,
      });

      drawText(row[0].toUpperCase(), receiverX + 6, y + 4, half - 12, {
        bold: true,
        size: 7,
        color: muted,
      });

      drawText(row[2], receiverX + 6, y + 15, half - 12, {
        size: 8,
        height: h - 16,
      });

      y += h;
    });

    // --------------------------------------------------
    // CURRENT STATUS TABLE
    // --------------------------------------------------

    y += 12;

    drawSectionTitle("SHIPMENT STATUS", left, y, width);
    y += 21;

    const statusCol = width / 4;

    drawField(
      "Status",
      shipment.currentStatus,
      left,
      y,
      statusCol,
      34
    );

    drawField(
      "Location",
      shipment.currentLocation,
      left + statusCol,
      y,
      statusCol,
      34
    );

    drawField(
      "Date",
      shipment.currentDate,
      left + statusCol * 2,
      y,
      statusCol,
      34
    );

    drawField(
      "Time",
      shipment.currentTime,
      left + statusCol * 3,
      y,
      statusCol,
      34
    );

    y += 34;

    // --------------------------------------------------
    // REMARKS
    // --------------------------------------------------

    const remarksHeight = 42;

    doc
      .rect(left, y, width, remarksHeight)
      .strokeColor(borderColor)
      .lineWidth(0.7)
      .stroke();

    drawText("REMARKS", left + 7, y + 5, width - 14, {
      bold: true,
      size: 7,
      color: muted,
    });

    drawText(
      val(shipment.currentRemarks, "No remarks"),
      left + 7,
      y + 18,
      width - 14,
      { size: 8, height: 20 }
    );

    // --------------------------------------------------
    // FOOTER
    // --------------------------------------------------

    const footerY = 790;

    drawLine(left, footerY, right, footerY);

    drawText(
      "SPEED EXPRESS | Fast • Safe • Reliable Delivery",
      left,
      footerY + 8,
      width,
      { bold: true, size: 8, color: blue }
    );

    drawText(
      "Please keep your tracking number for shipment enquiries.",
      left,
      footerY + 22,
      width,
      { size: 7, color: muted }
    );

    doc.end();
  } catch (err) {
    console.error("Shipping label generation error:", err);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate shipping label",
      });
    }

    if (!res.writableEnded) {
      res.end();
    }
  }
};

module.exports = generateShippingLabel;