# Railway Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Script start.sh not found" or "Railpack could not determine how to build the app"

**Problem**: Railway can't find your build configuration.

**Solution 1: Set Root Directory (Most Common Fix)**

1. Go to your Railway service
2. Click **Settings** tab
3. Scroll to **"Root Directory"** section
4. Set it to: `backend`
5. Click **Save**
6. Redeploy the service

**Solution 2: Configure Build Settings Manually**

1. Go to your service → **Settings** → **"Build & Deploy"**
2. Under **"Build Command"**: Leave empty (for Dockerfile builds)
3. Under **"Dockerfile Path"**: Set to `backend/Dockerfile`
4. Under **"Root Directory"**: Set to `backend`
5. Click **Save**
6. Redeploy

**Solution 3: Use Railway TOML (Alternative)**

If the above doesn't work, Railway should detect the `railway.toml` file in the root directory. This file is already created and should work.

**Solution 4: Check Dockerfile Location**

Make sure your Dockerfile is at: `backend/Dockerfile`

Verify by checking:
- File exists: `backend/Dockerfile`
- File is committed to Git
- File is in the correct location

---

### Issue: "failed to solve: failed to compute cache key: '/src': not found"

**Problem**: Docker can't find the `src/` directory because Railway builds from the root, but Dockerfile expects files relative to `backend/`.

**Solution**: The Dockerfile has been updated to work with Railway's build context. Make sure you have the latest version:

1. The Dockerfile should copy from `backend/pom.xml` and `backend/src/`
2. If you still see this error, verify the Dockerfile has:
   ```dockerfile
   COPY backend/pom.xml ./pom.xml
   COPY backend/src/ ./src/
   ```
3. Commit and push the updated Dockerfile
4. Redeploy in Railway

---

### Issue: "Cannot connect to database"

**Problem**: Backend can't connect to PostgreSQL.

**Solutions**:

1. **Check Environment Variables**:
   - Go to PostgreSQL service → **Variables** tab
   - Verify `DATABASE_URL` is set (Railway sets this automatically)
   - Copy the `DATABASE_URL` value

2. **Check Backend Service Variables**:
   - Go to your backend service → **Variables** tab
   - Verify `DATABASE_URL` is available (Railway should auto-inject it)
   - If not, add it manually from PostgreSQL service

3. **Verify Database is Running**:
   - Go to PostgreSQL service
   - Check **Metrics** tab - should show active connections
   - Check **Logs** tab for any errors

4. **Check PostGIS Extension**:
   - Go to PostgreSQL → **Query** tab
   - Run: `SELECT * FROM pg_extension WHERE extname = 'postgis';`
   - If empty, enable PostGIS (see main deployment guide)

---

### Issue: Build fails with "Tests failed"

**Problem**: Maven tests are failing during build.

**Solutions**:

1. **Check Test Logs**:
   - Go to service → **Deployments** tab
   - Click on failed deployment
   - Check build logs for specific test failures

2. **Temporarily Skip Tests** (for debugging only):
   - Update `backend/Dockerfile` line 8:
     ```dockerfile
     RUN mvn clean package -DskipTests
     ```
   - **⚠️ Only for debugging!** Fix tests and revert this change

3. **Fix Tests**:
   - Run tests locally: `cd backend && mvn test`
   - Fix failing tests
   - Commit and push

---

### Issue: "Extension postgis does not exist"

**Problem**: PostGIS extension is not enabled in the database.

**Solution**:

1. Go to PostgreSQL service → **Query** tab
2. Run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS postgis_topology;
   ```
3. Verify:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'postgis';
   ```

---

### Issue: "Table does not exist" or Schema errors

**Problem**: Database tables haven't been created.

**Solutions**:

1. **Run Database Setup Script**:
   - Go to PostgreSQL → **Query** tab
   - Copy contents of `backend/src/main/resources/db/railway_setup.sql`
   - Paste and execute

2. **Check Hibernate DDL Mode**:
   - In `application-prod.yml`, verify:
     ```yaml
     spring:
       jpa:
         hibernate:
           ddl-auto: validate  # Should be 'validate' in production
     ```
   - For initial setup only, you can temporarily use `update`, then change back to `validate`

3. **Run Migrations Manually**:
   - Copy each migration file from `backend/src/main/resources/db/migration/`
   - Run them one by one in PostgreSQL Query tab

