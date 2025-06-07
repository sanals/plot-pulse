import React from 'react';
import { useFilters } from '../../contexts/FilterContext';
import './FilterButton.css';

export const FilterButton: React.FC = () => {
  const { 
    isFilterPanelOpen, 
    setFilterPanelOpen, 
    hasActiveFilters, 
    activeFilterCount 
  } = useFilters();

  const handleClick = () => {
    setFilterPanelOpen(!isFilterPanelOpen);
  };

  return (
    <button 
      className={`filter-button ${isFilterPanelOpen ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
      onClick={handleClick}
      title={hasActiveFilters ? `Filters (${activeFilterCount} active)` : 'Open filters'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
      </svg>
      <span className="filter-button-text">Filters</span>
      {hasActiveFilters && (
        <span className="filter-button-badge">{activeFilterCount}</span>
      )}
    </button>
  );
}; 