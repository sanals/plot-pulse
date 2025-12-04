@echo off
REM Script to create environment files for PlotPulse frontend (Windows)

echo Setting up environment files for PlotPulse...

REM Create .env.development
(
echo # Development Environment Variables
echo VITE_API_BASE_URL=http://localhost:8091/api/v1
echo VITE_APP_NAME=PlotPulse (Dev)
echo VITE_APP_ENV=development
echo VITE_ENABLE_DEBUG=true
) > .env.development

REM Create .env.production
(
echo # Production Environment Variables
echo VITE_API_BASE_URL=https://api.plotpulse.app/api/v1
echo VITE_APP_NAME=PlotPulse
echo VITE_APP_ENV=production
echo VITE_ENABLE_DEBUG=false
) > .env.production

echo ✅ Environment files created!
echo.
echo Files created:
echo   - .env.development
echo   - .env.production
echo.
echo ⚠️  Remember to update VITE_API_BASE_URL in .env.production with your actual production API URL

pause

