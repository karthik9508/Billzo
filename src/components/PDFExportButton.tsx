'use client';

import { generateInvoicePDF } from '@/lib/jspdf-invoice-generator';
import { Invoice } from '@/types/invoice';

interface PDFExportButtonProps {
  invoice: Invoice;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function PDFExportButton({ invoice, variant = 'primary', className = '' }: PDFExportButtonProps) {
  const handleExportPDF = () => {
    try {
      generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const baseClasses = "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300"
  };

  return (
    <button
      onClick={handleExportPDF}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      Export PDF
    </button>
  );
}