
const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");
const path = require("path");
const fs = require("fs");

const generateShippingLabel = async (shipment, res) => {
  try {
    if (!shipment) {
      return res.status(400).json({
        success: false,
        message: "Shipment details are required.",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 25,
        bottom: 25,
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
    res.setHeader("Cache-Control", "no-store");

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

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

      return String(value).trim();
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
        .text(val(value), x, y, {
          width: w,
          height: options.height || 20,
          ellipsis: true,
          lineBreak: false,
        });
    };

    const drawLine = (x1, y1, x2, y2) => {
      doc
        .save()
        .strokeColor(borderColor)
        .lineWidth(0.7)
        .moveTo(x1, y1)
        .lineTo(x2, y2)
        .stroke()
        .restore();
    };

    const drawSectionTitle = (title, x, y, w) => {
      doc
        .save()
        .rect(x, y, w, 21)
        .fillAndStroke(lightBlue, borderColor)
        .restore();

      drawText(title, x + 7, y + 6, w - 14, {
        bold: true,
        size: 9,
        color: blue,
      });
    };

    const drawField = (
      label,
      value,
      x,
      y,
      w,
      h = 34
    ) => {
      doc
        .save()
        .rect(x, y, w, h)
        .strokeColor(borderColor)
        .lineWidth(0.6)
        .stroke()
        .restore();

      drawText(label.toUpperCase(), x + 6, y + 5, w - 12, {
        bold: true,
        size: 7,
        color: muted,
      });

      drawText(value, x + 6, y + 17, w - 12, {
        bold: true,
        size: 9,
        height: h - 18,
      });
    };

    // --------------------------------------------------
    // HEADER
    // --------------------------------------------------

    const headerY = 25;
    const headerHeight = 58;

    doc
      .save()
      .rect(left, headerY, width, headerHeight)
      .fill(blue)
      .restore();

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
        console.error(
          "Could not load Speed Express logo:",
          err.message
        );
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
        lineBreak: false,
      });

    // --------------------------------------------------
    // AWD BARCODE
    // --------------------------------------------------

    const barcodeTop = 116;
    const barcodeHeight = 73;
    const barcodeWidth = width - 235;
    const barcodeX = left + 220;

    doc
      .save()
      .rect(left, barcodeTop, width, barcodeHeight)
      .strokeColor(borderColor)
      .lineWidth(0.8)
      .stroke()
      .restore();

    drawText(
      "AWD NUMBER",
      left + 8,
      barcodeTop + 7,
      200,
      {
        bold: true,
        size: 8,
        color: blue,
      }
    );

    drawText(
      awdNumber,
      left + 8,
      barcodeTop + 24,
      200,
      {
        bold: true,
        size: 11,
      }
    );

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
        padding: 2,
      });

      doc.image(barcodeBuffer, barcodeX, barcodeTop + 6, {
        fit: [barcodeWidth, 61],
        align: "center",
        valign: "center",
      });
    } catch (err) {
      console.error("Barcode generation failed:", err.message);

      drawText(
        "Barcode unavailable",
        barcodeX,
        barcodeTop + 32,
        barcodeWidth,
        {
          color: "#B00020",
          bold: true,
        }
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

    const columnGap = 10;
    const half = (width - columnGap) / 2;
    const senderX = left;
    const receiverX = left + half + columnGap;

    drawSectionTitle("FROM / SENDER", senderX, y, half);
    drawSectionTitle("TO / RECEIVER", receiverX, y, half);

    y += 21;

    const tableRows = [
      {
        label: "NAME",
        sender: shipment.senderName,
        receiver: shipment.receiverName,
        height: 30,
      },
      {
        label: "PHONE",
        sender: shipment.senderPhone,
        receiver: shipment.receiverPhone,
        height: 30,
      },
      {
        label: "ADDRESS",
        sender: shipment.senderAddress,
        receiver: shipment.receiverAddress,
        height: 49,
      },
    ];

    tableRows.forEach((row) => {
      [senderX, receiverX].forEach((x) => {
        doc
          .save()
          .rect(x, y, half, row.height)
          .strokeColor(borderColor)
          .lineWidth(0.6)
          .stroke()
          .restore();
      });

      drawText(
        row.label,
        senderX + 6,
        y + 4,
        half - 12,
        {
          bold: true,
          size: 7,
          color: muted,
        }
      );

      drawText(
        row.sender,
        senderX + 6,
        y + 15,
        half - 12,
        {
          size: 8,
          height: row.height - 16,
        }
      );

      drawText(
        row.label,
        receiverX + 6,
        y + 4,
        half - 12,
        {
          bold: true,
          size: 7,
          color: muted,
        }
      );

      drawText(
        row.receiver,
        receiverX + 6,
        y + 15,
        half - 12,
        {
          size: 8,
          height: row.height - 16,
        }
      );

      y += row.height;
    });

    // --------------------------------------------------
    // SHIPMENT STATUS
    // --------------------------------------------------

    y += 12;

    drawSectionTitle("SHIPMENT STATUS", left, y, width);
    y += 21;

    const statusGap = 0;
    const statusCol = (width - statusGap * 3) / 4;

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

    y += 44;

    // --------------------------------------------------
    // REMARKS
    // --------------------------------------------------

    const remarksHeight = 42;

    doc
      .save()
      .rect(left, y, width, remarksHeight)
      .strokeColor(borderColor)
      .lineWidth(0.7)
      .stroke()
      .restore();

    drawText(
      "REMARKS",
      left + 7,
      y + 5,
      width - 14,
      {
        bold: true,
        size: 7,
        color: muted,
      }
    );

    drawText(
      val(shipment.currentRemarks, "No remarks"),
      left + 7,
      y + 18,
      width - 14,
      {
        size: 8,
        height: 20,
      }
    );

    // --------------------------------------------------
    // FOOTER
    // --------------------------------------------------

    const footerY = pageHeight - 52;

    drawLine(left, footerY, right, footerY);

    drawText(
      "SPEED EXPRESS | Fast • Safe • Reliable Delivery",
      left,
      footerY + 8,
      width,
      {
        bold: true,
        size: 8,
        color: blue,
      }
    );

    drawText(
      "Please keep your tracking number for shipment enquiries.",
      left,
      footerY + 22,
      width,
      {
        size: 7,
        color: muted,
      }
    );

    // Ensure the content fits on one A4 page.
    if (y + remarksHeight > footerY - 10) {
      console.warn(
        "Shipping label content is close to the footer. " +
        "Review field heights if adding more sections."
      );
    }

    doc.end();
  } catch (err) {
    console.error(
      "Shipping label generation error:",
      err
    );

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate shipping label.",
      });
    }

    if (!res.writableEnded) {
      res.end();
    }
  }
};

module.exports = generateShippingLabel;
