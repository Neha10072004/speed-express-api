
const multer = require("multer");
const path = require("path");

// ==================================================
// SPEED EXPRESS - FILE UPLOAD CONFIGURATION
// File: backend/middleware/uploadProof.js
// Storage: MongoDB GridFS through shipmentController.js
// Maximum file size: 10 MB
// Maximum files per request: 1
// ==================================================

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 1;

// --------------------------------------------------
// ALLOWED FILE TYPES
// --------------------------------------------------

const allowedTypes = {
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
  ".pdf": ["application/pdf"],
  ".doc": ["application/msword"],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

// --------------------------------------------------
// MEMORY STORAGE
// --------------------------------------------------

// Files remain in memory as buffers.
// The shipment controller saves them into MongoDB GridFS.
//
// Do not use diskStorage if your controller expects
// req.file.buffer.

const storage = multer.memoryStorage();

// --------------------------------------------------
// FILE VALIDATION
// --------------------------------------------------

const fileFilter = (req, file, callback) => {
  try {
    const originalName = file.originalname || "";

    const extension = path
      .extname(originalName)
      .toLowerCase();

    const acceptedMimeTypes = allowedTypes[extension];

    // Check file extension.
    if (!acceptedMimeTypes) {
      return callback(
        new Error(
          "Unsupported file extension. Allowed formats: JPG, JPEG, PNG, WEBP, PDF, DOC, DOCX."
        )
      );
    }

    // Check MIME type against the extension.
    if (!acceptedMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error(
          "Invalid file type. Please upload a valid JPG, JPEG, PNG, WEBP, PDF, DOC, or DOCX file."
        )
      );
    }

    // File accepted.
    return callback(null, true);
  } catch (error) {
    return callback(error);
  }
};

// --------------------------------------------------
// MULTER CONFIGURATION
// --------------------------------------------------

const uploadProof = multer({
  storage: storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },

  fileFilter: fileFilter,
});

// --------------------------------------------------
// MULTER ERROR HANDLER
// --------------------------------------------------

// Use this middleware after uploadProof.single("proofFile")
// if you want upload errors to return a consistent JSON response.

const handleUploadError = (error, req, res, next) => {
  if (!error) {
    return next();
  }

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size cannot exceed 10 MB.",
      });
    }

    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Only one attachment can be uploaded at a time.",
      });
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field. Please use proofFile.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "File upload failed.",
    });
  }

  // File extension or MIME-type validation errors.
  return res.status(400).json({
    success: false,
    message: error.message || "Invalid file upload.",
  });
};

// --------------------------------------------------
// EXPORT
// --------------------------------------------------

module.exports = uploadProof;

// Export error handler separately.
module.exports.handleUploadError = handleUploadError;
