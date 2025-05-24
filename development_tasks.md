# PlotPulse PWA Development Tasks

## Phase 1: Project Setup & Basic Infrastructure

### Task 1.1: Frontend Project Initialization
**Goal**: Set up React + TypeScript + Vite project with essential dependencies

**Prompt for Cursor/Claude**:
```
Create a new React TypeScript project using Vite with the following requirements:
1. Initialize project with: npm create vite@latest plotpulse-frontend -- --template react-ts
2. Install dependencies: react-leaflet, leaflet, @types/leaflet
3. Install PWA plugin: vite-plugin-pwa
4. Configure vite.config.ts with PWA plugin
5. Set up basic TypeScript configuration with strict mode
6. Create initial folder structure following the cursor rules
7. Set up ESLint and Prettier configuration
8. Create basic App.tsx with routing setup (if needed)

Expected output: Working React TypeScript project with build system ready
```

### Task 1.2: Backend Project Setup
**Goal**: Create Spring Boot project with PostGIS support

**Prompt for Cursor/Claude**:
```
Create a Spring Boot project with the following specifications:
1. Initialize Spring Boot 3.x project with dependencies: Spring Web, Spring Data JPA, PostgreSQL, Lombok
2. Add hibernate-spatial dependency for PostGIS support
3. Configure application.properties for PostgreSQL connection with PostGIS
4. Set up basic project structure with controller, service, repository, entity packages
5. Create a basic health check endpoint
6. Configure CORS for frontend communication
7. Add logging configuration
8. Create Docker compose file for PostgreSQL with PostGIS extension

Expected output: Working Spring Boot project that can connect to PostGIS database
```

### Task 1.3: Database Schema Setup
**Goal**: Create PostgreSQL database with PostGIS extension and initial tables

**Prompt for Cursor/Claude**:
```
Create database setup for PlotPulse with PostGIS:
1. Write SQL script to create database and enable PostGIS extension
2. Create plots table with the following structure:
   - id (PRIMARY KEY, AUTO_INCREMENT)
   - price (DECIMAL, NOT NULL)
   - is_for_sale (BOOLEAN, DEFAULT true)
   - description (TEXT, NULLABLE)
   - location (GEOMETRY(POINT, 4326), NOT NULL)
   - created_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
   - updated_at (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE)
3. Create spatial index on location column
4. Insert sample test data (5-10 plots in a specific area)
5. Write validation queries to test spatial functions

Expected output: Complete database schema with sample data for testing
```

## Phase 2: Core Mapping Functionality

### Task 2.1: Basic Map Component
**Goal**: Create interactive map with OpenStreetMap

**Prompt for Cursor/Claude**:
```
Create a React Leaflet map component with the following features:
1. MapComponent.tsx that renders full-screen interactive map
2. Default view centered on a specific location with appropriate zoom
3. Responsive design that adapts to different screen sizes
4. Basic map controls (zoom in/out, layers if needed)
5. TypeScript interfaces for map-related props and state
6. Error handling for map loading failures
7. Loading spinner while map initializes
8. Basic styling to ensure map fills viewport properly

Use react-leaflet library and follow React functional component patterns.
Expected output: Working interactive map component ready for integration
```

### Task 2.2: User Geolocation Feature
**Goal**: Implement geolocation with user location marker

**Prompt for Cursor/Claude**:
```
Create geolocation functionality for PlotPulse:
1. Custom hook useGeolocation.ts that:
   - Requests user permission for location access
   - Gets current position using navigator.geolocation
   - Handles permission denied, unavailable, and timeout errors
   - Provides loading states and error messages
   - Caches location data appropriately

2. LocationButton component that:
   - Shows "Locate Me" button with appropriate icon
   - Centers map on user location when clicked
   - Shows user location marker on map
   - Handles different states (loading, success, error)

3. Integrate with MapComponent to display user location marker
4. Add proper TypeScript types for geolocation data

Expected output: Working geolocation feature with error handling
```

### Task 2.3: Long Press Event Implementation
**Goal**: Detect long press/right-click on map to capture coordinates

