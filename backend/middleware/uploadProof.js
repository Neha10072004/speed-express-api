
const multer = require("multer");
const path = require("path");

// --------------------------------------------------
// FILE UPLOAD CONFIGURATION
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
// FILE STORAGE
// --------------------------------------------------

// Memory storage is required because the controller
// saves uploaded files into MongoDB GridFS.

const storage = multer.memoryStorage();

// --------------------------------------------------
// FILE VALIDATION
// --------------------------------------------------

const fileFilter = (req, file, callback) => {
  try {
    const extension = path
      .extname(file.originalname || "")
      .toLowerCase();

    const acceptedMimeTypes = allowedTypes[extension];

    // Check extension.

    if (!acceptedMimeTypes) {
      return callback(
        new Error(
          "Unsupported file extension. Allowed formats: JPG, JPEG, PNG, WEBP, PDF, DOC, DOCX."
        )
      );
    }

    // Check MIME type.

    if (!acceptedMimeTypes.includes(file.mimetype)) {
      return callback(
        new Error(
          "Invalid file type. Please upload a valid JPG, JPEG, PNG, WEBP, PDF, DOC, or DOCX file."
        )
      );
    }

    callback(null, true);
  } catch (error) {
    callback(error);
  }
};

// --------------------------------------------------
// MULTER CONFIGURATION
// --------------------------------------------------

const uploadProof = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },

  fileFilter,
});

// --------------------------------------------------
// EXPORT MIDDLEWARE
// --------------------------------------------------

module.exports = uploadProof;
