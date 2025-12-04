# PlotPulse - Project Summary & Analysis

## 📋 Project Overview

**PlotPulse** is a Progressive Web Application (PWA) for interactive plot price mapping and availability tracking. Users can view plot information on an interactive map and contribute new data through long-press interactions.

### Core Use Cases

1. **Interactive Map Visualization**
   - View plots on an OpenStreetMap-based interactive map
   - See plot prices displayed as text labels or icons
   - Filter plots by price range, sale status, and location
   - Search for plots within visible map bounds

2. **Plot Data Management**
   - Add new plots by long-pressing on the map
   - Edit existing plot information (price, description, sale status)
   - Delete plots with confirmation
   - View plot details in popups

3. **User Authentication**
   - User registration and login
   - JWT-based authentication with refresh tokens
   - Password reset functionality
   - Role-based access control (ADMIN, SUPER_ADMIN)

4. **Geospatial Features**
   - Find nearest plot to a location
   - Query plots within bounding box (viewport-based loading)
   - PostGIS spatial queries for efficient location searches
   - User geolocation tracking

5. **PWA Capabilities**
   - Offline functionality with service worker
   - Installable on mobile devices
   - Caching of map tiles and API responses
   - Background sync for offline submissions

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 19.1.0 with TypeScript
- Vite 6.3.5 (build tool)
- React Leaflet 5.0.0 (mapping)
- React Router 7.6.2 (routing)
- Vite PWA Plugin 1.0.0 (PWA features)
- Workbox 7.3.0 (service worker)

**Backend:**
- Spring Boot 3.4.4
- Java 17
- PostgreSQL 15+ with PostGIS extension
- Spring Security with JWT authentication
- Hibernate Spatial 6.5.0 (PostGIS integration)
- JTS Topology Suite 1.19.0 (geometry operations)

**Database:**
- PostgreSQL with PostGIS extension
- Spatial indexing on location column
- SRID 4326 (WGS84) coordinate system

---

## 📁 Project Structure

```
plot-pulse/
├── frontend/              # React TypeScript application
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Map/      # Map-related components
│   │   │   ├── Forms/    # Form components
│   │   │   ├── Auth/     # Authentication components
│   │   │   ├── Filters/  # Filter panel components
│   │   │   └── Common/   # Shared components
│   │   ├── contexts/     # React contexts (state management)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API service layer
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets and PWA icons
│
├── backend/              # Spring Boot application
│   ├── src/main/java/
│   │   ├── controller/   # REST controllers
│   │   ├── entity/       # JPA entities
│   │   ├── repository/   # Data repositories
│   │   ├── service/      # Business logic
│   │   ├── security/     # Security configuration
│   │   ├── config/       # Spring configuration
│   │   ├── dto/          # Data transfer objects
│   │   └── exception/    # Exception handlers
│   └── src/main/resources/
│       └── application.yml  # Application configuration
│
└── init-scripts/         # Database initialization scripts
```

---

## 🔑 Key Features

### 1. Map Features
- **Interactive Map**: Full-screen OpenStreetMap integration
- **Marker Display Modes**: 
  - None (hide all markers)
  - Icon mode (classic map pins)
  - Text mode (price labels on map)
- **Marker Clustering**: Groups nearby plots for better performance
- **Viewport-based Loading**: Only loads plots visible in current map bounds
- **Long Press Detection**: Add plots by long-pressing on map
- **User Location**: Shows user's current location on map

### 2. Plot Management
- **CRUD Operations**: Create, Read, Update, Delete plots
- **Price Units**: Support for multiple units (per_sqft, per_sqm, per_cent, per_acre, per_hectare)
- **Filtering**: Filter by price range, sale status, date added, location radius
- **Spatial Queries**: Find nearest plot, plots within bounds
- **Price Conversion**: Convert between different price units

### 3. Authentication & Authorization
- **JWT Authentication**: Stateless token-based authentication
- **Refresh Tokens**: Long-lived refresh tokens for session management
- **Password Reset**: Email-based password reset flow
- **Role-Based Access**: ADMIN and SUPER_ADMIN roles
- **User Profiles**: View and edit user information

