
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");

const BUCKET_NAME = "shipmentProofs";

function getBucket() {
  const db = mongoose.connection.db;

  if (!db || mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB is not connected.");
  }

  return new GridFSBucket(db, {
    bucketName: BUCKET_NAME,
  });
}

function isValidObjectId(id) {
  return (
    id !== undefined &&
    id !== null &&
    ObjectId.isValid(String(id))
  );
}

function saveProof(file, trackingNumber) {
  return new Promise((resolve, reject) => {
    if (!file || !Buffer.isBuffer(file.buffer)) {
      return reject(
        new Error(
          "Invalid file buffer. Configure Multer with memoryStorage()."
        )
      );
    }

    let uploadStream;

    try {
      const bucket = getBucket();

      const originalName = String(
        file.originalname || "proof"
      );

      const safeName = originalName
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 180);

      uploadStream = bucket.openUploadStream(
        `proof-${Date.now()}-${safeName}`,
        {
          contentType: file.mimetype,
          metadata: {
            trackingNumber: String(
              trackingNumber
            ).trim().toUpperCase(),
            originalName,
            contentType: file.mimetype,
            size: file.size,
            uploadedAt: new Date(),
          },
        }
      );

      uploadStream.once("error", reject);

      uploadStream.once("finish", () => {
        resolve({
          fileId: uploadStream.id,
          originalName,
          mimeType: file.mimetype,
          size: file.size,
        });
      });

      uploadStream.end(file.buffer);
    } catch (error) {
      if (uploadStream && !uploadStream.destroyed) {
        uploadStream.destroy();
      }

      reject(error);
    }
  });
}

async function deleteProof(fileId) {
  if (!isValidObjectId(fileId)) {
    return;
  }

  const bucket = getBucket();
  const id = new ObjectId(String(fileId));

  // Check whether the file exists before deleting it.
  const existingFile = await bucket
    .find({ _id: id })
    .limit(1)
    .toArray();

  if (existingFile.length === 0) {
    return;
  }

  await bucket.delete(id);
}

async function getProofFile(fileId) {
  if (!isValidObjectId(fileId)) {
    return null;
  }

  const bucket = getBucket();

  const files = await bucket
    .find({
      _id: new ObjectId(String(fileId)),
    })
    .limit(1)
    .toArray();

  return files[0] || null;
}

function openProofDownloadStream(fileId) {
  if (!isValidObjectId(fileId)) {
    throw new Error("Invalid proof file ID.");
  }

  return getBucket().openDownloadStream(
    new ObjectId(String(fileId))
  );
}

module.exports = {
  saveProof,
  deleteProof,
  getProofFile,
  openProofDownloadStream,
};
