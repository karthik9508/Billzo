// Test file to demonstrate currency formatting differences
import { formatInvoiceAmount, formatPDFAmount, CURRENCIES } from './currency-utils';

/**
 * Test function to show the difference between regular and PDF currency formatting
 */
export function testCurrencyFormatting() {
  const testAmount = 1234.56;
  
  console.log('Currency Formatting Test Results:');
  console.log('=================================');
  
  Object.keys(CURRENCIES).forEach(code => {
    const currencyCode = code as keyof typeof CURRENCIES;
    const regularFormat = formatInvoiceAmount(testAmount, currencyCode);
    const pdfFormat = formatPDFAmount(testAmount, currencyCode);
    
    console.log(`${code}:`);
    console.log(`  Regular display: ${regularFormat}`);
    console.log(`  PDF display:     ${pdfFormat}`);
    console.log('');
  });
}

// Example specific to INR
export function demonstrateINRFix() {
  const amount = 50000.75;
  
  console.log('INR Currency Fix Demonstration:');
  console.log('==============================');
  console.log(`Amount: ${amount}`);
  console.log(`Web display:  ${formatInvoiceAmount(amount, 'INR')} (uses ₹ symbol)`);
  console.log(`PDF display:  ${formatPDFAmount(amount, 'INR')} (uses Rs. for better PDF compatibility)`);
  console.log('');
  console.log('This ensures INR amounts display correctly in both web interface and PDF exports.');
}