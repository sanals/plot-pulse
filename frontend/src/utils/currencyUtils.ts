// Currency configuration with fallback static rates (approximate, per 1 INR)
const STATIC_CURRENCIES = {
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee', exchangeRate: 1 },
  USD: { symbol: '$', code: 'USD', name: 'US Dollar', exchangeRate: 0.012 },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro', exchangeRate: 0.011 },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound', exchangeRate: 0.0095 },
  AED: { symbol: 'د.إ', code: 'AED', name: 'UAE Dirham', exchangeRate: 0.044 },
  SAR: { symbol: '﷼', code: 'SAR', name: 'Saudi Riyal', exchangeRate: 0.045 },
  AUD: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar', exchangeRate: 0.018 },
  CAD: { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar', exchangeRate: 0.016 },
  SGD: { symbol: 'S$', code: 'SGD', name: 'Singapore Dollar', exchangeRate: 0.016 },
  NZD: { symbol: 'NZ$', code: 'NZD', name: 'New Zealand Dollar', exchangeRate: 0.019 },
  CHF: { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc', exchangeRate: 0.011 },
  JPY: { symbol: '¥', code: 'JPY', name: 'Japanese Yen', exchangeRate: 1.75 },
  CNY: { symbol: '¥', code: 'CNY', name: 'Chinese Yuan', exchangeRate: 0.085 },
  HKD: { symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar', exchangeRate: 0.094 },
  THB: { symbol: '฿', code: 'THB', name: 'Thai Baht', exchangeRate: 0.44 },
  MYR: { symbol: 'RM', code: 'MYR', name: 'Malaysian Ringgit', exchangeRate: 0.057 },
  IDR: { symbol: 'Rp', code: 'IDR', name: 'Indonesian Rupiah', exchangeRate: 189 },
  KRW: { symbol: '₩', code: 'KRW', name: 'South Korean Won', exchangeRate: 16 },
  TWD: { symbol: 'NT$', code: 'TWD', name: 'Taiwan Dollar', exchangeRate: 0.37 },
  PHP: { symbol: '₱', code: 'PHP', name: 'Philippine Peso', exchangeRate: 0.68 },
  ZAR: { symbol: 'R', code: 'ZAR', name: 'South African Rand', exchangeRate: 0.21 },
  BRL: { symbol: 'R$', code: 'BRL', name: 'Brazilian Real', exchangeRate: 0.059 },
  MXN: { symbol: '$', code: 'MXN', name: 'Mexican Peso', exchangeRate: 0.21 },
  TRY: { symbol: '₺', code: 'TRY', name: 'Turkish Lira', exchangeRate: 0.36 },
  SEK: { symbol: 'kr', code: 'SEK', name: 'Swedish Krona', exchangeRate: 0.13 },
  NOK: { symbol: 'kr', code: 'NOK', name: 'Norwegian Krone', exchangeRate: 0.13 },
  DKK: { symbol: 'kr', code: 'DKK', name: 'Danish Krone', exchangeRate: 0.081 },
  PLN: { symbol: 'zł', code: 'PLN', name: 'Polish Złoty', exchangeRate: 0.047 },
  RUB: { symbol: '₽', code: 'RUB', name: 'Russian Ruble', exchangeRate: 1.05 },
} as const;

export type CurrencyCode = keyof typeof STATIC_CURRENCIES;
const SUPPORTED_CODES: CurrencyCode[] = Object.keys(STATIC_CURRENCIES) as CurrencyCode[];

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
    
    const rates = JSON.parse(cachedRates) as Record<string, number>;
    
    // Update live currencies with cached rates (fallback to static)
    const updated: Partial<CurrenciesType> = {};
    SUPPORTED_CODES.forEach(code => {
      updated[code] = {
        ...STATIC_CURRENCIES[code],
        exchangeRate: code === 'INR'
          ? 1
          : rates[code] ?? STATIC_CURRENCIES[code].exchangeRate,
      };
    });
    LIVE_CURRENCIES = updated as CurrenciesType;
    
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
    
    // Extract rates for all supported currencies (fallback to static)
    const rates: Record<string, number> = {};
    SUPPORTED_CODES.forEach(code => {
      if (code === 'INR') return;
      rates[code] = data.rates[code] ?? STATIC_CURRENCIES[code].exchangeRate;
    });
    
    // Update live currencies
    const updated: Partial<CurrenciesType> = {};
    SUPPORTED_CODES.forEach(code => {
      updated[code] = {
        ...STATIC_CURRENCIES[code],
        exchangeRate: code === 'INR' ? 1 : rates[code],
      };
    });
    LIVE_CURRENCIES = updated as CurrenciesType;
    
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
 * Refresh currency rates from live API
 */
export const refreshCurrencyRates = async (): Promise<boolean> => {
  try {
    console.log('🔄 Refreshing currency rates...');
    
    const response = await fetch(`${EXCHANGE_API_BASE}/${BASE_CURRENCY}`);
    
    if (!response.ok) {
      console.warn('Failed to fetch live rates, using cached/static rates');
      return false;
    }

    const data: ExchangeRateResponse = await response.json();
    console.log('📊 Received exchange rate data:', data);

    // Update live currencies with new rates
    SUPPORTED_CODES.forEach(code => {
      if (code === 'INR') return;
      if (data.rates[code]) {
        LIVE_CURRENCIES[code] = {
          ...LIVE_CURRENCIES[code],
          exchangeRate: data.rates[code],
        };
      }
    });

    // Cache the results
    const cacheData = {
      rates: data.rates,
      timestamp: Date.now(),
      date: data.date
    };
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('✅ Currency rates cached successfully');
    } catch (error) {
      console.warn('Failed to cache currency rates:', error);
    }

    // Clear price formatting cache since rates have changed
    const { clearPriceFormatCache } = await import('./priceConversions');
    clearPriceFormatCache();
    console.log('🧹 Cleared price formatting cache due to rate update');

    console.log('✅ Currency rates refreshed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error refreshing currency rates:', error);
    return false;
  }
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