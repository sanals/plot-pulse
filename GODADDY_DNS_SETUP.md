# GoDaddy DNS Setup for plotpulse.syrez.co.in

This guide will help you configure your GoDaddy DNS to point `plotpulse.syrez.co.in` to GitHub Pages.

## Prerequisites

- GoDaddy account with access to `syrez.co.in` domain
- GitHub repository with GitHub Pages enabled
- Your GitHub username

---

## Step-by-Step Instructions

### Step 1: Find Your GitHub Username

1. Go to https://github.com
2. Check your username (it's in the URL: `https://github.com/your-username`)

**Example**: If your username is `john`, your GitHub Pages URL will be `john.github.io`

---

### Step 2: Access GoDaddy DNS Management

1. Log in to your GoDaddy account: https://www.godaddy.com
2. Go to **My Products** → **Domains**
3. Find `syrez.co.in` in the list
4. Click the **DNS** button (or **Manage DNS**)

---

### Step 3: Add CNAME Record

1. In the DNS Records section, click **Add** (or **+ Add**)
2. Select **CNAME** as the record type
3. Fill in the following:
   
   **Name/Host**: `plotpulse`
   
   **Value/Points to**: `your-username.github.io` (replace `your-username` with your actual GitHub username)
   
   **TTL**: `600` (or leave as default - 1 hour)
   
4. Click **Save** (or **Add Record**)

**Example**:
- If your GitHub username is `john`, the record should be:
  - **Name**: `plotpulse`
  - **Value**: `john.github.io`
  - **TTL**: `600`

This will make `plotpulse.syrez.co.in` point to `john.github.io`.

---

### Step 4: Verify DNS Record

After saving, you should see a new CNAME record in your DNS list:

```
Type: CNAME
Name: plotpulse
Value: your-username.github.io
TTL: 600
```

---

### Step 5: Wait for DNS Propagation

DNS changes can take time to propagate:

- **Minimum**: 5-10 minutes
- **Typical**: 15-30 minutes
- **Maximum**: 24-48 hours

You can check propagation status at:
- https://www.whatsmydns.net/#CNAME/plotpulse.syrez.co.in
- https://dnschecker.org/#CNAME/plotpulse.syrez.co.in

Enter `plotpulse.syrez.co.in` and look for CNAME records pointing to `your-username.github.io`.

---

### Step 6: Configure Custom Domain in GitHub

**After DNS has propagated** (Step 5):

1. Go to your GitHub repository
2. Click **Settings** → **Pages**
3. Under **Custom domain**, enter: `plotpulse.syrez.co.in`
4. Check **Enforce HTTPS** (GitHub will automatically provision an SSL certificate)
5. Click **Save**

**Note**: 
- GitHub will automatically create a `CNAME` file in your repository (this is normal)
- It may take a few minutes for HTTPS to be enabled
- You'll see a green checkmark when everything is configured correctly

---

## Troubleshooting

### Issue: DNS Not Propagating

**Check**:
1. Verify the CNAME record is correct in GoDaddy
2. Wait at least 30 minutes
3. Clear your browser DNS cache:
   - Windows: `ipconfig /flushdns`
   - Mac/Linux: `sudo dscacheutil -flushcache`
4. Try accessing from a different network/device

### Issue: "Not Secure" or SSL Error

**Solution**:
1. Make sure you've added the custom domain in GitHub Pages settings
2. Wait 10-15 minutes for GitHub to provision the SSL certificate
3. Check that "Enforce HTTPS" is enabled in GitHub Pages settings

### Issue: 404 Error

**Check**:
1. GitHub Actions deployment completed successfully
2. Repository name matches the base path in `vite.config.ts` (if using default GitHub Pages URL)
3. For custom domain, base path should be `/` (already configured)

### Issue: CNAME Record Not Working

**Verify**:
1. The CNAME value is exactly `your-username.github.io` (no `https://`, no trailing slash)
2. The Name field is exactly `plotpulse` (no domain suffix)
3. There are no conflicting A records for `plotpulse`

---

## Quick Reference

| Setting | Value |
|---------|-------|
| **Record Type** | CNAME |
| **Name** | `plotpulse` |
| **Value** | `your-username.github.io` |
| **TTL** | `600` (10 minutes) |
| **GitHub Custom Domain** | `plotpulse.syrez.co.in` |
| **Final URL** | `https://plotpulse.syrez.co.in` |

---

## Visual Guide

### GoDaddy DNS Record Entry

```
┌─────────────────────────────────────────┐
│ Type: CNAME                             │
│ Name: plotpulse                          │
│ Value: your-username.github.io          │
│ TTL: 600                                 │
└─────────────────────────────────────────┘
```

### GitHub Pages Settings

```
┌─────────────────────────────────────────┐
│ Custom domain                           │
│ ┌─────────────────────────────────────┐ │
│ │ plotpulse.syrez.co.in               │ │
│ └─────────────────────────────────────┘ │
│ ☑ Enforce HTTPS                         │
└─────────────────────────────────────────┘
```

---

## Next Steps

After DNS is configured:

1. ✅ Push your code to GitHub
2. ✅ Wait for GitHub Actions to deploy
3. ✅ Verify the site loads at `https://plotpulse.syrez.co.in`
4. ⚠️ **Important**: Update backend CORS to allow `https://plotpulse.syrez.co.in`

---

*Last Updated: Based on current GitHub Pages and GoDaddy configuration*

