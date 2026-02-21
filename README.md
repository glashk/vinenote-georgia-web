# VineNote Georgia Landing Page

A production-ready Next.js website for the VineNote Georgia mobile app. This site serves as the App Store support URL, privacy policy URL, and a simple marketing landing page.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Mobile-first responsive design**
- **SEO-friendly**

## Features

- Clean, minimal design with wine/vineyard aesthetic
- Three main pages:
  - Landing page (`/`) - Marketing and app information
  - Support page (`/support`) - App Store support requirement
  - Privacy Policy page (`/privacy`) - App Store privacy requirement
- Fully static site (no backend required)
- Production-ready and optimized for deployment

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `out` directory. The site is configured for static export, making it easy to deploy to any static hosting service.

## Deployment

### Quick Deploy Options

**Option 1: Vercel (Recommended - Easiest)**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Vercel auto-detects Next.js and deploys automatically
4. Site will be live at `https://your-project.vercel.app`

**Option 2: Firebase Hosting**
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Build: `npm run build`
4. Deploy: `firebase deploy --only hosting`
5. Site will be live at `https://vinenote-georgia-landing.web.app`

**Option 3: Netlify**
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com) and import repository
3. Set build command: `npm run build`
4. Set publish directory: `out`

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Project Structure

```
/
├── app/
│   ├── layout.tsx          # Root layout with Header and Footer
│   ├── page.tsx            # Landing page
│   ├── support/
│   │   └── page.tsx        # Support page
│   ├── privacy/
│   │   └── page.tsx        # Privacy Policy page
│   └── globals.css         # Global styles
├── components/
│   ├── Header.tsx          # Navigation header
│   ├── Footer.tsx          # Site footer
│   └── Container.tsx       # Reusable container component
├── public/                 # Static assets
└── package.json
```

## Customization

### Colors

The site uses a custom color palette defined in `tailwind.config.ts`:
- **Wine colors**: Red tones for primary branding
- **Vineyard colors**: Green tones for vineyard theme
- **Clay colors**: Earthy tones for qvevri theme

You can modify these in `tailwind.config.ts` to match your brand.

### Content

All content is directly in the page components:
- Landing page: `app/page.tsx`
- Support page: `app/support/page.tsx`
- Privacy Policy: `app/privacy/page.tsx`

Edit these files to update the content.

## License

© VineNote Georgia
# vinenote-georgia-web
