'use client';

import { formatInvoiceAmount, CurrencyCode } from '@/lib/currency-utils';

interface CurrencyDisplayProps {
  /** The amount to display */
  amount: number;
  /** Optional currency code override. If not provided, uses user's default currency */
  currency?: CurrencyCode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the currency symbol */
  showSymbol?: boolean;
  /** Number format options */
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  };
}

/**
 * Consistent currency display component that respects user's selected currency
 * and handles proper formatting for all supported currencies
 */
export default function CurrencyDisplay({ 
  amount, 
  currency, 
  className = '', 
  showSymbol = true,
  options = {}
}: CurrencyDisplayProps) {
  const formattedAmount = formatInvoiceAmount(amount, currency);
  
  return (
    <span className={className}>
      {showSymbol ? formattedAmount : amount.toFixed(options.maximumFractionDigits || 2)}
    </span>
  );
}

/**
 * Large currency display variant for totals and prominent amounts
 */
export function CurrencyDisplayLarge({ 
  amount, 
  currency, 
  className = '' 
}: Omit<CurrencyDisplayProps, 'showSymbol' | 'options'>) {
  return (
    <CurrencyDisplay 
      amount={amount} 
      currency={currency} 
      className={`text-2xl font-bold ${className}`}
    />
  );
}

/**
 * Small currency display variant for subtotals and line items
 */
export function CurrencyDisplaySmall({ 
  amount, 
  currency, 
  className = '' 
}: Omit<CurrencyDisplayProps, 'showSymbol' | 'options'>) {
  return (
    <CurrencyDisplay 
      amount={amount} 
      currency={currency} 
      className={`text-sm ${className}`}
    />
  );
}

/**
 * Muted currency display for secondary amounts
 */
export function CurrencyDisplayMuted({ 
  amount, 
  currency, 
  className = '' 
}: Omit<CurrencyDisplayProps, 'showSymbol' | 'options'>) {
  return (
    <CurrencyDisplay 
      amount={amount} 
      currency={currency} 
      className={`text-gray-600 dark:text-gray-400 ${className}`}
    />
  );
}