### 4. PWA Features
- **Offline Support**: Cache static assets and API responses
- **Installable**: Can be installed as a mobile app
- **Service Worker**: Background sync for offline submissions
- **Map Tile Caching**: Cache OpenStreetMap tiles for offline viewing

---

## 🔌 API Endpoints

### Public Endpoints (No Authentication Required)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `GET /api/v1/health` - Health check
- `GET /api/v1/plots` - Get all plots (with pagination and filters)
- `GET /api/v1/plots/{id}` - Get plot by ID
- `GET /api/v1/plots/bounds` - Get plots within bounding box
- `GET /api/v1/plots/nearest` - Find nearest plot
- `POST /api/v1/plots` - Create new plot
- `PUT /api/v1/plots/{id}` - Update plot
- `DELETE /api/v1/plots/{id}` - Delete plot

### Protected Endpoints (Authentication Required)
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile
- Other user management endpoints

---

## 🗄️ Database Schema

### Plots Table
- `id` (BIGINT, PRIMARY KEY)
- `price` (DECIMAL(19,2), NOT NULL)
- `price_unit` (VARCHAR(50), NOT NULL)
- `is_for_sale` (BOOLEAN, NOT NULL)
- `description` (VARCHAR(500))
- `location` (GEOMETRY(Point, 4326), NOT NULL) - PostGIS Point
- `latitude` (DOUBLE, NOT NULL) - Extracted from location
- `longitude` (DOUBLE, NOT NULL) - Extracted from location
- `user_id` (BIGINT, FOREIGN KEY to users table)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Users Table
- `id` (BIGINT, PRIMARY KEY)
- `username` (VARCHAR, UNIQUE, NOT NULL)
- `email` (VARCHAR, UNIQUE, NOT NULL)
- `password` (VARCHAR, NOT NULL) - BCrypt hashed
- `role` (ENUM: ADMIN, SUPER_ADMIN)
- `status` (ENUM: ACTIVE, INACTIVE)
- `last_login` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## ⚙️ Configuration

### Backend Configuration (`application.yml`)
- **Server Port**: 8091
- **Context Path**: `/api/v1`
- **Database**: PostgreSQL (localhost:5432/plotpulse)
- **JWT Secret**: Base64 encoded (configured in application.yml)
- **JWT Expiration**: 24 hours (access token), 7 days (refresh token)
- **CORS**: Configured for localhost development ports

### Frontend Configuration
- **API URL**: `http://localhost:8091/api/v1` (hardcoded in plotService.ts)
- **Development Port**: 5173 (Vite default)
- **PWA**: Enabled with Workbox caching strategies

---

## 🚨 Issues & Recommendations

### Critical Issues

1. **Hardcoded API URL**
   - **Location**: `frontend/src/services/plotService.ts:5`
   - **Issue**: API URL is hardcoded to `http://localhost:8091/api/v1`
   - **Impact**: Won't work in production
   - **Fix**: Use environment variables (`import.meta.env.VITE_API_URL`)

2. **Dockerfile Uses `-DskipTests`**
   - **Location**: `backend/Dockerfile:8`
   - **Issue**: Tests are skipped during Docker build
   - **Impact**: Potential issues may not be caught
   - **Fix**: Remove `-DskipTests` or make it conditional

3. **CORS Configuration**
   - **Location**: `backend/src/main/resources/application.yml:35-38`
   - **Issue**: Only localhost origins are allowed
   - **Impact**: Won't work with production frontend URL
   - **Fix**: Add production URLs or use environment variables

4. **JWT Secret in Code**
   - **Location**: `backend/src/main/resources/application.yml:58`
   - **Issue**: JWT secret is in source code
   - **Impact**: Security risk if repository is public
   - **Fix**: Move to environment variables

5. **Database Credentials in Code**
   - **Location**: `backend/src/main/resources/application.yml:13-15`
   - **Issue**: Database credentials are hardcoded
   - **Impact**: Security risk
   - **Fix**: Use environment variables

### Important Updates Needed

1. **Environment Variables**
   - Create `.env.example` files for both frontend and backend
   - Use environment variables for all sensitive configuration
   - Document required environment variables

2. **Production Configuration**
   - Separate `application-prod.yml` for production settings
   - Configure proper logging levels for production
   - Set up proper error handling

3. **API URL Configuration**
   - Frontend should read API URL from environment variable
   - Support different URLs for development/production

