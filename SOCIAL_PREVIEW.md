# Social Media Link Preview Setup

The website is configured with Open Graph and Twitter Card meta tags for beautiful link previews when sharing on social media.

## What's Configured

✅ **Open Graph Tags** - For Facebook, LinkedIn, WhatsApp, etc.
✅ **Twitter Card Tags** - For Twitter/X
✅ **Preview Images** - Each page has a relevant vineyard/qvevri image

## Preview Images by Page

- **Homepage**: Vineyard landscape (`Grapevines-scaled-e5b6bd5d-a447-4b5f-9da8-6c8c55461efd.png`)
- **Support**: Winery image (`winery-khareba-7-94693285-0c78-4f04-bcb5-e37e3bc0758e.png`)
- **Privacy**: Qvevri image (`Glass-over-Qvevri-1-1024x850-7233ca7d-92db-4916-bb63-677ca05a2ccc.png`)

## Important: Update Your Domain

Before deploying, update the `metadataBase` URL in `app/layout.tsx`:

```typescript
metadataBase: new URL("https://your-actual-domain.com"),
```

Replace `https://vinenote.app` with your actual domain URL.

## Testing Link Previews

After deployment, test your link previews using:

- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/
- **Open Graph Checker**: https://www.opengraph.xyz/

## Image Requirements

- Recommended size: 1200x630px (1.91:1 ratio)
- File format: PNG or JPG
- File size: Under 8MB (smaller is better)
- Current images are automatically optimized by Next.js

## How It Works

When someone shares your website link:

1. Social media platforms fetch the page
2. They read the Open Graph meta tags
3. They display a preview card with:
   - Your title
   - Your description
   - Your preview image
   - Your website name

The preview will automatically update when you change the meta tags and redeploy.
