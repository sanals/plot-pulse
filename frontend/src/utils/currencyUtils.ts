// Currency configuration with fallback static rates
const STATIC_CURRENCIES = {
  INR: {
    symbol: '₹',
    code: 'INR',
    name: 'Indian Rupee',
    exchangeRate: 1, // Base currency
  },
  USD: {
    symbol: '$',
    code: 'USD', 
    name: 'US Dollar',
    exchangeRate: 0.012, // 1 INR = 0.012 USD (fallback)
  },
  EUR: {
    symbol: '€',
    code: 'EUR',
    name: 'Euro',
    exchangeRate: 0.011, // 1 INR = 0.011 EUR (fallback)
  },
  GBP: {
    symbol: '£',
    code: 'GBP',
    name: 'British Pound',
    exchangeRate: 0.0095, // 1 INR = 0.0095 GBP (fallback)
  },
};

export type CurrencyCode = keyof typeof STATIC_CURRENCIES;

// Define a more flexible type for live currencies
interface CurrencyConfig {
  symbol: string;
  code: string;
  name: string;
  exchangeRate: number;
}

type CurrenciesType = Record<CurrencyCode, CurrencyConfig>;

// Live currency rates storage
let LIVE_CURRENCIES: CurrenciesType = { ...STATIC_CURRENCIES };

// Cache configuration
const CACHE_KEY = 'plotpulse_currency_rates';
const CACHE_TIMESTAMP_KEY = 'plotpulse_currency_timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * ExchangeRate API configuration
 * Free tier: 1,500 requests/month
 * Updates daily
 */
const EXCHANGE_API_BASE = 'https://api.exchangerate-api.com/v4/latest';
const BASE_CURRENCY = 'INR';

/**
 * Interface for API response
 */
interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

/**
 * Check if cached rates are still valid
 */
const isCacheValid = (): boolean => {
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return false;
    
    const cacheTime = parseInt(timestamp, 10);
    const now = Date.now();
    
    return (now - cacheTime) < CACHE_DURATION;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
};

/**
 * Load cached currency rates
 */
const loadCachedRates = (): boolean => {
  try {
    if (!isCacheValid()) return false;
    
    const cachedRates = localStorage.getItem(CACHE_KEY);
    if (!cachedRates) return false;
    
    const rates = JSON.parse(cachedRates);
    
    // Update live currencies with cached rates
    LIVE_CURRENCIES = {
      INR: { ...STATIC_CURRENCIES.INR, exchangeRate: 1 },
      USD: { ...STATIC_CURRENCIES.USD, exchangeRate: rates.USD || STATIC_CURRENCIES.USD.exchangeRate },
      EUR: { ...STATIC_CURRENCIES.EUR, exchangeRate: rates.EUR || STATIC_CURRENCIES.EUR.exchangeRate },
      GBP: { ...STATIC_CURRENCIES.GBP, exchangeRate: rates.GBP || STATIC_CURRENCIES.GBP.exchangeRate },
    };
    
    console.log('✅ Loaded cached currency rates:', rates);
    return true;
  } catch (error) {
    console.error('Error loading cached rates:', error);
    return false;
  }
};

/**
 * Save currency rates to cache
 */
const saveCachedRates = (rates: Record<string, number>): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log('💾 Saved currency rates to cache');
  } catch (error) {
    console.error('Error saving rates to cache:', error);
  }
};

/**
 * Fetch live currency rates from API
 */
