# Environment Configuration Guide

This guide explains how to configure different environments (development and production) for both frontend and backend.

## Frontend Environment Configuration

### Environment Files

Create the following files in the `frontend/` directory:

#### `.env.development`
```env
# Development Environment Variables
VITE_API_BASE_URL=http://localhost:8091/api/v1
VITE_APP_NAME=PlotPulse (Dev)
VITE_APP_ENV=development
VITE_ENABLE_DEBUG=true
```

#### `.env.production`
```env
# Production Environment Variables
VITE_API_BASE_URL=https://api.plotpulse.app/api/v1
VITE_APP_NAME=PlotPulse
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
```

### How It Works

1. **Vite automatically loads environment files** based on the mode:
   - `npm run dev` → loads `.env.development`
   - `npm run build` → loads `.env.production`

2. **Environment variables** must be prefixed with `VITE_` to be accessible in the app

3. **Access in code**: Use `import.meta.env.VITE_API_BASE_URL` or use the config utility:
   ```typescript
   import { getApiBaseUrl } from './config/env';
   const apiUrl = getApiBaseUrl();
   ```

### Usage

The environment configuration is already integrated into:
- `frontend/src/services/plotService.ts`
- `frontend/src/services/authService.ts`

### Building for Production

```bash
# Development build (uses .env.development)
npm run dev

# Production build (uses .env.production)
npm run build
```

---

## Backend Environment Configuration

### Spring Profiles

The backend uses Spring Boot profiles to manage environment-specific configurations:

- **Development**: `application-dev.yml`
- **Production**: `application-prod.yml`

### Setting Active Profile

#### Option 1: Environment Variable
```bash
export SPRING_PROFILES_ACTIVE=prod
mvn spring-boot:run
```

#### Option 2: Command Line
```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=prod"
```

#### Option 3: IDE Configuration
In your IDE run configuration, add:
```
Program arguments: --spring.profiles.active=prod
```

#### Option 4: JAR File
```bash
java -jar plotpulse.jar --spring.profiles.active=prod
```

### Configuration Files

#### `application-dev.yml` (Development)
- Local database connection
- Debug logging enabled
- CORS allows localhost origins
- Hibernate auto-update enabled

#### `application-prod.yml` (Production)
- Environment variable-based configuration
- Production database connection
- Reduced logging
- Hibernate validation only (no auto-update)
- CORS restricted to production frontend URLs

### Production Environment Variables

Set these environment variables in your production environment:

```bash
# Database
export DATABASE_URL=jdbc:postgresql://your-db-host:5432/plotpulse
export DATABASE_USERNAME=your_db_user
export DATABASE_PASSWORD=your_secure_password

# JWT (REQUIRED - generate a new secret for production)
export JWT_SECRET=your_base64_encoded_secret_key

# Server
export SERVER_PORT=8091
export SPRING_PROFILES_ACTIVE=prod

# Frontend URL for CORS
export FRONTEND_URL=https://plotpulse.app
export FRONTEND_URL_WWW=https://www.plotpulse.app

# Application
export APP_BASE_URL=https://api.plotpulse.app/api
```

### Generating JWT Secret

To generate a secure JWT secret for production:

```bash
# Using OpenSSL
openssl rand -base64 64

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## Docker Configuration

### Frontend Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build with:
```bash
docker build --build-arg VITE_API_BASE_URL=https://api.plotpulse.app/api/v1 -t plotpulse-frontend .
```

### Backend Dockerfile

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/*.jar app.jar
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8091
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Run with environment variables:
```bash
docker run -e SPRING_PROFILES_ACTIVE=prod \
  -e DATABASE_URL=jdbc:postgresql://db:5432/plotpulse \
  -e DATABASE_USERNAME=postgres \
  -e DATABASE_PASSWORD=secure_password \
  -e JWT_SECRET=your_jwt_secret \
  plotpulse-backend
```

---

## Quick Reference

### Frontend

| Environment | File | API URL |
|------------|------|---------|
| Development | `.env.development` | `http://localhost:8091/api/v1` |
| Production | `.env.production` | `https://api.plotpulse.app/api/v1` |

### Backend

| Environment | Profile | Config File |
|------------|---------|-------------|
| Development | `dev` | `application-dev.yml` |
| Production | `prod` | `application-prod.yml` |

### Running Commands

**Frontend:**
```bash
# Development
npm run dev

# Production build
npm run build
```

**Backend:**
```bash
# Development
mvn spring-boot:run

# Production
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=prod"

# Or with environment variable
SPRING_PROFILES_ACTIVE=prod mvn spring-boot:run
```

---

## Security Notes

1. **Never commit** `.env.production` or `.env.development` files to git
2. **Always use** environment variables for sensitive data in production
3. **Generate a new JWT secret** for production (don't use the dev secret)
4. **Use strong database passwords** in production
5. **Restrict CORS origins** in production to your actual frontend domain

---

## Troubleshooting

### Frontend: Environment variables not working
- Ensure variables are prefixed with `VITE_`
- Restart the dev server after changing `.env` files
- Check that the file is in the `frontend/` directory

### Backend: Profile not loading
- Check `SPRING_PROFILES_ACTIVE` environment variable
- Verify `application-{profile}.yml` files exist
- Check Spring Boot logs for profile activation messages

### Backend: Environment variables not overriding
- Ensure variable names match exactly (case-sensitive)
- Use `${VARIABLE_NAME:default_value}` syntax in YAML
- Check that environment variables are set before starting the application

