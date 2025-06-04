import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { CurrencyCode } from '../utils/currencyUtils';

export type AreaUnit = 'sqft' | 'sqm' | 'cent' | 'acre';

interface SettingsContextType {
  currency: CurrencyCode;
  areaUnit: AreaUnit;
  setCurrency: (currency: CurrencyCode) => void;
  setAreaUnit: (unit: AreaUnit) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');
  const [areaUnit, setAreaUnitState] = useState<AreaUnit>('sqft');

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem('plotpulse_currency') as CurrencyCode;
      const savedAreaUnit = localStorage.getItem('plotpulse_area_unit') as AreaUnit;
      
      if (savedCurrency && ['INR', 'USD', 'EUR', 'GBP'].includes(savedCurrency)) {
        setCurrencyState(savedCurrency);
      }
      
      if (savedAreaUnit && ['sqft', 'sqm', 'cent', 'acre'].includes(savedAreaUnit)) {
        setAreaUnitState(savedAreaUnit);
      }
    } catch (error) {
      console.error('Error loading settings from localStorage:', error);
    }
  }, []);

  // Save to localStorage and update state
  const setCurrency = (newCurrency: CurrencyCode) => {
    try {
      localStorage.setItem('plotpulse_currency', newCurrency);
      setCurrencyState(newCurrency);
    } catch (error) {
      console.error('Error saving currency setting:', error);
    }
  };

  const setAreaUnit = (newAreaUnit: AreaUnit) => {
    try {
      localStorage.setItem('plotpulse_area_unit', newAreaUnit);
      setAreaUnitState(newAreaUnit);
    } catch (error) {
      console.error('Error saving area unit setting:', error);
    }
  };

  const value: SettingsContextType = {
    currency,
    areaUnit,
    setCurrency,
    setAreaUnit,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}; 