# Railway Deployment Guide for PlotPulse Backend

This guide will help you deploy the PlotPulse backend to Railway and set up the PostgreSQL database.

## Prerequisites

1. Railway account: https://railway.app (Sign up with GitHub)
2. GitHub repository with your backend code
3. Railway CLI (optional, for local testing)

---

## Step 1: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will detect the `backend/` directory automatically

---

## Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. **Important**: Railway will automatically set the `DATABASE_URL` environment variable

### Database Connection Details

Railway provides these environment variables automatically:
- `DATABASE_URL` - Full connection string: `postgresql://user:password@host:port/database`
- `PGHOST` - Database host
- `PGPORT` - Database port (usually 5432)
- `PGDATABASE` - Database name
- `PGUSER` - Database username
- `PGPASSWORD` - Database password

**You don't need to manually set these!** Railway does it automatically.

---

## Step 3: Configure Environment Variables

In your Railway service, go to **Variables** tab and add:

### Required Variables

1. **SPRING_PROFILES_ACTIVE**
   - Value: `prod`

2. **JWT_SECRET** (REQUIRED)
   - Generate a secure secret:
     ```bash
     # Using OpenSSL
     openssl rand -base64 64
     
     # Or using Node.js
     node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
     ```
   - Copy the output and paste as the value

3. **FRONTEND_URL**
   - Value: `https://plotpulse.syrez.co.in`

4. **FRONTEND_URL_WWW** (optional)
   - Value: `https://www.plotpulse.syrez.co.in`

5. **APP_BASE_URL** (optional)
   - Value: Your Railway backend URL (e.g., `https://your-app.railway.app/api`)

### Optional Variables

- **SERVER_PORT**: `8091` (default)
- **JWT_EXPIRATION**: `86400000` (24 hours, default)
- **JWT_REFRESH_EXPIRATION**: `604800000` (7 days, default)

---

## Step 4: Configure Service Settings

1. Go to your service **Settings**
2. Set **Root Directory** to: `backend`
3. Set **Build Command** (if needed): Railway will auto-detect Dockerfile
4. Set **Start Command**: Railway will use the Dockerfile's ENTRYPOINT

---

## Step 5: Enable PostGIS Extension

Railway PostgreSQL doesn't have PostGIS enabled by default. You need to enable it:

### Option A: Using Railway Dashboard (Recommended)

1. Go to your PostgreSQL database service
2. Click **"Query"** tab
3. Run this SQL:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS postgis_topology;
   ```

### Option B: Using Railway CLI

```bash
railway connect postgres
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;"
```

### Option C: Using a Migration Script

Create a file `backend/src/main/resources/db/migration/V1__enable_postgis.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

---

## Step 6: Run Database Migrations

After PostGIS is enabled, you need to run your database migrations:

### Option A: Using Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Connect to database and run migrations
railway connect postgres
psql $DATABASE_URL < backend/src/main/resources/db/migration_add_name_column.sql
psql $DATABASE_URL < backend/src/main/resources/db/migration_add_price_unit.sql
```

### Option B: Using Railway Dashboard

1. Go to your PostgreSQL service
2. Click **"Query"** tab
3. Copy and paste the contents of your migration files one by one
4. Execute each migration

### Option C: Let Hibernate Create Tables (First Time Only)

**⚠️ Only for initial setup!**

Temporarily change in `application-prod.yml`:
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: update  # Change from 'validate' to 'update'
```

After first deployment, change it back to `validate`.

---

## Step 7: Deploy

1. Railway will automatically deploy when you push to your connected branch
2. Or click **"Deploy"** in the Railway dashboard
3. Check the **"Deployments"** tab for build logs
4. Check the **"Logs"** tab for runtime logs

---

## Step 8: Get Your Backend URL

1. Go to your service **Settings**
2. Under **"Networking"**, click **"Generate Domain"**
3. Copy the generated URL (e.g., `https://your-app.railway.app`)
4. Your API will be available at: `https://your-app.railway.app/api/v1`

---

## Step 9: Update Frontend

Update your GitHub Pages deployment:

1. Go to GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Update or add secret:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://your-app.railway.app/api/v1`
3. Trigger a new deployment (push to main or manually trigger)

---

## Accessing the Database

### Method 1: Railway Dashboard (Easiest)

1. Go to your PostgreSQL service in Railway
2. Click **"Query"** tab
3. You can run SQL queries directly in the browser
4. Click **"Data"** tab to view tables and data

### Method 2: Railway CLI

```bash
# Connect to database
railway connect postgres

# This will open a psql session
# You can now run SQL commands
```

### Method 3: External Database Client

1. Go to your PostgreSQL service → **Variables** tab
2. Copy the connection details:
   - **Host**: From `PGHOST` or parse from `DATABASE_URL`
   - **Port**: From `PGPORT` or parse from `DATABASE_URL`
   - **Database**: From `PGDATABASE` or parse from `DATABASE_URL`
   - **Username**: From `PGUSER` or parse from `DATABASE_URL`
   - **Password**: From `PGPASSWORD` or parse from `DATABASE_URL`

2. Use a database client:
   - **pgAdmin**: https://www.pgadmin.org/
   - **DBeaver**: https://dbeaver.io/
   - **TablePlus**: https://tableplus.com/
   - **VS Code Extension**: "PostgreSQL" by Chris Kolkman

