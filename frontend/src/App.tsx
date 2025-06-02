import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { GeolocationProvider } from './contexts/GeolocationContext'
import OptimizedMapComponent from './components/Map/OptimizedMapComponent'
import LoadingSpinner from './components/Common/LoadingSpinner'
import OfflineIndicator from './components/Common/OfflineIndicator'
import PWAInstallPrompt from './components/Common/PWAInstallPrompt'
import './App.css'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate application initialization
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <AuthProvider>
      <GeolocationProvider>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%'
            }}>
              <LoadingSpinner message="Loading PlotPulse..." />
            </div>
          ) : (
            <>
              <OptimizedMapComponent />
              <OfflineIndicator position="top" />
              <PWAInstallPrompt />
            </>
          )}
        </div>
      </GeolocationProvider>
    </AuthProvider>
  )
}

export default App