**Prompt for Cursor/Claude**:
```
Implement long press detection for map interaction:
1. Create custom hook useLongPress.ts that:
   - Detects long press (500ms+) on touch devices
   - Detects right-click on desktop devices
   - Prevents default context menu behavior
   - Returns coordinates of the pressed location
   - Clears timeouts properly to prevent memory leaks

2. Integrate long press detection with react-leaflet map:
   - Listen for map click events
   - Distinguish between regular clicks and long presses
   - Extract latitude/longitude from map coordinates
   - Show temporary marker at pressed location

3. Create LongPressPopup component that:
   - Displays coordinates of pressed location
   - Shows popup/modal with location details
   - Includes close functionality

Expected output: Working long press detection with coordinate capture
```

## Phase 3: Backend API & Data Management

### Task 3.1: Plot Entity and Repository
**Goal**: Create JPA entity for plots with PostGIS support

**Prompt for Cursor/Claude**:
```
Create Plot entity and repository with PostGIS integration:
1. Plot.java entity with:
   - All required fields (id, price, isForSale, description, location, timestamps)
   - JPA annotations for PostgreSQL
   - PostGIS Point type using org.locationtech.jts.geom.Point
   - Proper validation annotations
   - Builder pattern using Lombok

2. PlotRepository.java interface that extends JpaRepository:
   - Basic CRUD operations
   - Custom query to find nearest plot using ST_DWithin and ST_Distance
   - Custom query to find plots within a bounding box
   - Spatial queries with proper parameter binding

3. Configure Hibernate Spatial in application properties
4. Create PlotDto.java for API responses
5. Add proper error handling for spatial operations

Expected output: Working JPA entity with spatial queries
```

### Task 3.2: Plot REST API Controller
**Goal**: Create REST endpoints for plot data management

**Prompt for Cursor/Claude**:
```
Create PlotController.java with REST endpoints:
1. GET /api/plots - List all plots with pagination
   - Support query parameters for filtering (price range, sale status)
   - Return PlotDto objects
   - Include proper HTTP status codes

2. GET /api/plots/nearest - Find nearest plot to given coordinates
   - Accept lat, lon, and optional radius parameters
   - Use PostGIS spatial queries
   - Return single nearest plot or 404 if none found

3. POST /api/plots - Create new plot
   - Accept PlotDto in request body
   - Validate input data
   - Save to database with proper coordinate conversion
   - Return created plot with generated ID

4. PUT /api/plots/{id} - Update existing plot
5. DELETE /api/plots/{id} - Delete plot

Include proper exception handling, validation, and CORS configuration.
Expected output: Complete REST API for plot management
```

### Task 3.3: Plot Service Layer
**Goal**: Implement business logic and coordinate conversion

**Prompt for Cursor/Claude**:
```
Create PlotService.java with business logic:
1. Service methods for all CRUD operations
2. Coordinate conversion utilities:
   - Convert between DTO coordinates and PostGIS Point
   - Handle SRID 4326 (WGS84) coordinate system
   - Validate coordinate ranges (lat: -90 to 90, lon: -180 to 180)

3. Spatial query methods:
   - findNearestPlot with distance calculation
   - findPlotsInBounds for map viewport queries
   - Efficient spatial indexing usage

4. Data validation and business rules:
   - Price validation (positive numbers)
   - Description length limits
   - Duplicate location checks (within certain radius)

5. Error handling with custom exception classes
6. Logging for debugging spatial operations

Expected output: Complete service layer with spatial operations
```

## Phase 4: Frontend-Backend Integration

### Task 4.1: API Service Layer (Frontend)
**Goal**: Create service layer for API communication

**Prompt for Cursor/Claude**:
```
Create frontend API service layer:
1. plotService.ts with methods for:
   - fetchPlots() - Get all plots
   - fetchNearestPlot(lat, lon, radius?) - Get nearest plot
   - createPlot(plotData) - Submit new plot
   - updatePlot(id, plotData) - Update existing plot
   - deletePlot(id) - Delete plot

2. Implement proper error handling:
   - Network errors
   - HTTP status code handling
   - Timeout handling
   - Retry logic for failed requests

3. TypeScript interfaces for API requests/responses
4. Environment-based API URL configuration
5. Request/response interceptors for common headers
6. Loading states and error states management

Use fetch API with async/await pattern.
Expected output: Complete API service layer with error handling
```

### Task 4.2: Plot Data Management Hook
**Goal**: Create custom hook for plot data state management

