import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import sharp from "sharp";

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

function isCrawler(userAgent: string): boolean {
  const ua = (userAgent || "").toLowerCase();
  return CRAWLER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

function getListingImageUrl(data: Record<string, unknown>): string | null {
  const photoUrls = data.photoUrls as string[] | undefined;
  const photoUrls200 = data.photoUrls200 as string[] | undefined;
  return (
    photoUrls?.[0] ??
    photoUrls200?.[0] ??
    (data.imageUrl as string) ??
    (data.image as string) ??
    (data.image200 as string) ??
    (data.thumbnail as string) ??
    (data.photos as string[])?.[0] ??
    (data.mainImage as string) ??
    (data.photo as string) ??
    null
  );
}

/**
 * Serves share preview HTML with Open Graph meta for listing links.
 * Used when sharing /share/:id - crawlers get meta tags, users get redirect to app.
 */
export const sharePreview = functions.https.onRequest(async (req, res) => {
  const match = req.path.match(/^\/share\/([^/]+)/);
  const listingId = match?.[1];
  if (!listingId) {
    res.redirect(302, "https://vinenote.app/");
    return;
  }

  try {
    const snap = await admin.firestore().collection("marketListings").doc(listingId).get();
    if (!snap.exists || snap.data()?.hidden === true) {
      res.redirect(302, "https://vinenote.app/");
      return;
    }

    const data = snap.data()!;
    const title =
      (data.variety as string) ??
      (data.title as string) ??
      "VineNote Georgia - Market Listing";
    const imageUrl = getListingImageUrl(data);
    const baseUrl = "https://vinenote.app";
    const appUrl = `${baseUrl}/?id=${listingId}`;
    const image = imageUrl?.startsWith("http")
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
    } else {
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
  } catch {
    res.redirect(302, "https://vinenote.app/");
  }
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
