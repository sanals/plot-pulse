import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProfileProps {
  isMobile?: boolean;
}

/**
 * Custom profile component for navbar that matches the design
 */
const NavbarProfile: React.FC<NavbarProfileProps> = ({ isMobile = false }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const profileRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on logout button
      if (target && (target as Element).closest?.('.logout-btn')) {
        console.log('Click on logout button detected, not closing dropdown');
        return;
      }
      
      if (profileRef.current && !profileRef.current.contains(target)) {
        console.log('Click outside detected, closing dropdown');
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: 0,
        left: rect.right + 16
      });
    }
  }, [showDropdown]);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    console.log('Logout button clicked'); // Debug log
    try {
      logout();
      setShowDropdown(false);
      console.log('Logout function called successfully'); // Debug log
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.name) {
      // Use first letter of first and last name if available
      const nameParts = user.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  // Mobile version
  if (isMobile) {
    return (
      <div className="mobile-profile">
        <div className="mobile-profile-info">
          <div className="mobile-profile-avatar">
            {getUserInitials()}
          </div>
          <div className="mobile-profile-details">
            <div className="mobile-profile-name">{user?.username || 'User'}</div>
            <div className="mobile-profile-role">USER</div>
          </div>
        </div>
        <button 
          className="mobile-logout-btn"
          onClick={(e) => {
            console.log('Mobile logout button clicked', e); // Debug log
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16,17 21,12 16,7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="navbar-profile" ref={profileRef}>
      <button 
        ref={buttonRef}
        className="navbar-profile-btn"
        onClick={toggleDropdown}
      >
        <div className="navbar-profile-avatar">
          {getUserInitials()}
        </div>
        <div className="navbar-profile-info">
          <div className="navbar-profile-name">{user?.username || 'User'}</div>
          <div className="navbar-profile-role">USER</div>
        </div>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`navbar-profile-chevron ${showDropdown ? 'rotated' : ''}`}
        >
          <polyline points="9,18 15,12 9,6"/>
        </svg>
      </button>

      {showDropdown && createPortal(
        <div 
          className="navbar-profile-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 99999
          }}
        >
          <div className="navbar-profile-dropdown-header">
            <div className="navbar-profile-dropdown-avatar">
              {getUserInitials()}
            </div>
            <div className="navbar-profile-dropdown-info">
              <div className="navbar-profile-dropdown-name">{user?.username || 'User'}</div>
              <div className="navbar-profile-dropdown-role">USER</div>
            </div>
          </div>
          <div className="navbar-profile-dropdown-divider"></div>
          <button 
            className="navbar-profile-dropdown-btn logout-btn"
            onMouseUp={(e) => {
              console.log('Logout button mouse up', e); // Debug log
              e.preventDefault();
              e.stopPropagation();
              handleLogout();
            }}
            onClick={(e) => {
              console.log('Logout dropdown button clicked'); // Debug log
              e.preventDefault();
              e.stopPropagation();
              handleLogout();
            }}
            onMouseDown={() => {
              console.log('Logout button mouse down'); // Debug log
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default NavbarProfile; 