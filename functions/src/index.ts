import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import sharp from "sharp";

admin.initializeApp();

const THUMB_SIZES = [200, 400] as const;
const JPEG_QUALITY = 70;

/**
 * When an image is uploaded to marketListings/{userId}/{filename},
 * generate thumb_200 and thumb_400 thumbnails.
 * Saves to: marketListings/{userId}/thumb_200_{filename}, thumb_400_{filename}
 */
export const generateListingThumbnails = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    if (!filePath) return;

    // Skip if this is already a thumbnail
    const fileName = path.basename(filePath);
    if (fileName.startsWith("thumb_200_") || fileName.startsWith("thumb_400_")) {
      return;
    }

    // Only process marketListings uploads
    if (!filePath.startsWith("marketListings/")) {
      return;
    }

    const bucket = admin.storage().bucket(object.bucket);
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, ext);

    const supportedFormats = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    if (!supportedFormats.includes(ext)) {
      return;
    }

    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const tempThumbPaths: string[] = [];

    try {
      await bucket.file(filePath).download({ destination: tempFilePath });

      for (const size of THUMB_SIZES) {
        const thumbFileName = `thumb_${size}_${baseName}.jpg`;
        const thumbPath = path.join(dir, thumbFileName);
        const tempThumbPath = path.join(os.tmpdir(), thumbFileName);
        tempThumbPaths.push(tempThumbPath);

        await sharp(tempFilePath)
          .resize(size, size, { fit: "cover", position: "center" })
          .jpeg({ quality: JPEG_QUALITY, progressive: true })
          .withMetadata({ orientation: undefined }) // Strip metadata
          .toFile(tempThumbPath);

        await bucket.upload(tempThumbPath, {
          destination: thumbPath,
          metadata: {
            contentType: "image/jpeg",
            cacheControl: "public, max-age=31536000, immutable",
          },
        });
      }
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      for (const p of tempThumbPaths) {
        if (fs.existsSync(p)) {
          fs.unlinkSync(p);
        }
      }
    }
  });
