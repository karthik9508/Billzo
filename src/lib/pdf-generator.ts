import { Invoice } from '@/types/invoice';
import { formatPDFAmount } from '@/lib/currency-utils';

// PDF generation using jsPDF (we'll simulate this since we can't install packages)
// In a real implementation, you would install jsPDF: npm install jspdf

class PDFGenerator {
  private isJsPDFLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  private async loadJsPDF(): Promise<void> {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') {
      throw new Error('PDF generation is only available in the browser');
    }

    // If already loaded, return immediately
    if ((window as any).jsPDF && typeof (window as any).jsPDF === 'function') {
      console.log('jsPDF already available');
      this.isJsPDFLoaded = true;
      return Promise.resolve();
    }

    // If currently loading, return the existing promise
    if (this.loadingPromise) {
      console.log('jsPDF loading in progress, waiting...');
      return this.loadingPromise;
    }

    console.log('Starting jsPDF loading process...');
    
    // Create loading promise
    this.loadingPromise = new Promise<void>((resolve, reject) => {
      // Remove any existing jsPDF scripts first
      const existingScripts = document.querySelectorAll('script[src*="jspdf"]');
      existingScripts.forEach(script => {
        console.log('Removing existing jsPDF script');
        script.remove();
      });

      console.log('Loading jsPDF from CDN...');
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js';
      script.async = false; // Load synchronously to avoid race conditions
      script.crossOrigin = 'anonymous';
      
      let resolved = false;
      
      script.onload = () => {
        console.log('jsPDF script loaded, checking availability...');
        
        // Check multiple times with increasing delays
        const checkAttempts = [50, 100, 200, 500, 1000];
        let attemptIndex = 0;
        
        const checkInitialization = () => {
          const jsPDFFromWindow = (window as any).jsPDF;
          console.log(`Attempt ${attemptIndex + 1}: jsPDF type:`, typeof jsPDFFromWindow);
          
          if (jsPDFFromWindow && typeof jsPDFFromWindow === 'function') {
            console.log('✅ jsPDF loaded and available!');
            this.isJsPDFLoaded = true;
            if (!resolved) {
              resolved = true;
              resolve();
            }
            return;
          }
          
          attemptIndex++;
          if (attemptIndex < checkAttempts.length) {
            setTimeout(checkInitialization, checkAttempts[attemptIndex]);
          } else {
            console.error('❌ jsPDF failed to initialize after all attempts');
            console.log('Window keys containing "pdf":', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));
            if (!resolved) {
              resolved = true;
              this.loadingPromise = null;
              reject(new Error('jsPDF failed to initialize'));
            }
          }
        };
        
        // Start checking immediately
        checkInitialization();
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load jsPDF script:', error);
        if (!resolved) {
          resolved = true;
          this.loadingPromise = null;
          reject(new Error('Failed to load jsPDF library from CDN'));
        }
      };
      
      // Global timeout
      setTimeout(() => {
        if (!resolved) {
          console.error('❌ jsPDF loading timeout after 10 seconds');
          resolved = true;
          this.loadingPromise = null;
          reject(new Error('PDF library loading timeout'));
        }
      }, 10000);
      
      // Add script to head
      console.log('Adding jsPDF script to document head...');
      document.head.appendChild(script);
    });

    return this.loadingPromise;
  }

  async generateInvoicePDF(invoice: Invoice): Promise<void> {
    try {
      console.log('Starting PDF generation for invoice:', invoice.invoiceNumber);
      
      // Validate invoice data
      if (!invoice || !invoice.invoiceNumber) {
        throw new Error('Invalid invoice data: missing invoice number');
      }
      
      if (!invoice.client || !invoice.client.name) {
        throw new Error('Invalid invoice data: missing client information');
      }
      
      if (!invoice.items || invoice.items.length === 0) {
        throw new Error('Invalid invoice data: no items found');
      }
      
      console.log('Invoice validation passed, loading jsPDF...');
      await this.loadJsPDF();
      
      // Get jsPDF constructor from window object
      const jsPDF = (window as any).jsPDF;
      
      if (!jsPDF) {
        console.error('jsPDF constructor not available after loading');
        throw new Error('PDF library not available');
      }
      
      console.log('jsPDF library loaded, creating PDF document...');
      console.log('jsPDF constructor type:', typeof jsPDF);

      // Create new PDF document
      let doc;
      try {
        doc = new jsPDF();
        console.log('PDF document created successfully');
      } catch (createError) {
        console.error('Error creating PDF document:', createError);
        throw new Error('Failed to create PDF document: ' + (createError instanceof Error ? createError.message : 'Unknown error'));
      }
      
      // Set up fonts and colors
      try {
        doc.setFont('helvetica');
        console.log('Font set successfully');
      } catch (fontError) {
        console.error('Error setting font:', fontError);
        // Continue anyway, font setting is not critical
      }
      
      // Header section
      doc.setFontSize(24);
      doc.setTextColor(44, 62, 80);
      doc.text('INVOICE', 20, 30);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(invoice.invoiceNumber, 20, 40);
      
      // Company/From section (if user profile exists)
      let yPosition = 60;
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text('From:', 20, yPosition);
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text('Billzo', 20, yPosition + 10);
      doc.text('Professional Invoice Solutions', 20, yPosition + 20);
      
      // Client/Bill To section
      yPosition = 60;
      doc.setFontSize(14);
      doc.setTextColor(44, 62, 80);
      doc.text('Bill To:', 120, yPosition);
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(invoice.client.name, 120, yPosition + 10);
      doc.text(invoice.client.email, 120, yPosition + 20);
      
      // Split address into lines
      const addressLines = invoice.client.address.split('\n');
      addressLines.forEach((line, index) => {
        doc.text(line, 120, yPosition + 30 + (index * 10));
      });
      
      if (invoice.client.phone) {
        doc.text(invoice.client.phone, 120, yPosition + 30 + (addressLines.length * 10));
      }
      
      // Invoice details
      yPosition = 120;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Invoice Date:', 20, yPosition);
      doc.text('Due Date:', 20, yPosition + 10);
      doc.text('Invoice #:', 20, yPosition + 20);
      
      doc.setTextColor(80, 80, 80);
      doc.text(new Date(invoice.date).toLocaleDateString(), 70, yPosition);
      doc.text(new Date(invoice.dueDate).toLocaleDateString(), 70, yPosition + 10);
      doc.text(invoice.invoiceNumber, 70, yPosition + 20);
      
      // Status badge
      doc.setFillColor(this.getStatusColor(invoice.status));
      doc.roundedRect(120, yPosition - 5, 40, 15, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(invoice.status.toUpperCase(), 125, yPosition + 3);
      
      // Items table
      yPosition = 160;
      
      // Table header
      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPosition, 170, 15, 'F');
      
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 25, yPosition + 10);
      doc.text('Qty', 120, yPosition + 10);
      doc.text('Rate', 140, yPosition + 10);
      doc.text('Amount', 165, yPosition + 10);
      
      // Table rows
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      yPosition += 20;
      
      invoice.items.forEach((item, index) => {
        // Alternate row colors
        if (index % 2 === 0) {
          doc.setFillColor(252, 252, 252);
          doc.rect(20, yPosition - 5, 170, 15, 'F');
        }
        
        doc.text(item.description, 25, yPosition + 5);
        doc.text(item.quantity.toString(), 125, yPosition + 5);
        doc.text(formatPDFAmount(item.rate), 145, yPosition + 5);
        doc.text(formatPDFAmount(item.amount), 170, yPosition + 5);
        
        yPosition += 15;
      });
      
      // Totals section
      yPosition += 10;
      const totalsX = 120;
      
      doc.setTextColor(100, 100, 100);
      doc.text('Subtotal:', totalsX, yPosition);
      doc.text('Tax:', totalsX, yPosition + 10);
      
      doc.setTextColor(80, 80, 80);
      doc.text(formatPDFAmount(invoice.subtotal), 170, yPosition);
      doc.text(formatPDFAmount(invoice.tax), 170, yPosition + 10);
      
      // Total line
      doc.setLineWidth(0.5);
      doc.setDrawColor(200, 200, 200);
      doc.line(totalsX, yPosition + 15, 185, yPosition + 15);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text('Total:', totalsX, yPosition + 25);
      doc.text(formatPDFAmount(invoice.total), 170, yPosition + 25);
      
      // Notes section
      if (invoice.notes) {
        yPosition += 40;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(44, 62, 80);
        doc.text('Notes:', 20, yPosition);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        
        // Split notes into lines
        const noteLines = doc.splitTextToSize(invoice.notes, 170);
        noteLines.forEach((line: string, index: number) => {
          doc.text(line, 20, yPosition + 15 + (index * 5));
        });
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text('Thank you for your business!', 20, pageHeight - 30);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, pageHeight - 20);
      
      // Mode indicator
      const modeText = invoice.mode === 'ai' ? '🤖 AI Generated' : '✏️ Manual';
      doc.text(modeText, 120, pageHeight - 20);
      
      // Save the PDF
      const filename = `invoice-${invoice.invoiceNumber}.pdf`;
      console.log('Saving PDF as:', filename);
      doc.save(filename);
      console.log('PDF generated and downloaded successfully');
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      // Reset loading state on error
      this.loadingPromise = null;
      this.isJsPDFLoaded = false;
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private getStatusColor(status: string): [number, number, number] {
    switch (status) {
      case 'paid':
        return [34, 197, 94]; // green
      case 'sent':
        return [59, 130, 246]; // blue
      case 'overdue':
        return [239, 68, 68]; // red
      default:
        return [107, 114, 128]; // gray
    }
  }
  
  // Alternative: Generate PDF using HTML to Canvas approach
  async generatePDFFromHTML(invoiceElement: HTMLElement, filename: string): Promise<void> {
    try {
      // Load html2canvas and jsPDF
      await this.loadHTML2Canvas();
      await this.loadJsPDF();
      
      const html2canvas = (window as any).html2canvas;
      const jsPDF = (window as any).jsPDF;
      
      if (!html2canvas || !jsPDF) {
        throw new Error('PDF libraries not loaded');
      }
      
      // Convert HTML element to canvas
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(filename);
      
    } catch (error) {
      console.error('HTML to PDF conversion failed:', error);
      throw new Error('Failed to generate PDF from HTML. Please try again.');
    }
  }
  
  private async loadHTML2Canvas(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('HTML2Canvas is only available in the browser');
    }
    
    if ((window as any).html2canvas) {
      return Promise.resolve();
    }
    
    return new Promise<void>((resolve, reject) => {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="html2canvas"]');
      if (existingScript) {
        const checkLibrary = () => {
          if ((window as any).html2canvas) {
            resolve();
          } else {
            setTimeout(checkLibrary, 100);
          }
        };
        checkLibrary();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        const checkInitialization = () => {
          if ((window as any).html2canvas) {
            resolve();
          } else {
            setTimeout(checkInitialization, 50);
          }
        };
        checkInitialization();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load html2canvas library from CDN'));
      };
      
      document.head.appendChild(script);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!(window as any).html2canvas) {
          reject(new Error('html2canvas library loading timeout'));
        }
      }, 10000);
    });
  }
}

export const pdfGenerator = new PDFGenerator();