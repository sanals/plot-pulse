# Railway Deployment Guide - PlotPulse Backend

Complete guide for deploying PlotPulse backend to Railway with PostGIS database.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [PostGIS Database Setup](#postgis-database-setup)
4. [Backend Configuration](#backend-configuration)
5. [Networking & Port Configuration](#networking--port-configuration)
6. [Testing & Verification](#testing--verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Railway account: https://railway.app (Sign up with GitHub)
- GitHub repository with your backend code
- Railway CLI (optional, for database access): `npm i -g @railway/cli`

---

## Initial Setup

### 1. Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository (`plot-pulse`)
4. Railway will create a service automatically

### 2. Configure Service Root Directory

**⚠️ CRITICAL:** Railway needs to know where your Dockerfile is.

1. Go to your service → **Settings** tab
2. Find **"Root Directory"** setting
3. Set it to: `backend`
4. This tells Railway to look for `backend/Dockerfile`

---

## PostGIS Database Setup

### Step 1: Create PostGIS Service

**Important:** Use PostGIS, NOT regular PostgreSQL!

1. In Railway project, click **"+ New"** → **"Database"**
2. Select **"Add PostGIS"** (not PostgreSQL)
3. Wait for deployment (green checkmark = "Deployment Online")

### Step 2: Enable PostGIS Extensions

**Option A: Using Railway CLI (Recommended)**

```powershell
# Connect to PostGIS
railway connect postgis

# In psql prompt, run:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

# Verify:
\dx

# Exit:
\q
```

**Option B: Using Railway Dashboard**

1. Go to PostGIS service → **"Database"** tab
2. Use the SQL editor (if available)
3. Run the same SQL commands

### Step 3: Get Database Connection Variables

1. Go to PostGIS service → **"Variables"** tab
2. Note these values (you'll need them):
   - `PGHOST` = `postgis.railway.internal` (for internal connection)
   - `PGPORT` = `5432`
   - `PGDATABASE` = `railway` (default database name)
   - `PGUSER` = `postgres`
   - `POSTGRES_PASSWORD` = (copy this value - this is the actual password)

---

## Backend Configuration

### Step 1: Connect Database to Backend Service

**Option A: Add Reference (If Available)**

1. Go to **plot-pulse** service → **"Variables"** tab
2. Click **"Add Reference"** button
3. Select your **PostGIS** service
4. Railway will automatically add database variables

**Option B: Manual Setup (If Reference Not Available)**

1. Go to **plot-pulse** service → **"Variables"** tab
2. Add these variables manually (copy from PostGIS Variables tab):

| Variable | Value |
|----------|-------|
| `PGHOST` | `postgis.railway.internal` |
| `PGPORT` | `5432` |
| `PGDATABASE` | `railway` |
| `PGUSER` | `postgres` |
| `PGPASSWORD` | (copy from PostGIS `POSTGRES_PASSWORD`) |

### Step 2: Set Required Application Variables

In **plot-pulse** service → **"Variables"** tab, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod,railway` | **REQUIRED** - Use `prod,railway` to enable Railway-specific overrides |
| `JWT_SECRET` | (generate secure secret) | **REQUIRED** - See below |
| `FRONTEND_URL` | `https://plotpulse.syrez.co.in` | Optional - for CORS |

**Note:** Using `prod,railway` profile enables Railway-specific configurations:
- Server binds to `0.0.0.0` (required for Railway networking)
- Uses `PORT` environment variable (Railway's convention)
- Database defaults to `railway` (Railway's default database name)
- SSL mode set to `disable` for internal connections (Railway's internal network)

**Generate JWT_SECRET:**

```powershell
# PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Or use this pre-generated one (for testing only - generate new for production):
```
5Bm9beXKU/sYEBBVJiho28/hBb2BmRWnLYxHUa7KdAIY8y73tBBmJSnSLHPNsQt4Io1L2MM0qU7qmgELBr9eoQ==
```

### Step 3: Verify All Variables

Your **plot-pulse** service should have:

✅ `SPRING_PROFILES_ACTIVE=prod,railway` (use `prod,railway` to enable Railway-specific overrides)
✅ `JWT_SECRET` (secure value)
✅ `PGHOST=postgis.railway.internal`
✅ `PGPORT=5432`
✅ `PGDATABASE=railway`
✅ `PGUSER=postgres`
✅ `PGPASSWORD` (from PostGIS)

---

## Networking & Port Configuration

### ⚠️ CRITICAL: Port Configuration

**This is the most common issue causing 502 errors!**

1. Go to **plot-pulse** service → **Settings** → **Networking**
2. Check the **"Custom port"** setting:
   - **Option 1 (Recommended):** Select **"Default"** or **"Auto"** from dropdown
     - This lets Railway auto-detect the port from the `PORT` environment variable
   - **Option 2:** Manually set to match what the backend is using
     - Check deployment logs for: `🚀 Server started successfully! Listening on: 0.0.0.0:XXXX`
     - Set the port to match (usually `8080`)

3. **Important:** The backend uses Railway's `PORT` environment variable automatically
   - Backend config: `server.port: ${PORT:${SERVER_PORT:8091}}`
   - Railway sets `PORT` automatically - don't override it manually

### Get Your Public Domain

1. Go to **plot-pulse** service → **Settings** → **Networking**
2. Your public domain will be shown: `plot-pulse-production.up.railway.app`
3. Your API base URL: `https://plot-pulse-production.up.railway.app/api/v1`

---

## Testing & Verification

### 1. Check Deployment Logs

Go to **plot-pulse** → **Deployments** → Latest deployment → View logs

**Success indicators:**
```
🚀 Server started successfully!
   Listening on: 0.0.0.0:8080
   Context path: /api/v1
Started ProjectApplication in XX seconds
```

**Error indicators:**
- `Connection to localhost:5432 refused` → Database variables not set
- `Could not resolve placeholder 'JWT_SECRET'` → JWT_SECRET not set
- `Unsupported Database: PostgreSQL 16.9` → Flyway PostgreSQL driver missing (should be fixed)

### 2. Test Health Endpoint

Open in browser:
- `https://plot-pulse-production.up.railway.app/api/v1/health`
- Should return: `{"status":"SUCCESS","message":"Application is running",...}`

### 3. Test from Frontend

1. Update `frontend/.env.development`:
   ```env
   VITE_API_BASE_URL=https://plot-pulse-production.up.railway.app/api/v1
   ```

2. Start frontend:
   ```powershell
   cd frontend
   npm run dev
   ```

3. Test API calls - should work without CORS errors

---

## Troubleshooting

### Issue: "Application failed to respond" / 502 Bad Gateway

**Cause:** Port mismatch between Railway networking and backend

**Solution:**
1. Check deployment logs for actual port: `🚀 Server started successfully! Listening on: 0.0.0.0:XXXX`
2. Go to Settings → Networking → "Custom port" dropdown
3. **Option 1 (Recommended):** Select **"Default"** or **"Auto"** to auto-detect from `PORT` env var
4. **Option 2:** Manually set port to match what backend is using (usually `8080`)
5. Click **"Update"** and wait for redeploy

**Important:** Backend uses `${PORT}` environment variable. Railway sets this automatically - don't override it manually.

### Issue: "Connection to localhost:5432 refused"

**Cause:** Database variables not set or wrong values

**Solution:**
1. Verify all `PG*` variables are set in plot-pulse service
2. Use `postgis.railway.internal` for `PGHOST` (internal connection)
3. Use `POSTGRES_PASSWORD` value from PostGIS service (not `PGPASSWORD`)

### Issue: "Could not resolve placeholder 'JWT_SECRET'"

**Cause:** JWT_SECRET environment variable not set

**Solution:**
1. Go to plot-pulse → Variables
2. Add `JWT_SECRET` with a secure value
3. Redeploy

### Issue: "Schema-validation: missing table [table_name]"

**Cause:** Flyway migrations not running

**Solution:**
1. Verify `spring.flyway.enabled=true` in `application-prod.yml`
2. Check Flyway dependency in `pom.xml`:
   ```xml
   <dependency>
       <groupId>org.flywaydb</groupId>
       <artifactId>flyway-core</artifactId>
       <version>10.20.1</version>
   </dependency>
   <dependency>
       <groupId>org.flywaydb</groupId>
       <artifactId>flyway-database-postgresql</artifactId>
       <version>10.20.1</version>
   </dependency>
   ```
3. Check migration files exist in `backend/src/main/resources/db/migration/`

### Issue: CORS Errors from Frontend

**Cause:** CORS not configured or origin not allowed

**Solution:**
1. Verify `http://localhost:5173` is in `application-prod.yml` CORS allowed-origins
2. Check backend logs for CORS configuration
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: "Unsupported Database: PostgreSQL 16.9"

**Cause:** Flyway version doesn't support PostgreSQL 16

**Solution:**
- Ensure both Flyway dependencies are in `pom.xml`:
  ```xml
  <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-core</artifactId>
      <version>10.20.1</version>
  </dependency>
  <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-database-postgresql</artifactId>
      <version>10.20.1</version>
  </dependency>
  ```

### Issue: "Script start.sh not found" or "Railpack could not determine how to build"

**Cause:** Railway can't find build configuration

**Solution:**
1. Go to service → **Settings** → **Root Directory**
2. Set to: `backend`
3. Redeploy

### Issue: Build fails with "/src: not found" or "/backend/src: not found"

**Cause:** Dockerfile paths incorrect for Railway build context

**Solution:**
- Dockerfile should use: `COPY backend/pom.xml ./pom.xml` and `COPY backend/src/ ./src/`
- This is already configured correctly in the current Dockerfile

### Issue: Build fails with test errors

**Cause:** Maven tests failing during Docker build

**Solution:**
- Tests are skipped during Docker build using `-Dmaven.test.skip=true`
- If tests fail locally, run: `cd backend && mvn test` to fix them

---

## Database Access

### Method 1: Railway CLI (Easiest)

```powershell
# Connect to PostGIS
railway connect postgis

# Now you're in psql - run SQL commands directly
SELECT * FROM users;
\q  # to exit
```

### Method 2: Railway Dashboard

1. Go to PostGIS service → **"Database"** tab
2. Use SQL editor (if available)

### Method 3: External Client

1. PostGIS service → **Variables** tab
2. Copy connection details:
   - Host: `shortline.proxy.rlwy.net` (external) or `postgis.railway.internal` (internal)
   - Port: `34889` (external) or `5432` (internal)
   - Database: `railway`
   - Username: `postgres`
   - Password: (from `POSTGRES_PASSWORD`)
3. Connect with pgAdmin, DBeaver, or TablePlus

---

## Quick Reference Checklist

- [ ] Railway project created
- [ ] Service root directory set to `backend`
- [ ] PostGIS service created (not regular PostgreSQL)
- [ ] PostGIS extensions enabled (`postgis`, `postgis_topology`)
- [ ] Database variables added to plot-pulse service:
  - [ ] `PGHOST=postgis.railway.internal`
  - [ ] `PGPORT=5432`
  - [ ] `PGDATABASE=railway`
  - [ ] `PGUSER=postgres`
  - [ ] `PGPASSWORD` (from PostGIS)
- [ ] Application variables set:
  - [ ] `SPRING_PROFILES_ACTIVE=prod`
  - [ ] `JWT_SECRET` (secure value)
- [ ] Networking port configured (Default/Auto or match backend port)
- [ ] Backend deployed successfully (check logs)
- [ ] Health endpoint responds: `/api/v1/health`
- [ ] Frontend `.env.development` updated with Railway URL
- [ ] Test API calls from frontend work

---

## Important Notes

1. **Always use PostGIS template**, not regular PostgreSQL
2. **Use internal hostname** (`postgis.railway.internal`) for faster connections
3. **Port configuration is critical** - mismatch causes 502 errors
4. **Flyway migrations run automatically** on startup (if enabled)
5. **Database name is `railway`** by default (Railway's convention)
6. **CORS is configured** for `localhost:5173` - add production domains when ready

---

## Next Steps

After successful deployment:
1. Update frontend production environment variables
2. Configure custom domain (if needed)
3. Set up monitoring and alerts
4. Review security settings
5. Set up backups for PostGIS database

