const multer = require("multer");
const path = require("path");

const MAX_FILE_SIZE = 10 * 1024 * 1024;

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

const uploadProof = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },

  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const acceptedMimeTypes = allowedTypes[extension];

    if (
      !acceptedMimeTypes ||
      !acceptedMimeTypes.includes(file.mimetype)
    ) {
      return callback(
        new Error(
          "Unsupported file type. Use JPG, JPEG, PNG, WEBP, PDF, DOC, or DOCX."
        )
      );
    }

    callback(null, true);
  },
});

module.exports = uploadProof;