3. Connect using the credentials from Railway

### Method 4: Connection String

Railway provides `DATABASE_URL` in this format:
```
postgresql://user:password@host:port/database
```

You can use this directly with:
- **psql**: `psql $DATABASE_URL`
- **Database clients**: Most support connection strings
- **pgAdmin**: Use "Server" → "Properties" → "Connection" and parse the URL

---

## Database Connection Examples

### Using psql (Command Line)

```bash
# If you have DATABASE_URL set
psql $DATABASE_URL

# Or with individual variables
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE
```

### Using pgAdmin

1. Right-click **"Servers"** → **"Create"** → **"Server"**
2. **General** tab:
   - Name: `Railway PlotPulse`
3. **Connection** tab:
   - Host: `$PGHOST` (from Railway)
   - Port: `$PGPORT` (usually 5432)
   - Database: `$PGDATABASE`
   - Username: `$PGUSER`
   - Password: `$PGPASSWORD`
4. Click **"Save"**

### Using DBeaver

1. **Database** → **New Database Connection**
2. Select **PostgreSQL**
3. Fill in:
   - Host: `$PGHOST`
   - Port: `$PGPORT`
   - Database: `$PGDATABASE`
   - Username: `$PGUSER`
   - Password: `$PGPASSWORD`
4. Click **"Test Connection"**
5. Click **"Finish"**

---

## Troubleshooting

### Issue: "Extension postgis does not exist"

**Solution**: Enable PostGIS (see Step 5)

### Issue: "Connection refused" or "Cannot connect to database"

**Check**:
1. Database service is running in Railway
2. Environment variables are set correctly
3. `DATABASE_URL` format is correct

### Issue: "Table does not exist"

**Solution**: Run database migrations (see Step 6)

### Issue: Build fails with "Tests failed"

**Solution**: The Dockerfile already runs tests. If you need to skip tests temporarily:
- Update `backend/Dockerfile` line 8 to: `RUN mvn clean package -DskipTests`
- **⚠️ Only for debugging!** Revert after fixing tests.

### Issue: CORS errors from frontend

**Check**:
1. `FRONTEND_URL` is set to `https://plotpulse.syrez.co.in`
2. Backend logs show CORS configuration
3. Frontend is calling the correct backend URL

### Issue: JWT authentication fails

**Check**:
1. `JWT_SECRET` is set and matches between deployments
2. Secret is base64 encoded
3. No extra spaces or newlines in the secret

---

## Monitoring and Logs

### View Logs

1. Go to your service in Railway
2. Click **"Logs"** tab
3. Real-time logs are displayed
4. You can filter and search logs

### Metrics

1. Go to your service → **"Metrics"** tab
2. View:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

### Database Metrics

1. Go to your PostgreSQL service → **"Metrics"** tab
2. View:
   - Connection count
   - Query performance
   - Storage usage

---

## Cost Considerations

### Railway Free Tier

- **$5 credit** per month
- **500 hours** of usage
- **512 MB RAM** per service
- **1 GB storage** for databases

### Paid Plans

- **Starter**: $5/month - More resources
- **Developer**: $20/month - Even more resources
- **Team**: Custom pricing

**Note**: For a small application like PlotPulse, the free tier should be sufficient initially.

---

## Security Best Practices

1. ✅ **Never commit** `.env` files or secrets to Git
2. ✅ **Use Railway's built-in secrets** (Variables tab)
3. ✅ **Generate strong JWT secrets** (64+ characters)
4. ✅ **Use strong database passwords** (Railway generates these)
5. ✅ **Enable HTTPS** (Railway does this automatically)
6. ✅ **Restrict CORS** to your frontend domain only
7. ✅ **Use `validate` for Hibernate** in production (not `update`)

---

## Quick Reference

### Railway Service URLs

- **Dashboard**: https://railway.app
- **Your Project**: https://railway.app/project/your-project-id
- **Your Service**: https://railway.app/service/your-service-id

### Environment Variables Summary

| Variable | Required | Example |
|----------|----------|---------|
| `SPRING_PROFILES_ACTIVE` | ✅ Yes | `prod` |
| `JWT_SECRET` | ✅ Yes | `base64-encoded-secret` |
| `FRONTEND_URL` | ✅ Yes | `https://plotpulse.syrez.co.in` |
| `DATABASE_URL` | ✅ Auto | Set by Railway |
| `PGHOST` | ✅ Auto | Set by Railway |
| `PGPORT` | ✅ Auto | Set by Railway |
| `PGDATABASE` | ✅ Auto | Set by Railway |
| `PGUSER` | ✅ Auto | Set by Railway |
| `PGPASSWORD` | ✅ Auto | Set by Railway |

### Database Access Methods

1. **Railway Dashboard** → PostgreSQL → Query tab
2. **Railway CLI**: `railway connect postgres`
3. **External Client**: Use connection details from Variables tab
4. **Connection String**: Use `DATABASE_URL` directly

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Enable PostGIS extension
3. ✅ Run database migrations
4. ✅ Update frontend `VITE_API_BASE_URL`
5. ✅ Test the full stack
6. ✅ Monitor logs and metrics

---

*Last Updated: Based on Railway's current platform and Spring Boot 3.4.4*

