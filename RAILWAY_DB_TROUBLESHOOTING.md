# Railway Database Connection Troubleshooting

## Quick Diagnosis Steps

### Step 1: Check Database Service Status
1. Go to Railway Dashboard → Your PostGIS service
2. Verify status shows **"Running"** (green)
3. If not running, click **"Deploy"** or **"Start"**

### Step 2: Verify Environment Variables

In your **plot-pulse** (backend) service → **Variables** tab, ensure these exist:

| Variable | Expected Value | Notes |
|----------|---------------|-------|
| `PGHOST` | `postgis.railway.internal` or external hostname | Internal is faster, external works if internal fails |
| `PGPORT` | `5432` (internal) or external port | Check PostGIS service Variables tab |
| `PGDATABASE` | `railway` | Default Railway database name |
| `PGUSER` | `postgres` | Default PostgreSQL user |
| `PGPASSWORD` | (from PostGIS service) | Copy from PostGIS → Variables → `POSTGRES_PASSWORD` |
| `SPRING_PROFILES_ACTIVE` | `prod,railway` | **REQUIRED** - Enables Railway config |
| `JWT_SECRET` | (secure random string) | **REQUIRED** - Generate if missing |

### Step 3: Link Database Service (Recommended)

1. Go to **plot-pulse** service → **Settings** tab
2. Scroll to **"Service References"** or **"Connected Services"**
3. Click **"Add Reference"** or **"Connect Service"**
4. Select your **PostGIS** service
5. Railway will automatically add database variables

### Step 4: Test Database Connection

**Option A: Railway CLI**
```powershell
# Install Railway CLI if not installed
# npm install -g @railway/cli

# Login
railway login

# Connect to database
railway connect postgis

# Test connection (you should see psql prompt)
# Type: SELECT version();
# Type: \q to exit
```

**Option B: Check PostGIS Service Variables**
1. Go to PostGIS service → **Variables** tab
2. Note the connection details:
   - Internal: `postgis.railway.internal:5432`
   - External: Check **"Connect"** tab for public hostname and port

### Step 5: Try External Connection (If Internal Fails)

If `postgis.railway.internal` doesn't work:

1. Go to PostGIS service → **Variables** tab
2. Find the external hostname (usually in **"Connect"** tab or as `PGHOST` variable)
3. Update backend service variables:
   - `PGHOST` = (external hostname, e.g., `shortline.proxy.rlwy.net`)
   - `PGPORT` = (external port, e.g., `34889`)
   - `PGSSLMODE` = `require` (required for external connections)

### Step 6: Check Service Logs

1. Go to **plot-pulse** service → **Deployments** tab
2. Click on the latest deployment
3. Check **"Logs"** tab for detailed error messages
4. Look for:
   - Connection timeout errors
   - Authentication failures
   - Network unreachable errors

### Step 7: Verify Database is Ready

The database might be starting up. Wait 1-2 minutes after:
- Creating a new database service
- Restarting the database service
- Deploying the backend service

### Step 8: Check Network Configuration

1. Ensure both services are in the **same Railway project**
2. Verify the backend service can reach the database:
   - Services in the same project can communicate internally
   - If services are in different projects, use external connection

## Common Issues and Solutions

### Issue: "Connection timed out"

**Possible Causes:**
1. Database service is not running
2. Wrong `PGHOST` value (using external when should use internal, or vice versa)
3. Services not in the same project
4. Database service is still starting up

**Solutions:**
- Verify database service is running
- Try switching between internal (`postgis.railway.internal`) and external hostname
- Wait 1-2 minutes and retry
- Check Railway status page for outages

### Issue: "Authentication failed"

**Possible Causes:**
1. Wrong `PGPASSWORD` value
2. Wrong `PGUSER` value

**Solutions:**
- Copy `POSTGRES_PASSWORD` from PostGIS service → Variables tab
- Verify `PGUSER` is `postgres` (default)

### Issue: "Database does not exist"

**Possible Causes:**
1. Wrong `PGDATABASE` value
2. Database not created yet

**Solutions:**
- Default Railway database name is `railway`
- Verify in PostGIS service → Variables → `PGDATABASE`

### Issue: "Connection refused"

**Possible Causes:**
1. Wrong port number
2. Database service not accepting connections

**Solutions:**
- Internal port: `5432`
- External port: Check PostGIS service → Connect tab
- Verify database service is running

## Quick Fix Checklist

- [ ] PostGIS service is **Running** (green status)
- [ ] Backend service has all required environment variables
- [ ] `SPRING_PROFILES_ACTIVE=prod,railway` is set
- [ ] Database service is linked/referenced in backend service
- [ ] `PGPASSWORD` matches `POSTGRES_PASSWORD` from PostGIS service
- [ ] Waited 1-2 minutes after service creation/restart
- [ ] Both services are in the same Railway project
- [ ] Tried both internal and external hostnames

## Still Not Working?

1. **Check Railway Status**: https://status.railway.app
2. **Restart Both Services**: 
   - Stop PostGIS service → Start it
   - Redeploy backend service
3. **Create Fresh Database Service**:
   - Create a new PostGIS service
   - Link it to backend
   - Run `railway_setup.sql` manually if needed
4. **Contact Railway Support**: If all else fails, check Railway documentation or support

