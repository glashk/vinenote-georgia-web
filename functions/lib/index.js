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
exports.generateListingThumbnails = exports.sharePreview = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
admin.initializeApp();
const CRAWLER_AGENTS = [
    "facebookexternalhit",
    "Facebot",
    "WhatsApp",
    "Twitterbot",
    "TelegramBot",
    "Slackbot",
    "LinkedInBot",
    "Pinterest",
    "Googlebot",
];
function isCrawler(userAgent) {
    const ua = (userAgent || "").toLowerCase();
    return CRAWLER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}
function getListingImageUrl(data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const photoUrls = data.photoUrls;
    const photoUrls200 = data.photoUrls200;
    return ((_k = (_j = (_h = (_f = (_e = (_d = (_c = (_b = (_a = photoUrls === null || photoUrls === void 0 ? void 0 : photoUrls[0]) !== null && _a !== void 0 ? _a : photoUrls200 === null || photoUrls200 === void 0 ? void 0 : photoUrls200[0]) !== null && _b !== void 0 ? _b : data.imageUrl) !== null && _c !== void 0 ? _c : data.image) !== null && _d !== void 0 ? _d : data.image200) !== null && _e !== void 0 ? _e : data.thumbnail) !== null && _f !== void 0 ? _f : (_g = data.photos) === null || _g === void 0 ? void 0 : _g[0]) !== null && _h !== void 0 ? _h : data.mainImage) !== null && _j !== void 0 ? _j : data.photo) !== null && _k !== void 0 ? _k : null);
}
/**
 * Serves share preview HTML with Open Graph meta for listing links.
 * Used when sharing /share/:id - crawlers get meta tags, users get redirect to app.
 */
exports.sharePreview = functions.https.onRequest(async (req, res) => {
    var _a, _b, _c;
    const match = req.path.match(/^\/share\/([^/]+)/);
    const listingId = match === null || match === void 0 ? void 0 : match[1];
    if (!listingId) {
        res.redirect(302, "https://vinenote.app/");
        return;
    }
    try {
        const snap = await admin.firestore().collection("marketListings").doc(listingId).get();
        if (!snap.exists || ((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.hidden) === true) {
            res.redirect(302, "https://vinenote.app/");
            return;
        }
        const data = snap.data();
        const title = (_c = (_b = data.variety) !== null && _b !== void 0 ? _b : data.title) !== null && _c !== void 0 ? _c : "VineNote Georgia - Market Listing";
        const imageUrl = getListingImageUrl(data);
        const baseUrl = "https://vinenote.app";
        const appUrl = `${baseUrl}/?id=${listingId}`;
        const image = (imageUrl === null || imageUrl === void 0 ? void 0 : imageUrl.startsWith("http"))
            ? imageUrl
            : `${baseUrl}/Grapevines-scaled-e5b6bd5d-a447-4b5f-9da8-6c8c55461efd.png`;
        const metaTags = `
  <meta charset="utf-8">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="იყიდება ${escapeHtml(title)} ქართული ღვინის მარკეტზე - VineNote Georgia"
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:url" content="${escapeHtml(appUrl)}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(title)} - VineNote Georgia">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <title>${escapeHtml(title)} | VineNote Georgia</title>`;
        if (isCrawler(req.get("user-agent") || "")) {
            const html = `<!DOCTYPE html>
<html>
<head>${metaTags}
  <meta http-equiv="refresh" content="0;url=${escapeHtml(appUrl)}">
</head>
<body><p>Redirecting to <a href="${escapeHtml(appUrl)}">${escapeHtml(title)}</a>...</p></body>
</html>`;
            res.set("Cache-Control", "public, max-age=3600");
            res.type("text/html").send(html);
        }
        else {
            const html = `<!DOCTYPE html>
<html>
<head>${metaTags}
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:#f8fafc}
    .card{background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.08);max-width:400px;width:100%;overflow:hidden;text-align:center}
    img{width:100%;height:200px;object-fit:cover}
    .content{padding:24px}
    h1{font-size:1.25rem;color:#0f172a;margin-bottom:8px;line-height:1.3}
    p{color:#64748b;font-size:.9rem;margin-bottom:20px}
    a{display:inline-block;background:#04AA6D;color:#fff!important;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:1rem}
    a:hover{background:#039560}
  </style>
</head>
<body>
  <div class="card">
    ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}">` : ""}
    <div class="content">
      <h1>${escapeHtml(title)}</h1>
      <p>ნახეთ ეს განცხადება VineNote Georgia-ზე</p>
      <a href="${escapeHtml(appUrl)}">გახსენით განცხადება</a>
    </div>
  </div>
</body>
</html>`;
            res.set("Cache-Control", "public, max-age=3600");
            res.type("text/html").send(html);
        }
    }
    catch (_d) {
        res.redirect(302, "https://vinenote.app/");
    }
});
function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
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