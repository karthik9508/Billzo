import jsPDF from 'jspdf';
import { Invoice } from '@/types/invoice';
import { formatPDFAmount } from '@/lib/currency-utils';
import { userStorage } from '@/lib/user-storage';

export function generateInvoicePDF(invoice: Invoice, userProfile?: any): void {
  const doc = new jsPDF();
  
  // Get user profile if not provided
  if (!userProfile) {
    userProfile = userStorage.getProfile();
  }
  
  // Set default black color for all text
  doc.setTextColor(0, 0, 0);
  
  // Set font
  doc.setFont('helvetica');
  
  // Company/Business header (top left)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  if (userProfile?.company?.name) {
    doc.text(userProfile.company.name, 20, 25);
  } else {
    doc.text('Your Company Name', 20, 25);
  }
  
  // Company details (top left)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 35;
  
  if (userProfile?.company?.address) {
    const addressLines = userProfile.company.address.split('\n');
    addressLines.forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 8;
    });
  }
  
  if (userProfile?.company?.phone) {
    doc.text(`Phone: ${userProfile.company.phone}`, 20, yPos);
    yPos += 8;
  }
  
  if (userProfile?.company?.email) {
    doc.text(`Email: ${userProfile.company.email}`, 20, yPos);
    yPos += 8;
  }
  
  if (userProfile?.company?.website) {
    doc.text(`Website: ${userProfile.company.website}`, 20, yPos);
    yPos += 8;
  }
  
  // Invoice title and details (top right)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 120, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 120, 40);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 120, 50);
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 120, 60);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 120, 70);
  
  // Bill To section (adjust y position based on company info)
  const billToStartY = Math.max(yPos + 10, 90);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, billToStartY);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  let billToYPos = billToStartY + 15;
  doc.text(invoice.client.name, 20, billToYPos);
  billToYPos += 10;
  doc.text(invoice.client.email, 20, billToYPos);
  billToYPos += 10;
  
  // Split address by lines
  const clientAddressLines = invoice.client.address.split('\n');
  clientAddressLines.forEach(line => {
    doc.text(line, 20, billToYPos);
    billToYPos += 10;
  });
  
  if (invoice.client.phone) {
    doc.text(invoice.client.phone, 20, billToYPos);
    billToYPos += 10;
  }
  
  // Items table header
  const tableStartY = billToYPos + 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, tableStartY);
  doc.text('Qty', 120, tableStartY);
  doc.text('Rate', 140, tableStartY);
  doc.text('Amount', 170, tableStartY);
  
  // Draw line under header
  doc.line(20, tableStartY + 5, 190, tableStartY + 5);
  
  // Items
  doc.setFont('helvetica', 'normal');
  let currentY = tableStartY + 15;
  
  invoice.items.forEach(item => {
    doc.text(item.description, 20, currentY);
    doc.text(item.quantity.toString(), 120, currentY);
    doc.text(formatPDFAmount(item.rate), 140, currentY);
    doc.text(formatPDFAmount(item.amount), 170, currentY);
    currentY += 15;
  });
  
  // Summary section
  const summaryStartY = currentY + 20;
  doc.line(120, summaryStartY - 10, 190, summaryStartY - 10);
  
  doc.text('Subtotal:', 120, summaryStartY);
  doc.text(formatPDFAmount(invoice.subtotal), 170, summaryStartY);
  
  doc.text('Tax:', 120, summaryStartY + 10);
  doc.text(formatPDFAmount(invoice.tax), 170, summaryStartY + 10);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 120, summaryStartY + 25);
  doc.text(formatPDFAmount(invoice.total), 170, summaryStartY + 25);
  
  // Notes section
  if (invoice.notes) {
    const notesStartY = summaryStartY + 50;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, notesStartY);
    
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(noteLines, 20, notesStartY + 15);
  }
  
  // Download the PDF
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
}

export function previewInvoicePDF(invoice: Invoice): string {
  const doc = new jsPDF();
  const userProfile = userStorage.getProfile();
  
  // Set font
  doc.setFont('helvetica');
  
  // Company/Business header (top left)
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  if (userProfile?.company?.name) {
    doc.text(userProfile.company.name, 20, 25);
  }
  
  // Company details (top left)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 35;
  
  if (userProfile?.company?.address) {
    const addressLines = userProfile.company.address.split('\n');
    addressLines.forEach(line => {
      doc.text(line, 20, yPos);
      yPos += 8;
    });
  }
  
  if (userProfile?.company?.phone) {
    doc.text(`Phone: ${userProfile.company.phone}`, 20, yPos);
    yPos += 8;
  }
  
  if (userProfile?.company?.email) {
    doc.text(`Email: ${userProfile.company.email}`, 20, yPos);
    yPos += 8;
  }
  
  if (userProfile?.company?.website) {
    doc.text(`Website: ${userProfile.company.website}`, 20, yPos);
    yPos += 8;
  }
  
  // Invoice title and details (top right)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 120, 25);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 120, 40);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 120, 50);
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 120, 60);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 120, 70);
  
  // Bill To section (adjust y position based on company info)
  const billToStartY = Math.max(yPos + 10, 90);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, billToStartY);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  let billToYPos = billToStartY + 15;
  doc.text(invoice.client.name, 20, billToYPos);
  billToYPos += 10;
  doc.text(invoice.client.email, 20, billToYPos);
  billToYPos += 10;
  
  // Split address by lines
  const clientAddressLines = invoice.client.address.split('\n');
  clientAddressLines.forEach(line => {
    doc.text(line, 20, billToYPos);
    billToYPos += 10;
  });
  
  if (invoice.client.phone) {
    doc.text(invoice.client.phone, 20, billToYPos);
    billToYPos += 10;
  }
  
  // Items table header
  const tableStartY = billToYPos + 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, tableStartY);
  doc.text('Qty', 120, tableStartY);
  doc.text('Rate', 140, tableStartY);
  doc.text('Amount', 170, tableStartY);
  
  // Draw line under header
  doc.line(20, tableStartY + 5, 190, tableStartY + 5);
  
  // Items
  doc.setFont('helvetica', 'normal');
  let currentY = tableStartY + 15;
  
  invoice.items.forEach(item => {
    doc.text(item.description, 20, currentY);
    doc.text(item.quantity.toString(), 120, currentY);
    doc.text(formatPDFAmount(item.rate), 140, currentY);
    doc.text(formatPDFAmount(item.amount), 170, currentY);
    currentY += 15;
  });
  
  // Summary section
  const summaryStartY = currentY + 20;
  doc.line(120, summaryStartY - 10, 190, summaryStartY - 10);
  
  doc.text('Subtotal:', 120, summaryStartY);
  doc.text(formatPDFAmount(invoice.subtotal), 170, summaryStartY);
  
  doc.text('Tax:', 120, summaryStartY + 10);
  doc.text(formatPDFAmount(invoice.tax), 170, summaryStartY + 10);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Total:', 120, summaryStartY + 25);
  doc.text(formatPDFAmount(invoice.total), 170, summaryStartY + 25);
  
  // Notes section
  if (invoice.notes) {
    const notesStartY = summaryStartY + 50;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 20, notesStartY);
    
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(invoice.notes, 170);
    doc.text(noteLines, 20, notesStartY + 15);
  }
  
  // Return base64 string for preview
  return doc.output('datauristring');
}