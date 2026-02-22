"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateListingThumbnails = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
admin.initializeApp();
const THUMB_SIZES = [200, 400];
const JPEG_QUALITY = 70;
/**
 * When an image is uploaded to marketListings/{userId}/{filename},
 * generate thumb_200 and thumb_400 thumbnails.
 * Saves to: marketListings/{userId}/thumb_200_{filename}, thumb_400_{filename}
 */
exports.generateListingThumbnails = functions.storage
    .object()
    .onFinalize(async (object) => {
    const filePath = object.name;
    if (!filePath)
        return;
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
    const tempThumbPaths = [];
    try {
        await bucket.file(filePath).download({ destination: tempFilePath });
        for (const size of THUMB_SIZES) {
            const thumbFileName = `thumb_${size}_${baseName}.jpg`;
            const thumbPath = path.join(dir, thumbFileName);
            const tempThumbPath = path.join(os.tmpdir(), thumbFileName);
            tempThumbPaths.push(tempThumbPath);
            await (0, sharp_1.default)(tempFilePath)
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
    }
    finally {
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
//# sourceMappingURL=index.js.map