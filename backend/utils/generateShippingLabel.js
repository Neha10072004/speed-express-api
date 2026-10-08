const PDFDocument = require("pdfkit");
const bwipjs = require("bwip-js");
const path = require("path");
const fs = require("fs");

const generateShippingLabel = async (shipment, res) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 25,
        bufferPages: true,
      });

      doc.pipe(res);

      const PAGE_WIDTH = 595;
      const LEFT = 25;
      const RIGHT = 25;
      const WIDTH = PAGE_WIDTH - LEFT - RIGHT;

      // ==========================================
      // LOGO
      // ==========================================

      const logoPath = path.join(
        __dirname,
        "..",
        "assets",
        "speed-express-logo.png"
      );

      // ==========================================
      // DATA
      // ==========================================

      const trackingNumber =
        shipment.trackingNumber || "N/A";

      const awdNumber =
        shipment.awdNumber || "N/A";

      const bookingType =
        shipment.bookingType || "Offline";

      const packageType =
        shipment.packageType || "Parcel";

      const weight =
        shipment.weight !== undefined
          ? `${shipment.weight} KG`
          : "N/A";

      const status =
        shipment.currentStatus || "Booked";

      const location =
        shipment.currentLocation || "N/A";

      const date =
        shipment.currentDate || "N/A";

      const time =
        shipment.currentTime || "N/A";

      const remarks =
        shipment.currentRemarks ||
        "Handle with care.";

      // ==========================================
      // COMPACT TABLE HELPERS
      // ==========================================

      const sectionTitle = (title) => {
        const y = doc.y;

        doc
          .rect(LEFT, y, WIDTH, 18)
          .fill("#0b3d91");

        doc
          .fillColor("#ffffff")
          .font("Helvetica-Bold")
          .fontSize(9)
          .text(title, LEFT + 7, y + 5);

        doc.fillColor("#000000");

        doc.y = y + 18;
      };

      const row = (
        label,
        value,
        options = {}
      ) => {
        const labelWidth =
          options.labelWidth || 125;

        const valueWidth =
          WIDTH - labelWidth;

        const fontSize =
          options.fontSize || 8;

        const padding = 5;

        const textValue =
          value !== undefined &&
          value !== null &&
          String(value).trim() !== ""
            ? String(value)
            : "N/A";

        const valueHeight =
          doc.heightOfString(
            textValue,
            {
              width:
                valueWidth - 10,
            }
          );

        const rowHeight = Math.max(
          19,
          valueHeight + 8
        );

        const y = doc.y;

        doc
          .rect(
            LEFT,
            y,
            labelWidth,
            rowHeight
          )
          .stroke("#c8c8c8");

        doc
          .rect(
            LEFT + labelWidth,
            y,
            valueWidth,
            rowHeight
          )
          .stroke("#c8c8c8");

        doc
          .fillColor("#222222")
          .font("Helvetica-Bold")
          .fontSize(fontSize)
          .text(
            label,
            LEFT + padding,
            y + 6,
            {
              width:
                labelWidth - 10,
            }
          );

        doc
          .font("Helvetica")
          .fontSize(fontSize)
          .text(
            textValue,
            LEFT + labelWidth + padding,
            y + 6,
            {
              width:
                valueWidth - 10,
            }
          );

        doc.y = y + rowHeight;
      };

      // ==========================================
      // HEADER
      // ==========================================

      const headerTop = 25;

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, {
          fit: [110, 45],
          x: LEFT,
          y: headerTop,
        });
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .text(
          "SPEED EXPRESS",
          LEFT + 115,
          headerTop + 5,
          {
            width: WIDTH - 115,
            align: "center",
          }
        );

      doc
        .font("Helvetica")
        .fontSize(8.5)
        .text(
          "Fast • Safe • Reliable Delivery",
          LEFT + 115,
          headerTop + 28,
          {
            width: WIDTH - 115,
            align: "center",
          }
        );

      doc
        .moveTo(LEFT, 78)
        .lineTo(
          PAGE_WIDTH - RIGHT,
          78
        )
        .lineWidth(1)
        .stroke("#0b3d91");

      // ==========================================
      // SHIPPING LABEL
      // ==========================================

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(
          "SHIPPING LABEL",
          LEFT,
          86,
          {
            width: WIDTH,
            align: "center",
          }
        );

      doc.y = 108;

      // ==========================================
      // AWD + TRACKING
      // ==========================================

      row(
        "AWD NUMBER",
        awdNumber
      );

      row(
        "TRACKING NUMBER",
        trackingNumber
      );

      doc.y += 4;

      // ==========================================
      // BARCODE
      // ==========================================

      try {
        const barcode =
          await bwipjs.toBuffer({
            bcid: "code128",
            text: String(
              awdNumber !== "N/A"
                ? awdNumber
                : trackingNumber
            ),
            scale: 1.5,
            height: 10,
            includetext: true,
            textxalign: "center",
          });

        doc.image(barcode, {
          fit: [300, 48],
          align: "center",
        });

        doc.y += 3;
      } catch (error) {
        console.error(
          "Barcode error:",
          error
        );
      }

      // ==========================================
      // PACKAGE DETAILS
      // ==========================================

      sectionTitle("PACKAGE DETAILS");

      row(
        "BOOKING TYPE",
        bookingType
      );

      row(
        "PACKAGE TYPE",
        packageType
      );

      row(
        "WEIGHT",
        weight
      );

      doc.y += 4;

      // ==========================================
      // FROM / SENDER
      // ==========================================

      sectionTitle("FROM / SENDER");

      row(
        "NAME",
        shipment.senderName
      );

      row(
        "MOBILE",
        shipment.senderPhone
      );

      row(
        "ADDRESS",
        shipment.senderAddress,
        {
          fontSize: 7.5,
        }
      );

      doc.y += 4;

      // ==========================================
      // TO / RECEIVER
      // ==========================================

      sectionTitle("TO / RECEIVER");

      row(
        "NAME",
        shipment.receiverName
      );

      row(
        "MOBILE",
        shipment.receiverPhone
      );

      row(
        "ADDRESS",
        shipment.receiverAddress,
        {
          fontSize: 7.5,
        }
      );

      doc.y += 4;

      // ==========================================
      // SHIPMENT STATUS
      // ==========================================

      sectionTitle("SHIPMENT STATUS");

      row(
        "STATUS",
        status
      );

      row(
        "LOCATION",
        location
      );

      row(
        "DATE",
        date
      );

      row(
        "TIME",
        time
      );

      doc.y += 4;

      // ==========================================
      // REMARKS
      // ==========================================

      sectionTitle("REMARKS");

      row(
        "REMARKS",
        remarks,
        {
          fontSize: 7.5,
        }
      );

      doc.y += 7;

      // ==========================================
      // FOOTER
      // ==========================================

      doc
        .moveTo(LEFT, doc.y)
        .lineTo(
          PAGE_WIDTH - RIGHT,
          doc.y
        )
        .lineWidth(0.8)
        .stroke("#0b3d91");

      doc.y += 5;

      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(
          "SPEED EXPRESS",
          LEFT,
          doc.y,
          {
            width: WIDTH,
            align: "center",
          }
        );

      doc.y += 12;

      doc
        .font("Helvetica")
        .fontSize(7)
        .text(
          "For shipment tracking, use the AWD / Tracking Number on the Speed Express website.",
          LEFT,
          doc.y,
          {
            width: WIDTH,
            align: "center",
          }
        );

      doc.y += 10;

      doc
        .fontSize(7)
        .text(
          "Customer Support: speedexp2022@gmail.com",
          LEFT,
          doc.y,
          {
            width: WIDTH,
            align: "center",
          }
        );

      // ==========================================
      // FINISH
      // ==========================================

      doc.on("end", () => {
        resolve();
      });

      doc.on("error", (error) => {
        reject(error);
      });

      doc.end();
    } catch (error) {
      console.error(
        "Shipping label generation error:",
        error
      );

      reject(error);
    }
  });
};

module.exports =
  generateShippingLabel;