**Prompt for Cursor/Claude**:
```
Create usePlotData.ts custom hook:
1. State management for plot data:
   - plots array
   - loading states
   - error states
   - selected/nearest plot

2. Functions to:
   - Load plots from API
   - Add new plot to state
   - Update existing plot in state
   - Remove plot from state
   - Find nearest plot by coordinates

3. Integration with plotService.ts
4. Proper error handling and user feedback
5. Caching strategy for plot data
6. Real-time updates (if applicable)

7. TypeScript types for all state and functions
8. Performance optimization for large datasets

Expected output: Custom hook for complete plot data management
```

### Task 4.3: Plot Markers on Map
**Goal**: Display plot data as markers on the map

**Prompt for Cursor/Claude**:
```
Create plot visualization on map:
1. PlotMarker component that:
   - Displays individual plot as map marker
   - Shows different icons based on plot status (for sale, sold, etc.)
   - Handles marker click events
   - Shows popup with plot details (price, description, status)
   - Supports custom styling

2. Integrate with MapComponent to:
   - Render all plots as markers
   - Handle marker clustering for dense areas
   - Update markers when plot data changes
   - Show loading state while fetching data

3. PlotPopup component for marker details:
   - Display plot information in formatted popup
   - Include action buttons (edit, delete if applicable)
   - Handle popup close events
   - Responsive design for mobile devices

Expected output: Working plot visualization with interactive markers
```

## Phase 5: Plot Submission & User Interaction

### Task 5.1: Plot Submission Form
**Goal**: Create form for users to submit new plot data

**Prompt for Cursor/Claude**:
```
Create PlotSubmissionForm component:
1. Form fields for:
   - Price (number input with validation)
   - For Sale status (checkbox/toggle)
   - Description (textarea, optional)
   - Coordinates (pre-filled from long press, read-only)

2. Form validation:
   - Required field validation
   - Price format validation (positive numbers)
   - Description length limits
   - Coordinate validation

3. Form submission:
   - Call plotService.createPlot()
   - Handle loading states during submission
   - Show success/error messages
   - Clear form after successful submission
   - Update map with new plot marker

4. UI/UX considerations:
   - Responsive design for mobile
   - Clear visual feedback
   - Accessible form controls
   - Proper error message display

Expected output: Complete form component with validation and submission
```

### Task 5.2: Enhanced Long Press Interaction
**Goal**: Integrate long press with plot submission workflow

**Prompt for Cursor/Claude**:
```
Enhance long press functionality:
1. Update LongPressPopup to show:
   - Coordinates of pressed location
   - Nearest plot information (if any within radius)
   - "Add Plot Here" button
   - "View Nearby Plots" option

2. Integrate with plot submission:
   - Open PlotSubmissionForm when "Add Plot Here" is clicked
   - Pre-fill coordinates in form
   - Handle form submission and map updates
   - Close popup after successful submission

3. Nearest plot display:
   - Query backend for nearest plot
   - Show distance to nearest plot
   - Display basic plot info if found
   - Handle no nearby plots scenario

4. Improved user feedback:
   - Visual indicators for long press detection
   - Smooth transitions between states
   - Clear call-to-action buttons
   - Loading states for API calls

Expected output: Complete long press to plot submission workflow
```

### Task 5.3: Plot Management Features
**Goal**: Add edit/delete functionality for plots

**Prompt for Cursor/Claude**:
```
Implement plot management features:
1. PlotEditForm component (similar to submission form):
   - Pre-populate with existing plot data
   - Allow editing of all fields except coordinates
   - Validate changes before submission
   - Handle update API calls

2. Plot deletion functionality:
   - Confirmation dialog before deletion
   - API call to delete plot
   - Remove marker from map
   - User feedback for successful deletion

3. Enhanced PlotPopup with management actions:
   - Edit button (opens edit form)
   - Delete button (shows confirmation)
   - Share plot functionality
   - Report inappropriate content option

4. Permission handling:
   - Basic user identification (can be simple for MVP)
   - Allow editing/deleting own plots only
   - Admin functionality for moderation

Expected output: Complete CRUD functionality for plot management
```

## Phase 6: PWA Implementation

### Task 6.1: Service Worker and Caching
**Goal**: Implement PWA caching strategy

