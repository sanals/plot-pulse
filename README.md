# PlotPulse - Interactive Plot Price Mapping PWA

A Progressive Web Application for interactive plot price mapping and availability tracking. Users can view plot information on an interactive map and contribute new data through long-press interactions.

## 🚀 Quick Start

### Frontend (Local Development)

```bash
cd frontend
npm install
npm run dev
```

### Backend (Local Development)

```bash
cd backend
mvn spring-boot:run
```

## 📚 Documentation

### Deployment Guides

- **[Railway Deployment Guide](RAILWAY_DEPLOYMENT.md)** - Complete guide for deploying backend to Railway with PostGIS
- **[GitHub Pages Deployment Guide](DEPLOYMENT_GUIDE.md)** - Guide for deploying frontend to GitHub Pages
- **[GoDaddy DNS Setup](GODADDY_DNS_SETUP.md)** - Custom domain configuration

### Configuration

- **[Environment Setup](ENVIRONMENT_SETUP.md)** - Development and production environment configuration

### Project Information

- **[Project Summary](PROJECT_SUMMARY.md)** - Overview of the project structure and features

## 🛠️ Technology Stack

- **Frontend**: React 18+ with TypeScript, Vite
- **Mapping**: react-leaflet with OpenStreetMap
- **Backend**: Java Spring Boot 3.x with Spring Data JPA
- **Database**: PostgreSQL 15+ with PostGIS extension
- **PWA**: Vite PWA plugin with Workbox

## 📁 Project Structure

```
plot-pulse/
├── frontend/          # React frontend application
├── backend/           # Spring Boot backend application
├── railway.toml       # Railway deployment configuration
└── docs/              # Documentation files
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- Java 17+
- PostgreSQL 15+ with PostGIS
- Maven 3.8+

### Environment Variables

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed environment configuration.

## 📝 License

[Add your license here]

