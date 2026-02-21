# Deployment Guide

This guide will help you deploy the VineNote Georgia landing page.

## Option 1: Deploy to Vercel (Recommended - Easiest)

Vercel is the easiest way to deploy Next.js applications.

### Steps:

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"
   - Your site will be live in ~2 minutes!

3. **Your site will be available at:**
   - `https://your-project-name.vercel.app`

## Option 2: Deploy to Firebase Hosting

Since you already have Firebase configured, you can deploy to Firebase Hosting.

### Prerequisites:
```bash
npm install -g firebase-tools
```

### Steps:

1. **Login to Firebase:**
   ```bash
   firebase login
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   firebase deploy --only hosting
   ```

4. **Your site will be available at:**
   - `https://vinenote-georgia-landing.web.app`
   - `https://vinenote-georgia-landing.firebaseapp.com`

## Option 3: Deploy to Netlify

1. **Push code to GitHub** (same as Vercel step 1)

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/Login
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `out`
   - Click "Deploy site"

## Option 4: Manual Deployment

If you want to deploy manually to any static host:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Upload the `out` folder** to your hosting service:
   - The `out` folder contains all static files
   - Upload everything inside `out/` to your web server's public directory

## Troubleshooting

### Build Issues

If you encounter build issues locally, don't worry! Deployment platforms like Vercel often resolve dependency issues automatically. Try deploying directly - the platform's build environment usually handles everything.

### Firebase Analytics

Firebase Analytics is already configured and will work automatically once deployed. No additional setup needed!

## Post-Deployment

After deployment:

1. ✅ Test all pages (/, /support, /privacy)
2. ✅ Test language switcher (EN/KA)
3. ✅ Verify Firebase Analytics is tracking (check Firebase Console)
4. ✅ Test on mobile devices
5. ✅ Update App Store links with your new URL

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Firebase Hosting Docs: https://firebase.google.com/docs/hosting
- Netlify Docs: https://docs.netlify.com
