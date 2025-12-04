# Railway Environment Variables Setup

## Required Environment Variables

### 1. JWT_SECRET (REQUIRED)
**This is causing your current crash!**

Generated secure JWT secret:
```
5Bm9beXKU/sYEBBVJiho28/hBb2BmRWnLYxHUa7KdAIY8y73tBBmJSnSLHPNsQt4Io1L2MM0qU7qmgELBr9eoQ==
```

**How to set in Railway:**
1. Go to your Railway project
2. Click on your backend service
3. Go to the **"Variables"** tab
4. Click **"+ New Variable"**
5. Set:
   - **Name:** `JWT_SECRET`
   - **Value:** `5Bm9beXKU/sYEBBVJiho28/hBb2BmRWnLYxHUa7KdAIY8y73tBBmJSnSLHPNsQt4Io1L2MM0qU7qmgELBr9eoQ==`
6. Click **"Add"**
7. The service will automatically redeploy

### 2. SPRING_PROFILES_ACTIVE (REQUIRED)
Should be set to `prod`:
- **Name:** `SPRING_PROFILES_ACTIVE`
- **Value:** `prod`

### 3. Database Variables (AUTO-PROVIDED)
Railway automatically provides these when you connect a PostgreSQL service:
- `DATABASE_URL` (or individual `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`)
- These are automatically set - **don't manually set them**

### 4. PORT (AUTO-PROVIDED)
Railway automatically sets the `PORT` variable - **don't manually set it**

## Optional Environment Variables

These have defaults but you can override them:

- `JWT_EXPIRATION` (default: 86400000 ms = 24 hours)
- `JWT_REFRESH_EXPIRATION` (default: 604800000 ms = 7 days)
- `FRONTEND_URL` (default: https://plotpulse.syrez.co.in)
- `LOG_FILE_PATH` (default: ./logs/plotpulse.log)

## Quick Setup Checklist

- [ ] Set `JWT_SECRET` in Railway Variables
- [ ] Verify `SPRING_PROFILES_ACTIVE=prod` is set
- [ ] Verify PostgreSQL service is connected (database variables auto-provided)
- [ ] Redeploy service after adding variables

## Testing Locally Against Railway Backend

1. Get your Railway backend URL:
   - In Railway → Your service → Settings → Generate Domain
   - Or use the provided domain (e.g., `https://plot-pulse-production.up.railway.app`)

2. Create/update `frontend/.env.development`:
   ```env
   VITE_API_BASE_URL=https://YOUR_RAILWAY_URL/api/v1
   VITE_APP_NAME=PlotPulse (Dev)
   VITE_APP_ENV=development
   VITE_ENABLE_DEBUG=true
   ```

3. Replace `YOUR_RAILWAY_URL` with your actual Railway domain (without `/api/v1`)

4. Start your local frontend:
   ```powershell
   cd frontend
   npm run dev
   ```

5. Your local frontend will now connect to the Railway backend!

## Troubleshooting

### App crashes immediately after deployment
- Check that `JWT_SECRET` is set in Railway Variables
- Check that `SPRING_PROFILES_ACTIVE=prod` is set
- View logs in Railway → Your service → Deployments → Click on latest deployment → View logs

### CORS errors when testing locally
- The production CORS config already includes `http://localhost:5173`, `http://localhost:4173`, and `http://localhost:3000`
- If you're using a different port, you may need to add it to `application-prod.yml`

### Database connection errors
- Verify PostgreSQL service is connected in Railway
- Check that PostGIS extension is enabled (run `\dx` in `psql` to verify)
- Verify `DATABASE_URL` or `PG*` variables are present in Railway Variables tab

