import { userStorage } from './user-storage';

// Currency configuration mapping
export const CURRENCIES = {
  USD: { symbol: '$', pdfSymbol: '$', name: 'US Dollar', code: 'USD' },
  EUR: { symbol: '€', pdfSymbol: 'EUR', name: 'Euro', code: 'EUR' },
  GBP: { symbol: '£', pdfSymbol: 'GBP', name: 'British Pound', code: 'GBP' },
  CAD: { symbol: 'C$', pdfSymbol: 'C$', name: 'Canadian Dollar', code: 'CAD' },
  AUD: { symbol: 'A$', pdfSymbol: 'A$', name: 'Australian Dollar', code: 'AUD' },
  JPY: { symbol: '¥', pdfSymbol: 'JPY', name: 'Japanese Yen', code: 'JPY' },
  CHF: { symbol: 'CHF', pdfSymbol: 'CHF', name: 'Swiss Franc', code: 'CHF' },
  SEK: { symbol: 'kr', pdfSymbol: 'kr', name: 'Swedish Krona', code: 'SEK' },
  NOK: { symbol: 'kr', pdfSymbol: 'kr', name: 'Norwegian Krone', code: 'NOK' },
  DKK: { symbol: 'kr', pdfSymbol: 'kr', name: 'Danish Krone', code: 'DKK' },
  INR: { symbol: '₹', pdfSymbol: 'Rs.', name: 'Indian Rupee', code: 'INR' },
  CNY: { symbol: '¥', pdfSymbol: 'CNY', name: 'Chinese Yuan', code: 'CNY' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

/**
 * Get the user's selected currency from settings
 */
export function getUserCurrency(): CurrencyCode {
  try {
    const settings = userStorage.getSettings();
    const currency = settings.invoiceDefaults.currency as CurrencyCode;
    
    // Validate that the currency exists in our mapping
    if (currency && CURRENCIES[currency]) {
      return currency;
    }
  } catch (error) {
    console.warn('Error getting user currency, falling back to USD:', error);
  }
  
  // Fallback to USD if not set or invalid
  return 'USD';
}

/**
 * Get currency symbol for the given currency code
 */
export function getCurrencySymbol(currencyCode?: CurrencyCode): string {
  const code = currencyCode || getUserCurrency();
  return CURRENCIES[code]?.symbol || '$';
}

/**
 * Get currency information for the given currency code
 */
export function getCurrencyInfo(currencyCode?: CurrencyCode) {
  const code = currencyCode || getUserCurrency();
  return CURRENCIES[code] || CURRENCIES.USD;
}

/**
 * Format amount with appropriate currency symbol and locale formatting
 */
export function formatCurrency(
  amount: number, 
  currencyCode?: CurrencyCode,
  options: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;
  
  const currency = getCurrencyInfo(currencyCode);
  
  // Format the number with appropriate decimal places
  const formattedNumber = amount.toFixed(maximumFractionDigits);
  
  // Add thousand separators for readability
  const parts = formattedNumber.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedAmount = parts.join('.');
  
  if (!showSymbol) {
    return formattedAmount;
  }
  
  // For symbols that go after the amount (like kr for SEK/NOK/DKK)
  if (['SEK', 'NOK', 'DKK'].includes(currency.code)) {
    return `${formattedAmount} ${currency.symbol}`;
  }
  
  // For most currencies, symbol goes before
  return `${currency.symbol}${formattedAmount}`;
}

/**
 * Format amount for display in invoices (with currency symbol)
 */
export function formatInvoiceAmount(amount: number, currencyCode?: CurrencyCode): string {
  return formatCurrency(amount, currencyCode, { showSymbol: true });
}

/**
 * Format amount for PDF generation (optimized for clean PDF display)
 * Uses PDF-safe symbols to avoid rendering issues
 */
export function formatPDFAmount(amount: number, currencyCode?: CurrencyCode): string {
  const code = currencyCode || getUserCurrency();
  const currency = CURRENCIES[code] || CURRENCIES.USD;
  
  // Format the number with appropriate decimal places
  const formattedNumber = amount.toFixed(2);
  
  // Add thousand separators for readability
  const parts = formattedNumber.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedAmount = parts.join('.');
  
  // Use PDF-safe symbols
  const pdfSymbol = currency.pdfSymbol;
  
  // For symbols that go after the amount (like kr for SEK/NOK/DKK)
  if (['SEK', 'NOK', 'DKK'].includes(currency.code)) {
    return `${formattedAmount} ${pdfSymbol}`;
  }
  
  // For most currencies, symbol goes before
  return `${pdfSymbol} ${formattedAmount}`;
}

/**
 * Get all available currencies for dropdowns/selects
 */
export function getAllCurrencies() {
  return Object.entries(CURRENCIES).map(([code, info]) => ({
    code: code as CurrencyCode,
    ...info,
    displayName: `${code} (${info.symbol}) - ${info.name}`
  }));
}

/**
 * Validate if a currency code is supported
 */
export function isSupportedCurrency(code: string): code is CurrencyCode {
  return code in CURRENCIES;
}