4. **Dependency Updates**
   - Check for outdated dependencies
   - Review security vulnerabilities
   - Update to latest stable versions where possible

5. **Documentation**
   - Add proper README with setup instructions
   - Document deployment process
   - Add API documentation (OpenAPI/Swagger)

### Nice-to-Have Improvements

1. **Error Handling**
   - Better error messages for users
   - Error logging and monitoring
   - Retry logic for failed requests (partially implemented)

2. **Testing**
   - Add more unit tests
   - Integration tests for API endpoints
   - E2E tests for critical user flows

3. **Performance**
   - Implement pagination on frontend
   - Add request debouncing for map bounds changes
   - Optimize marker rendering

4. **Security**
   - Rate limiting on API endpoints
   - Input validation improvements
   - CSRF protection (currently disabled)

5. **Monitoring**
   - Health check endpoints (partially implemented)
   - Application metrics
   - Error tracking (e.g., Sentry)

---

## 🚀 Deployment Readiness

### Current Status: **Not Production Ready**

### What's Missing for Production:

1. **Environment Configuration**
   - ❌ No environment variable support
   - ❌ Hardcoded URLs and credentials
   - ❌ No production configuration files

2. **Security**
   - ⚠️ JWT secret in source code
   - ⚠️ Database credentials in source code
   - ⚠️ CORS not configured for production
   - ⚠️ CSRF disabled (may be intentional for API)

3. **Infrastructure**
   - ✅ Dockerfiles exist
   - ⚠️ No docker-compose for production
   - ⚠️ No deployment scripts
   - ⚠️ No CI/CD pipeline

4. **Monitoring & Logging**
   - ⚠️ Debug logging enabled in production config
   - ⚠️ No error tracking
   - ⚠️ No application metrics

### Steps to Make Production Ready:

1. **Immediate (Critical)**
   - Move all secrets to environment variables
   - Configure CORS for production URLs
   - Create production configuration files
   - Fix API URL configuration in frontend

2. **High Priority**
   - Set up proper logging for production
   - Add health check endpoints
   - Configure database connection pooling
   - Set up SSL/HTTPS

3. **Medium Priority**
   - Add monitoring and error tracking
   - Implement rate limiting
   - Add API documentation
   - Set up CI/CD pipeline

---

## 📝 Development Workflow

### Running Locally

**Backend:**
```bash
cd backend
mvn spring-boot:run
```
- Runs on `http://localhost:8091`
- API available at `http://localhost:8091/api/v1`

**Frontend:**
```bash
cd frontend
npm run dev
```
- Runs on `http://localhost:5173`
- Hot module replacement enabled

**Database:**
- PostgreSQL with PostGIS extension required
- Connection: `localhost:5432/plotpulse`
- Credentials: `postgres/root` (configured in application.yml)

### Building for Production

**Backend:**
```bash
cd backend
mvn clean package
# Creates JAR file in target/ directory
```

**Frontend:**
```bash
cd frontend
npm run build
# Creates dist/ directory with production build
```

---

## 🔍 Code Quality Notes

### Strengths
- ✅ Well-structured codebase with clear separation of concerns
- ✅ TypeScript for type safety
- ✅ Proper error handling in most places
- ✅ Good use of React hooks and contexts
- ✅ Comprehensive authentication system
- ✅ Spatial query optimization with PostGIS

### Areas for Improvement
- ⚠️ Some hardcoded values that should be configurable
- ⚠️ Limited test coverage
- ⚠️ Some console.log statements left in code (should use proper logging)
- ⚠️ Mock data fallback in production code (should be removed or made optional)

---

## 📚 Additional Resources

- **Development Tasks**: See `development_tasks.md` for detailed feature implementation
- **Database Scripts**: See `init-scripts/` for PostGIS setup
- **Docker**: Dockerfiles available for both frontend and backend

---

## 🎯 Next Steps

1. **Review this summary** and identify priority items
2. **Fix critical issues** (environment variables, API URL, etc.)
3. **Set up production configuration** files
4. **Test deployment** on staging environment
5. **Deploy to production** hosting platform

---

*Last Updated: Based on current codebase analysis*
*Project Status: Development/Staging - Not Production Ready*


