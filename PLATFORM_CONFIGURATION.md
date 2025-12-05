# Platform Configuration Guide

This document explains how platform-specific configurations are separated from generic production configurations.

## Configuration Structure

### Generic Production Config (`application-prod.yml`)
- **Purpose**: Works for any production deployment platform
- **Profile**: `prod`
- **Use cases**: AWS, Azure, GCP, self-hosted servers, etc.
- **Features**:
  - Generic database configuration (supports multiple env var formats)
  - Standard Spring Boot port configuration (`SERVER_PORT`)
  - Secure defaults (SSL enabled by default)
  - Generic database name (`plotpulse`)

### Railway-Specific Config (`application-railway.yml`)
- **Purpose**: Railway-specific overrides
- **Profile**: `railway` (used with `prod,railway`)
- **Use cases**: Railway deployments only
- **Features**:
  - Server binds to `0.0.0.0` (required for Railway networking)
  - Uses `PORT` environment variable (Railway's convention)
  - Database defaults to `railway` (Railway's default database name)
  - SSL mode `disable` for internal connections (Railway's internal network)

## How It Works

Spring Boot supports **composite profiles**. When you set:
```bash
SPRING_PROFILES_ACTIVE=prod,railway
```

Spring Boot will:
1. Load `application-prod.yml` (base production config)
2. Load `application-railway.yml` (Railway-specific overrides)
3. Railway-specific values override generic production values

## Configuration Comparison

| Setting | Generic (`prod`) | Railway (`prod,railway`) |
|---------|------------------|--------------------------|
| Server Address | Not set (defaults to localhost) | `0.0.0.0` (required for Railway) |
| Port Variable | `SERVER_PORT` (Spring Boot standard) | `PORT` (Railway convention) |
| Database Name | `plotpulse` | `railway` (Railway's default) |
| SSL Mode | `require` (secure default) | `disable` (internal network) |

## Adding New Platforms

To add support for a new platform (e.g., Heroku, Render):

1. Create `application-{platform}.yml`:
   ```yaml
   # Heroku-Specific Configuration
   server:
     address: 0.0.0.0
     port: ${PORT:${SERVER_PORT:8091}}
   
   spring:
     datasource:
       url: jdbc:postgresql://${DATABASE_URL}?sslmode=require
   ```

2. Set profile: `SPRING_PROFILES_ACTIVE=prod,heroku`

3. Platform-specific config will override generic production config

## Environment Variables

### Generic Production (`prod`)
- `SERVER_PORT` - Standard Spring Boot port
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` - Standard PostgreSQL vars
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Alternative format
- `PGSSLMODE` or `DB_SSLMODE` - SSL mode (defaults to `require`)

### Railway (`prod,railway`)
- `PORT` - Railway's port variable (overrides `SERVER_PORT`)
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` - Railway provides these automatically
- `PGSSLMODE` - Set to `disable` for internal connections

## Benefits

1. **Separation of Concerns**: Platform-specific configs don't pollute generic config
2. **Reusability**: Generic production config works on any platform
3. **Maintainability**: Easy to add new platforms without modifying existing configs
4. **Clarity**: Clear distinction between generic and platform-specific settings

## Migration Notes

If you're currently using `SPRING_PROFILES_ACTIVE=prod` on Railway:
- **Update to**: `SPRING_PROFILES_ACTIVE=prod,railway`
- This enables Railway-specific overrides (especially `0.0.0.0` binding)
- All existing functionality remains the same

