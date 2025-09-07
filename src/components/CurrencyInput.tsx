'use client';

import React, { useState, useEffect } from 'react';
import { getCurrencySymbol, CurrencyCode, getCurrencyInfo } from '@/lib/currency-utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  /** Current value as a number */
  value: number;
  /** Change handler that receives the numeric value */
  onChange: (value: number) => void;
  /** Optional currency code override */
  currency?: CurrencyCode;
  /** Additional CSS classes for the container */
  containerClassName?: string;
  /** Show currency code next to symbol */
  showCode?: boolean;
  /** Input label */
  label?: string;
  /** Error message to display */
  error?: string;
}

/**
 * Currency-aware input component that displays the appropriate currency symbol
 * and handles numeric input formatting
 */
export default function CurrencyInput({
  value,
  onChange,
  currency,
  containerClassName = '',
  showCode = false,
  label,
  error,
  placeholder,
  className = '',
  disabled,
  required,
  ...inputProps
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());
  const currencyInfo = getCurrencyInfo(currency);
  
  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);
    
    // Convert to number and call onChange
    const numericValue = parseFloat(rawValue) || 0;
    onChange(numericValue);
  };

  const handleBlur = () => {
    // Format the input value on blur for better UX
    const numericValue = parseFloat(inputValue) || 0;
    setInputValue(numericValue.toFixed(2));
  };

  // Determine if symbol goes before or after based on currency
  const symbolAfter = ['SEK', 'NOK', 'DKK'].includes(currencyInfo.code);
  
  const currencyDisplay = showCode 
    ? `${currencyInfo.symbol} ${currencyInfo.code}`
    : currencyInfo.symbol;

  const inputClasses = `
    w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
    rounded-md focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-[#1E3A8A] 
    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
    disabled:opacity-50 disabled:cursor-not-allowed
    ${symbolAfter ? 'pr-12' : 'pl-12'}
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
    ${className}
  `.trim();

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {showCode && `(${currencyInfo.code})`}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type="number"
          step="0.01"
          min="0"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder || `0.00`}
          className={inputClasses}
          disabled={disabled}
          required={required}
          {...inputProps}
        />
        
        {/* Currency symbol overlay */}
        <div className={`
          absolute top-0 ${symbolAfter ? 'right-0' : 'left-0'} h-full 
          flex items-center ${symbolAfter ? 'pr-3' : 'pl-3'}
          pointer-events-none text-gray-500 dark:text-gray-400
        `}>
          <span className="text-sm font-medium">{currencyDisplay}</span>
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Compact version of currency input without label
 */
export function CurrencyInputCompact(props: Omit<CurrencyInputProps, 'label'>) {
  return <CurrencyInput {...props} />;
}

/**
 * Currency input with validation for invoice amounts
 */
export function CurrencyInputInvoice({
  value,
  onChange,
  error,
  ...props
}: CurrencyInputProps) {
  const [validationError, setValidationError] = useState<string>('');

  const handleChange = (newValue: number) => {
    // Validate invoice amount
    if (newValue < 0) {
      setValidationError('Amount cannot be negative');
    } else if (newValue > 999999.99) {
      setValidationError('Amount cannot exceed 999,999.99');
    } else {
      setValidationError('');
    }
    
    onChange(newValue);
  };

  return (
    <CurrencyInput
      value={value}
      onChange={handleChange}
      error={error || validationError}
      {...props}
    />
  );
}