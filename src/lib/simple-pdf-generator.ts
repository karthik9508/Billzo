import { Invoice } from '@/types/invoice';
import { formatPDFAmount } from '@/lib/currency-utils';

// Simple PDF generator with inline library loading
class SimplePDFGenerator {
  private isLoading = false;
  private isLoaded = false;

  async generateInvoicePDF(invoice: Invoice): Promise<void> {
    console.log('🚀 Starting simple PDF generation for:', invoice.invoiceNumber);
    
    try {
      // Load jsPDF if not already loaded
      await this.ensureJsPDFLoaded();
      
      // Generate the PDF
      await this.createPDF(invoice);
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async ensureJsPDFLoaded(): Promise<void> {
    // Check if already loaded
    if (this.isLoaded && (window as any).jsPDF) {
      console.log('✅ jsPDF already loaded');
      return;
    }

    // Check if currently loading
    if (this.isLoading) {
      console.log('⏳ Waiting for jsPDF to load...');
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    console.log('📦 Loading jsPDF library...');
    this.isLoading = true;

    // CDN URLs to try in order
    const cdnUrls = [
      'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
      'https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js'
    ];

    for (let i = 0; i < cdnUrls.length; i++) {
      const url = cdnUrls[i];
      console.log(`🔄 Trying CDN ${i + 1}/${cdnUrls.length}: ${url}`);
      
      try {
        await this.loadScriptFromCDN(url, i === cdnUrls.length - 1);
        console.log('✅ jsPDF loaded successfully from CDN');
        this.isLoaded = true;
        this.isLoading = false;
        return;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`⚠️ CDN ${i + 1} failed:`, errorMsg);
        if (i === cdnUrls.length - 1) {
          this.isLoading = false;
          throw new Error(`All CDN sources failed. Last error: ${errorMsg}`);
        }
        // Continue to next CDN
      }
    }
  }

  private async loadScriptFromCDN(url: string, isLastAttempt: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      // Remove any existing scripts first
      const existingScripts = document.querySelectorAll('script[src*="jspdf"]');
      existingScripts.forEach(script => script.remove());

      const script = document.createElement('script');
      script.src = url;
      script.crossOrigin = 'anonymous';
      
      let resolved = false;
      
      script.onload = () => {
        console.log('📥 Script loaded from:', url);
        
        // Check for library availability with multiple attempts
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds total
        
        const checkLibrary = () => {
          attempts++;
          const jsPDFFromWindow = (window as any).jsPDF;
          
          if (jsPDFFromWindow && typeof jsPDFFromWindow === 'function') {
            console.log(`✅ jsPDF ready after ${attempts} attempts`);
            if (!resolved) {
              resolved = true;
              resolve();
            }
            return;
          }
          
          if (attempts < maxAttempts) {
            setTimeout(checkLibrary, 100);
          } else {
            console.error('❌ jsPDF not available after script load');
            if (!resolved) {
              resolved = true;
              reject(new Error('jsPDF not available after script load'));
            }
          }
        };
        
        checkLibrary();
      };
      
      script.onerror = (error) => {
        console.error('❌ Script failed to load:', error);
        if (!resolved) {
          resolved = true;
          reject(new Error(`Script load failed: ${url}`));
        }
      };
      
      // Timeout for this specific CDN attempt
      const timeout = isLastAttempt ? 15000 : 5000; // Give more time for last attempt
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error(`CDN timeout after ${timeout/1000}s: ${url}`));
        }
      }, timeout);
      
      // Add to document
      document.head.appendChild(script);
    });
  }

  private async createPDF(invoice: Invoice): Promise<void> {
    console.log('📄 Creating PDF document...');
    
    const jsPDF = (window as any).jsPDF;
    if (!jsPDF) {
      throw new Error('jsPDF not available');
    }

    // Create new PDF document
    const doc = new jsPDF();
    console.log('✅ PDF document created');

    // Add content
    this.addHeader(doc, invoice);
    this.addClientInfo(doc, invoice);
    this.addInvoiceDetails(doc, invoice);
    this.addItemsTable(doc, invoice);
    this.addTotals(doc, invoice);
    this.addFooter(doc, invoice);

    // Save the PDF
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    console.log('💾 Saving PDF as:', filename);
    doc.save(filename);
    console.log('✅ PDF downloaded successfully!');
  }

  private addHeader(doc: any, invoice: Invoice) {
    // Main title
    doc.setFontSize(28);
    doc.setTextColor(44, 62, 80);
    doc.text('INVOICE', 20, 25);
    
    // Invoice number
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(invoice.invoiceNumber, 20, 35);
    
    // Status badge background
    const statusColor = this.getStatusColor(invoice.status);
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(150, 15, 40, 12, 'F');
    
    // Status text
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(invoice.status.toUpperCase(), 155, 23);
  }

  private addClientInfo(doc: any, invoice: Invoice) {
    let y = 55;
    
    // From section
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text('From:', 20, y);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text('Billzo', 20, y + 8);
    doc.text('Professional Services', 20, y + 16);
    
    // Bill To section
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text('Bill To:', 120, y);
    
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(invoice.client.name, 120, y + 8);
    doc.text(invoice.client.email, 120, y + 16);
    
    // Address (handle multiline)
    const addressLines = invoice.client.address.split('\n');
    addressLines.forEach((line, index) => {
      doc.text(line, 120, y + 24 + (index * 8));
    });
    
    if (invoice.client.phone) {
      doc.text(invoice.client.phone, 120, y + 24 + (addressLines.length * 8));
    }
  }

  private addInvoiceDetails(doc: any, invoice: Invoice) {
    const y = 110;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Invoice Date:', 20, y);
    doc.text('Due Date:', 20, y + 8);
    doc.text('Invoice #:', 20, y + 16);
    
    doc.setTextColor(80, 80, 80);
    doc.text(new Date(invoice.date).toLocaleDateString(), 70, y);
    doc.text(new Date(invoice.dueDate).toLocaleDateString(), 70, y + 8);
    doc.text(invoice.invoiceNumber, 70, y + 16);
  }

  private addItemsTable(doc: any, invoice: Invoice) {
    let y = 140;
    
    // Table header background
    doc.setFillColor(248, 249, 250);
    doc.rect(20, y, 170, 12, 'F');
    
    // Table headers
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text('Description', 25, y + 8);
    doc.text('Qty', 110, y + 8);
    doc.text('Rate', 130, y + 8);
    doc.text('Amount', 160, y + 8);
    
    y += 20;
    
    // Table rows
    doc.setTextColor(80, 80, 80);
    invoice.items.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(20, y - 4, 170, 12, 'F');
      }
      
      doc.text(item.description, 25, y + 4);
      doc.text(item.quantity.toString(), 115, y + 4);
      doc.text(formatPDFAmount(item.rate), 135, y + 4);
      doc.text(formatPDFAmount(item.amount), 165, y + 4);
      
      y += 12;
    });
    
    return y;
  }

  private addTotals(doc: any, invoice: Invoice) {
    const startY = 140 + 20 + (invoice.items.length * 12) + 10;
    let y = startY;
    const x = 120;
    
    // Subtotal
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Subtotal:', x, y);
    doc.setTextColor(80, 80, 80);
    doc.text(formatPDFAmount(invoice.subtotal), 170, y);
    
    // Tax
    y += 8;
    doc.setTextColor(100, 100, 100);
    doc.text('Tax:', x, y);
    doc.setTextColor(80, 80, 80);
    doc.text(formatPDFAmount(invoice.tax), 170, y);
    
    // Total line
    y += 12;
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(x, y, 185, y);
    
    // Total
    y += 10;
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text('Total:', x, y);
    doc.text(formatPDFAmount(invoice.total), 170, y);
  }

  private addFooter(doc: any, invoice: Invoice) {
    const pageHeight = doc.internal.pageSize.height;
    
    // Notes
    if (invoice.notes) {
      const notesY = pageHeight - 60;
      doc.setFontSize(10);
      doc.setTextColor(44, 62, 80);
      doc.text('Notes:', 20, notesY);
      
      doc.setTextColor(80, 80, 80);
      const noteLines = doc.splitTextToSize(invoice.notes, 170);
      noteLines.forEach((line: string, index: number) => {
        doc.text(line, 20, notesY + 10 + (index * 5));
      });
    }
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 20, pageHeight - 25);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, pageHeight - 15);
    
    // Mode indicator
    const modeText = invoice.mode === 'ai' ? '🤖 AI Generated' : '✏️ Manual';
    doc.text(modeText, 120, pageHeight - 15);
  }

  private getStatusColor(status: string): [number, number, number] {
    switch (status) {
      case 'paid': return [34, 197, 94]; // green
      case 'sent': return [59, 130, 246]; // blue  
      case 'overdue': return [239, 68, 68]; // red
      default: return [107, 114, 128]; // gray
    }
  }
}

export const simplePDFGenerator = new SimplePDFGenerator();