# Railway Quick Start Guide

## 🚀 Quick Deployment Steps

### 1. Create Railway Project
- Go to https://railway.app
- Click **"New Project"** → **"Deploy from GitHub repo"**
- Select your repository

### 2. Add PostgreSQL Database
- Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
- Railway automatically sets `DATABASE_URL` and related variables

### 3. Configure Environment Variables

In your Railway service → **Variables** tab, add:

| Variable | Value |
|----------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `JWT_SECRET` | Generate with: `openssl rand -base64 64` |
| `FRONTEND_URL` | `https://plotpulse.syrez.co.in` |

### 4. Enable PostGIS

Go to PostgreSQL service → **Query** tab, run:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

### 5. Run Database Setup

Go to PostgreSQL service → **Query** tab, run the contents of:
`backend/src/main/resources/db/railway_setup.sql`

### 6. Deploy

Railway will auto-deploy on push, or click **"Deploy"** manually.

### 7. Get Your Backend URL

Service → **Settings** → **Networking** → **Generate Domain**

Your API: `https://your-app.railway.app/api/v1`

---

## 📊 Accessing the Database

### Method 1: Railway Dashboard (Easiest)
1. Go to PostgreSQL service
2. Click **"Query"** tab → Run SQL directly
3. Click **"Data"** tab → View tables

### Method 2: Railway CLI
```bash
railway connect postgres
# Opens psql session
```

### Method 3: External Client
1. PostgreSQL service → **Variables** tab
2. Copy: `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`
3. Connect with pgAdmin, DBeaver, or TablePlus

---

## 🔗 Update Frontend

GitHub → **Settings** → **Secrets** → **Actions**

Add/Update: `VITE_API_BASE_URL` = `https://your-app.railway.app/api/v1`

---

## ✅ Verification Checklist

- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Environment variables set
- [ ] PostGIS extension enabled
- [ ] Database setup script run
- [ ] Backend deployed successfully
- [ ] Backend URL obtained
- [ ] Frontend API URL updated
- [ ] Test API calls from frontend

---

For detailed instructions, see: `RAILWAY_DEPLOYMENT_GUIDE.md`