**Prompt for Cursor/Claude**:
```
Implement PWA functionality:
1. Configure vite-plugin-pwa with Workbox:
   - Cache static assets (HTML, CSS, JS, images)
   - Cache-first strategy for assets
   - Network-first strategy for API calls
   - Background sync for offline form submissions

2. Manifest.json configuration:
   - App name, short name, description
   - Icons for different sizes (192x192, 512x512)
   - Theme and background colors
   - Display mode (standalone)
   - Start URL and scope

3. Offline functionality:
   - Cache recent plot data for offline viewing
   - Queue plot submissions when offline
   - Show offline indicator
   - Sync data when connection restored

4. Map tile caching (optional):
   - Cache map tiles for specific regions
   - Manage cache size limits
   - Update tiles periodically

Expected output: Full PWA with offline capabilities
```

### Task 6.2: Performance Optimization
**Goal**: Optimize app performance for mobile devices

**Prompt for Cursor/Claude**:
```
Implement performance optimizations:
1. Map performance:
   - Marker clustering for dense plot areas
   - Lazy loading of plot data based on map viewport
   - Efficient marker updates (avoid re-rendering all markers)
   - Map tile optimization

2. React performance:
   - Implement React.memo for expensive components
   - Use useMemo and useCallback for expensive calculations
   - Code splitting with React.lazy()
   - Bundle size optimization

3. API optimization:
   - Implement pagination for plot listings
   - Viewport-based plot loading
   - Debounced search/filter operations
   - Request caching with TTL

4. Mobile optimization:
   - Touch-friendly interface elements
   - Responsive design breakpoints
   - Fast touch interactions
   - Reduced data usage in mobile networks

Expected output: Optimized app with fast loading and smooth interactions
```

## Phase 7: Testing & Production Preparation

### Task 7.1: Testing Implementation
**Goal**: Add comprehensive testing suite

**Prompt for Cursor/Claude**:
```
Implement testing for PlotPulse:
1. Frontend testing:
   - Unit tests for custom hooks (useGeolocation, usePlotData)
   - Component tests for key components
   - Integration tests for API service layer
   - End-to-end tests for critical user flows

2. Backend testing:
   - Unit tests for service layer methods
   - Integration tests for repository queries
   - Controller tests for API endpoints
   - PostGIS spatial query testing

3. Test utilities and mocks:
   - Mock geolocation API
   - Mock map components for testing
   - Database test containers
   - API response mocking

4. Test coverage and CI setup:
   - Configure test coverage reporting
   - Set up GitHub Actions for CI/CD
   - Automated testing on pull requests
   - Quality gates for test coverage

Expected output: Comprehensive testing suite with CI/CD pipeline
```

### Task 7.2: Production Deployment Setup
**Goal**: Prepare app for production deployment

**Prompt for Cursor/Claude**:
```
Set up production deployment:
1. Frontend deployment:
   - Build optimization configuration
   - Environment variable management
   - CDN setup for static assets
   - Domain and SSL configuration

2. Backend deployment:
   - Docker containerization
   - Production database configuration
   - Environment-specific application properties
   - Health check endpoints

3. Infrastructure as Code:
   - Docker Compose for local development
   - Production deployment scripts
   - Database migration scripts
   - Monitoring and logging setup

4. Security hardening:
   - HTTPS enforcement
   - CORS configuration for production
   - Input validation and sanitization
   - Rate limiting implementation

Expected output: Production-ready deployment configuration
```

## Troubleshooting Guide

### Common Issues and Solutions

**Long Press Detection Issues:**
- Problem: Long press not working on touch devices
- Solution: Ensure touchstart/touchend events are properly handled and preventDefault() is called for context menu

**PostGIS Connection Problems:**
- Problem: Hibernate can't connect to PostGIS
- Solution: Verify hibernate-spatial dependency and PostgisPG95Dialect configuration

**Map Performance Issues:**
- Problem: Too many markers causing lag
- Solution: Implement marker clustering and viewport-based loading

**PWA Installation Issues:**
- Problem: App not installable
- Solution: Check manifest.json validation and HTTPS requirement

**Spatial Query Errors:**
- Problem: ST_Distance returning unexpected results
- Solution: Ensure consistent SRID usage (4326) and proper coordinate order

Each task should be tackled individually, and you can ask Claude in Cursor to implement specific parts by referencing these task descriptions and the cursor rules file.