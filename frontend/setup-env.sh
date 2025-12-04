#!/bin/bash

# Script to create environment files for PlotPulse frontend

echo "Setting up environment files for PlotPulse..."

# Create .env.development
cat > .env.development << 'EOF'
# Development Environment Variables
VITE_API_BASE_URL=http://localhost:8091/api/v1
VITE_APP_NAME=PlotPulse (Dev)
VITE_APP_ENV=development
VITE_ENABLE_DEBUG=true
EOF

# Create .env.production
cat > .env.production << 'EOF'
# Production Environment Variables
VITE_API_BASE_URL=https://api.plotpulse.app/api/v1
VITE_APP_NAME=PlotPulse
VITE_APP_ENV=production
VITE_ENABLE_DEBUG=false
EOF

echo "✅ Environment files created!"
echo ""
echo "Files created:"
echo "  - .env.development"
echo "  - .env.production"
echo ""
echo "⚠️  Remember to update VITE_API_BASE_URL in .env.production with your actual production API URL"

