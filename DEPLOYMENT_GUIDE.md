# PlotPulse Deployment Guide - GitHub Pages

This guide will help you deploy the PlotPulse frontend to GitHub Pages at `plotpulse.syrez.co.in`.

## Prerequisites

1. GitHub repository set up
2. GoDaddy account with domain `syrez.co.in`
3. Backend API accessible publicly (see Backend Access section below)

---

## Step 1: GitHub Repository Setup

### 1.1 Enable GitHub Pages

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - **Source**: `GitHub Actions`
4. Click **Save**

### 1.2 Configure Repository Name

**Important**: If your repository is NOT named `plot-pulse`, you need to update the base path:

1. Check your repository name (e.g., `plot-pulse`, `plotpulse`, etc.)
2. If different, update `frontend/vite.config.ts`:
   ```typescript
   base: process.env.GITHUB_PAGES === 'true' ? '/your-repo-name/' : '/',
   ```

---

## Step 2: Set GitHub Secrets (Optional but Recommended)

If you want to use a different API URL than the default:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-api-url.com/api/v1`
4. Click **Add secret**

**Note**: If you don't set this, the workflow will use `http://localhost:8091/api/v1` (which won't work from GitHub Pages).

---

## Step 3: GoDaddy DNS Configuration

### 3.1 Access DNS Management

1. Log in to your GoDaddy account
2. Go to **My Products** → **Domains**
3. Click **DNS** next to `syrez.co.in`

### 3.2 Add CNAME Record

Add a CNAME record to point your subdomain to GitHub Pages:

1. Click **Add** in the DNS Records section
2. Select **CNAME** as the record type
3. Fill in:
   - **Name**: `plotpulse`
   - **Value**: `your-username.github.io` (replace `your-username` with your GitHub username)
   - **TTL**: `600` (or default)
4. Click **Save**

**Example**:
- If your GitHub username is `john`, the value should be: `john.github.io`
- This will make `plotpulse.syrez.co.in` point to your GitHub Pages site

### 3.3 Wait for DNS Propagation

- DNS changes can take 5 minutes to 48 hours to propagate
- Usually takes 15-30 minutes
- You can check propagation at: https://www.whatsmydns.net/

---

## Step 4: Configure Custom Domain in GitHub

After DNS propagates:

1. Go to your repository → **Settings** → **Pages**
2. Under **Custom domain**, enter: `plotpulse.syrez.co.in`
3. Check **Enforce HTTPS** (GitHub will provision SSL certificate)
4. Click **Save**

**Note**: GitHub will automatically create a CNAME file in your repository. This is normal.

---

## Step 5: Deploy

### Option A: Automatic Deployment (Recommended)

1. Push the code to the `main` branch:
   ```bash
   git add .
   git commit -m "Setup GitHub Pages deployment"
   git push origin main
   ```

2. GitHub Actions will automatically:
   - Build the frontend
   - Deploy to GitHub Pages
   - Make it available at `https://plotpulse.syrez.co.in`

3. Check deployment status:
   - Go to **Actions** tab in your repository
   - You'll see the deployment workflow running

### Option B: Manual Deployment

1. Go to **Actions** tab
2. Select **Deploy Frontend to GitHub Pages**
3. Click **Run workflow**
4. Select branch: `main`
5. Click **Run workflow**

---

## Step 6: Verify Deployment

1. Wait 2-5 minutes for deployment to complete
2. Visit: `https://plotpulse.syrez.co.in`
3. Check browser console for any errors
4. Verify the app loads correctly

---

## ⚠️ Important: Backend Access Issue

### Current Situation

Your backend is running locally (`http://localhost:8091`), but the frontend on GitHub Pages **cannot access localhost**. You have two options:

### Option 1: Use a Tunneling Service (Temporary)

Use a service like **ngrok** to expose your local backend:

1. Install ngrok: https://ngrok.com/
2. Run: `ngrok http 8091`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update GitHub secret `VITE_API_BASE_URL` to: `https://abc123.ngrok.io/api/v1`
5. Redeploy frontend

**Note**: Free ngrok URLs change on restart. Consider paid plan for stable URL.

### Option 2: Deploy Backend (Recommended)

Deploy your backend to a cloud service:
- **Railway**: https://railway.app (free tier available)
- **Render**: https://render.com (free tier available)
- **Fly.io**: https://fly.io (free tier available)
- **Heroku**: https://heroku.com (paid)

Then update `VITE_API_BASE_URL` to point to your deployed backend.

### Option 3: Update Backend CORS

If you deploy the backend later, make sure to:

1. Update `backend/src/main/resources/application-prod.yml`:
   ```yaml
   cors:
     allowed-origins: 
       - https://plotpulse.syrez.co.in
   ```

2. Set environment variable:
   ```bash
   FRONTEND_URL=https://plotpulse.syrez.co.in
   ```

---

## Troubleshooting

### Issue: 404 Error on Page Refresh

**Solution**: GitHub Pages serves static files. For React Router to work:

1. The `vite.config.ts` already has the base path configured
2. Make sure your repository name matches the base path
3. GitHub Pages should handle this automatically with the workflow

### Issue: API Calls Failing

**Check**:
1. Browser console for CORS errors
2. Network tab to see the actual API URL being called
3. Backend CORS configuration includes `https://plotpulse.syrez.co.in`

### Issue: Custom Domain Not Working

**Check**:
1. DNS propagation: https://www.whatsmydns.net/#CNAME/plotpulse.syrez.co.in
2. GitHub Pages settings show the custom domain
3. Wait up to 24 hours for full propagation

### Issue: Build Fails

**Check**:
1. GitHub Actions logs for specific errors
2. Ensure all dependencies are in `package.json`
3. Node.js version compatibility (workflow uses Node 18)

---

## File Structure After Deployment

```
your-repo/
├── .github/
│   └── workflows/
│       └── deploy-frontend.yml  ✅ Created
├── frontend/
│   ├── vite.config.ts           ✅ Updated (base path)
│   ├── index.html                ✅ Updated (og:url)
│   └── .env.production           ⚠️ Created by workflow
└── DEPLOYMENT_GUIDE.md           ✅ This file
```

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Configure DNS in GoDaddy
3. ✅ Set up backend access (tunneling or deployment)
4. ✅ Update `VITE_API_BASE_URL` secret if needed
5. ✅ Verify deployment works
6. ⚠️ Deploy backend to a cloud service (recommended)

---

## Quick Reference

### GitHub Pages URL
- Before custom domain: `https://your-username.github.io/plot-pulse/`
- After custom domain: `https://plotpulse.syrez.co.in`

### API URL Configuration
- Development: `http://localhost:8091/api/v1`
- Production: Set via GitHub secret `VITE_API_BASE_URL`

### DNS Record
- **Type**: CNAME
- **Name**: `plotpulse`
- **Value**: `your-username.github.io`
- **TTL**: 600

---

*Last Updated: Based on current GitHub Pages and Vite configuration*