const fetchLiveCurrencyRates = async (): Promise<boolean> => {
  try {
    console.log('🔄 Fetching live currency rates...');
    
    const response = await fetch(`${EXCHANGE_API_BASE}/${BASE_CURRENCY}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: ExchangeRateResponse = await response.json();
    
    if (!data.rates) {
      throw new Error('Invalid API response: missing rates');
    }
    
    // Extract rates for our supported currencies
    const rates = {
      USD: data.rates.USD || STATIC_CURRENCIES.USD.exchangeRate,
      EUR: data.rates.EUR || STATIC_CURRENCIES.EUR.exchangeRate,
      GBP: data.rates.GBP || STATIC_CURRENCIES.GBP.exchangeRate,
    };
    
    // Update live currencies
    LIVE_CURRENCIES = {
      INR: { ...STATIC_CURRENCIES.INR, exchangeRate: 1 },
      USD: { ...STATIC_CURRENCIES.USD, exchangeRate: rates.USD },
      EUR: { ...STATIC_CURRENCIES.EUR, exchangeRate: rates.EUR },
      GBP: { ...STATIC_CURRENCIES.GBP, exchangeRate: rates.GBP },
    };
    
    // Save to cache
    saveCachedRates(rates);
    
    console.log('✅ Updated currency rates:', rates);
    console.log(`📅 Rate date: ${data.date}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to fetch live currency rates:', error);
    console.log('🔄 Falling back to static/cached rates');
    return false;
  }
};

/**
 * Initialize currency system
 * Loads cached rates or fetches live rates
 */
export const initializeCurrency = async (): Promise<void> => {
  // First, try to load cached rates
  const hasCachedRates = loadCachedRates();
  
  if (hasCachedRates) {
    console.log('📦 Using cached currency rates');
    // Optionally fetch fresh rates in background (non-blocking)
    fetchLiveCurrencyRates().catch(() => {
      // Silently fail - we have cached rates
    });
  } else {
    console.log('🌐 Cache expired or missing, fetching live rates...');
    // Try to fetch live rates, fallback to static if it fails
    const success = await fetchLiveCurrencyRates();
    if (!success) {
      console.log('📋 Using static fallback rates');
      LIVE_CURRENCIES = { ...STATIC_CURRENCIES };
    }
  }
};

/**
 * Manually refresh currency rates
 */
export const refreshCurrencyRates = async (): Promise<boolean> => {
  return await fetchLiveCurrencyRates();
};

/**
 * Get current currency configuration (live or fallback)
 */
export const CURRENCIES = new Proxy(LIVE_CURRENCIES, {
  get(target, prop) {
    return target[prop as CurrencyCode];
  }
});

/**
 * Format price with currency symbol and proper formatting
 */
export const formatCurrency = (
  amount: number, 
  currencyCode: CurrencyCode = 'INR',
  showCode: boolean = false
): string => {
  const currency = LIVE_CURRENCIES[currencyCode];
  const convertedAmount = amount * currency.exchangeRate;
  
  // Format number with appropriate decimal places
  let formattedAmount: string;
  
  if (currencyCode === 'INR') {
    // Indian number formatting (lakhs, crores)
    if (convertedAmount >= 10000000) { // 1 crore
      formattedAmount = (convertedAmount / 10000000).toFixed(2) + 'Cr';
    } else if (convertedAmount >= 100000) { // 1 lakh
      formattedAmount = (convertedAmount / 100000).toFixed(2) + 'L';
    } else if (convertedAmount >= 1000) { // 1 thousand
      formattedAmount = (convertedAmount / 1000).toFixed(1) + 'K';
    } else {
      formattedAmount = Math.round(convertedAmount).toString();
    }
  } else {
    // International formatting
    if (convertedAmount >= 1000000) { // 1 million
      formattedAmount = (convertedAmount / 1000000).toFixed(2) + 'M';
    } else if (convertedAmount >= 1000) { // 1 thousand
      formattedAmount = (convertedAmount / 1000).toFixed(1) + 'K';
    } else {
      formattedAmount = convertedAmount.toFixed(2);
    }
  }
  
  const result = `${currency.symbol}${formattedAmount}`;
  return showCode ? `${result} ${currency.code}` : result;
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currencyCode: CurrencyCode): string => {
  return LIVE_CURRENCIES[currencyCode].symbol;
};

/**
 * Convert amount from INR to target currency
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: CurrencyCode = 'INR',
  toCurrency: CurrencyCode = 'INR'
): number => {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to INR first if needed
  const inrAmount = fromCurrency === 'INR' ? amount : amount / LIVE_CURRENCIES[fromCurrency].exchangeRate;
  
  // Convert from INR to target currency
  return inrAmount * LIVE_CURRENCIES[toCurrency].exchangeRate;
};

/**
 * Get all available currencies with current rates
 */
export const getAllCurrencies = () => {
  return Object.entries(LIVE_CURRENCIES).map(([code, currency]) => ({
    code: code as CurrencyCode,
    symbol: currency.symbol,
    name: currency.name,
    exchangeRate: currency.exchangeRate,
  }));
};

/**
 * Get currency rate information
 */
export const getCurrencyInfo = () => {
  const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const isLive = timestamp && isCacheValid();
  
  return {
    isLive,
    lastUpdated: timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'Never',
    source: isLive ? 'Live API' : 'Static/Fallback',
    nextUpdate: timestamp 
      ? new Date(parseInt(timestamp) + CACHE_DURATION).toLocaleString()
      : 'On next app load'
  };
};

// Auto-initialize when module loads
initializeCurrency(); 