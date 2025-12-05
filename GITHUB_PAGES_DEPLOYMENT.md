# GitHub Pages Deployment - Quick Start

Quick guide to deploy frontend to `plotpulse.syrez.co.in` on GitHub Pages.

## Prerequisites Checklist

- [ ] GitHub repository is set up
- [ ] Railway backend is deployed and accessible
- [ ] GoDaddy account with `syrez.co.in` domain

## Step 1: Set GitHub Secret (API URL)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://plot-pulse-production.up.railway.app/api/v1`
5. Click **Add secret**

**Note**: If you don't set this, it will use the Railway URL by default, but it's better to set it explicitly.

## Step 2: Enable GitHub Pages

1. Go to your repository → **Settings** → **Pages**
2. Under **Source**, select: **GitHub Actions**
3. Click **Save**

## Step 3: Configure GoDaddy DNS

1. Log in to GoDaddy: https://www.godaddy.com
2. Go to **My Products** → **Domains** → **DNS** for `syrez.co.in`
3. Click **Add** → Select **CNAME**
4. Fill in:
   - **Name**: `plotpulse`
   - **Value**: `your-username.github.io` (replace with your GitHub username)
   - **TTL**: `600` (or default)
5. Click **Save**

**To find your GitHub username**: Check your GitHub profile URL or repository URL.

## Step 4: Set Custom Domain in GitHub

**Wait 15-30 minutes** for DNS to propagate, then:

1. Go to repository → **Settings** → **Pages**
2. Under **Custom domain**, enter: `plotpulse.syrez.co.in`
3. Check **Enforce HTTPS**
4. Click **Save**

GitHub will automatically provision an SSL certificate (may take a few minutes).

## Step 5: Deploy

### Option A: Automatic (Recommended)
- Push any changes to `main` branch
- GitHub Actions will automatically build and deploy
- Check **Actions** tab to see deployment progress

### Option B: Manual Trigger
1. Go to **Actions** tab
2. Select **Deploy Frontend to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**

## Step 6: Verify Deployment

1. Wait for deployment to complete (check **Actions** tab)
2. Visit: `https://plotpulse.syrez.co.in`
3. Check browser console for any errors
4. Test API connectivity (should connect to Railway backend)

## Troubleshooting

### DNS Not Working
- Wait 15-30 minutes for DNS propagation
- Check DNS propagation: https://www.whatsmydns.net/#CNAME/plotpulse.syrez.co.in
- Verify CNAME record in GoDaddy DNS settings

### SSL Certificate Not Ready
- Wait 5-10 minutes after setting custom domain
- GitHub automatically provisions SSL certificates
- Check **Settings** → **Pages** for certificate status

### API Connection Errors
- Verify `VITE_API_BASE_URL` secret is set correctly
- Check Railway backend is running and accessible
- Verify CORS is configured in backend for `https://plotpulse.syrez.co.in`

### Build Failures
- Check **Actions** tab for error details
- Verify Node.js version (should be 18+)
- Check that all dependencies are in `package.json`

## Current Configuration

- **Frontend URL**: `https://plotpulse.syrez.co.in`
- **Backend URL**: `https://plot-pulse-production.up.railway.app/api/v1`
- **Base Path**: `/` (custom domain, no subpath needed)
- **Build Tool**: Vite
- **Deployment**: GitHub Actions → GitHub Pages

## Next Steps After Deployment

1. Test all features (map, plot submission, authentication)
2. Verify PWA installation works
3. Check mobile responsiveness
4. Monitor Railway backend logs for API calls
5. Set up monitoring/analytics if needed
