import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="user-profile" ref={dropdownRef}>
      <button
        className="user-profile-button"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <div className="user-avatar">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <span className="user-name">{user.username}</span>
        <svg 
          className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-details">
              <div className="username">{user.username}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
          
          <div className="dropdown-divider" />
          
          <div className="dropdown-actions">
            <button
              className="dropdown-item logout-button"
              onClick={handleLogout}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H6zM5 3a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V3z"/>
                <path d="M11.5 8a.5.5 0 0 1-.5.5H8a.5.5 0 0 1 0-1h3a.5.5 0 0 1 .5.5z"/>
                <path d="M10.146 7.146a.5.5 0 0 1 .708.708L9.707 9l1.147 1.146a.5.5 0 0 1-.708.708L9 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708L8.293 9 7.146 7.854a.5.5 0 1 1 .708-.708L9 8.293l1.146-1.147z"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 