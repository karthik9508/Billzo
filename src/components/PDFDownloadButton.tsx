'use client';

import { useState } from 'react';
import { directPDFGenerator } from '@/lib/direct-pdf-generator';
import { simplePDFGenerator } from '@/lib/simple-pdf-generator';
import { offlinePDFGenerator } from '@/lib/offline-pdf-generator';
import { Invoice } from '@/types/invoice';

interface PDFDownloadButtonProps {
  invoice: Invoice;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PDFDownloadButton({ 
  invoice, 
  variant = 'primary', 
  size = 'md',
  className = '' 
}: PDFDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      console.log('🚀 Starting PDF generation for invoice:', invoice.invoiceNumber);
      
      // Try the direct canvas-based PDF generator first (most reliable)
      try {
        await directPDFGenerator.generateInvoicePDF(invoice);
        console.log('✅ PDF generated successfully with direct generator');
        return;
      } catch (directError) {
        console.warn('⚠️ Direct generator failed, trying CDN method:', directError instanceof Error ? directError.message : 'Unknown error');
        
        // Fallback to CDN-based generator
        try {
          await simplePDFGenerator.generateInvoicePDF(invoice);
          console.log('✅ PDF generated successfully with CDN generator');
          return;
        } catch (cdnError) {
          console.warn('⚠️ CDN generator failed, trying offline fallback:', cdnError instanceof Error ? cdnError.message : 'Unknown CDN error');
          
          // Final fallback to offline generator
          await offlinePDFGenerator.generateInvoicePDF(invoice);
          console.log('✅ PDF generated successfully with offline generator');
          return;
        }
      }
      
    } catch (error) {
      console.error('❌ All PDF generation methods failed:', error);
      
      // Show detailed error message with troubleshooting tips
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(
        `Failed to generate PDF: ${errorMessage}\n\n` +
        `All generation methods attempted:\n` +
        `✓ Direct canvas method\n` +
        `✓ CDN-based jsPDF\n` +
        `✓ Offline fallback\n\n` +
        `Please try:\n` +
        `• Refreshing the page\n` +
        `• Using a different browser\n` +
        `• Checking browser console for details\n\n` +
        `Contact support if this issue persists.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };
    
    const variantClasses = {
      primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
      secondary: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500',
    };
    
    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;
  };

  return (
    <button
      onClick={handleDownloadPDF}
      disabled={isGenerating}
      className={getButtonClasses()}
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          Generating...
        </>
      ) : (
        <>
          <span className="mr-2">📄</span>
          Download PDF
        </>
      )}
    </button>
  );
}