---

### Issue: CORS errors from frontend

**Problem**: Frontend can't make API calls due to CORS.

**Solutions**:

1. **Check CORS Configuration**:
   - Go to backend service → **Variables** tab
   - Verify `FRONTEND_URL` is set to: `https://plotpulse.syrez.co.in`
   - If using www version, also set `FRONTEND_URL_WWW`

2. **Check Backend Logs**:
   - Go to backend service → **Logs** tab
   - Look for CORS-related errors
   - Verify CORS configuration is loaded

3. **Verify Frontend URL**:
   - Make sure frontend is actually deployed at `https://plotpulse.syrez.co.in`
   - Check browser console for exact CORS error message

---

### Issue: JWT authentication fails

**Problem**: Users can't log in or tokens are invalid.

**Solutions**:

1. **Check JWT_SECRET**:
   - Go to backend service → **Variables** tab
   - Verify `JWT_SECRET` is set
   - Make sure it's a long, random string (64+ characters)
   - Generate new one if needed: `openssl rand -base64 64`

2. **Verify Secret Format**:
   - Secret should be base64 encoded
   - No spaces or newlines
   - Copy-paste carefully

3. **Check Token Expiration**:
   - Verify `JWT_EXPIRATION` is set (default: 86400000 = 24 hours)
   - Check if tokens are expiring too quickly

---

### Issue: Service won't start or crashes immediately

**Problem**: Backend service fails to start.

**Solutions**:

1. **Check Logs**:
   - Go to service → **Logs** tab
   - Look for error messages at startup
   - Common issues:
     - Missing environment variables
     - Database connection failures
     - Port conflicts

2. **Check Environment Variables**:
   - Go to service → **Variables** tab
   - Verify all required variables are set:
     - `SPRING_PROFILES_ACTIVE=prod`
     - `JWT_SECRET` (required)
     - `DATABASE_URL` (should be auto-injected from PostgreSQL)

3. **Check Port Configuration**:
   - Railway uses `PORT` environment variable (not `SERVER_PORT`)
   - Update `application-prod.yml`:
     ```yaml
     server:
       port: ${PORT:8091}
     ```
   - Or set `SERVER_PORT` in Railway variables

4. **Check Memory Limits**:
   - Go to service → **Settings** → **Resources**
   - Increase memory if needed (default: 512MB)
   - Java apps typically need 512MB-1GB minimum

---

### Issue: Build takes too long or times out

**Problem**: Docker build is slow or fails due to timeout.

**Solutions**:

1. **Optimize Dockerfile**:
   - The current Dockerfile already caches Maven dependencies
   - Make sure `pom.xml` is copied before `src/` (already done)

2. **Check Build Logs**:
   - Go to service → **Deployments** tab
   - Check which step is taking long
   - Maven dependency download can be slow on first build

3. **Use Railway Build Cache**:
   - Railway should cache Docker layers automatically
   - Subsequent builds should be faster

---

### Issue: Can't access database from external tools

**Problem**: Can't connect to Railway PostgreSQL from local machine.

**Solutions**:

1. **Get Connection Details**:
   - Go to PostgreSQL service → **Variables** tab
   - Copy: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

2. **Use Railway CLI**:
   ```bash
   railway connect postgres
   ```

3. **Check Network Access**:
   - Railway databases are not publicly accessible by default
   - Use Railway CLI or Railway dashboard Query tab
   - For external access, you may need Railway Pro plan

---

### Issue: Environment variables not working

**Problem**: Changes to environment variables don't take effect.

**Solutions**:

1. **Redeploy After Changes**:
   - After changing variables, click **"Redeploy"** button
   - Or push a new commit to trigger redeploy

2. **Check Variable Names**:
   - Variable names are case-sensitive
   - Use exact names: `SPRING_PROFILES_ACTIVE`, `JWT_SECRET`, etc.

3. **Check Variable Values**:
   - No leading/trailing spaces
   - No quotes needed (Railway adds them automatically)
   - For multi-line values, use proper formatting

---

## Getting Help

If none of these solutions work:

1. **Check Railway Status**: https://status.railway.app
2. **Railway Discord**: https://discord.gg/railway
3. **Railway Docs**: https://docs.railway.app
4. **Check Service Logs**: Service → **Logs** tab for detailed error messages

---

*Last Updated: Based on Railway's current platform*

