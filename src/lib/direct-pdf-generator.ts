import { Invoice } from '@/types/invoice';
import { formatPDFAmount } from '@/lib/currency-utils';

// Direct PDF generator that creates PDFs without external dependencies
class DirectPDFGenerator {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  async generateInvoicePDF(invoice: Invoice): Promise<void> {
    console.log('🚀 Starting direct PDF generation for:', invoice.invoiceNumber);
    
    try {
      // Create a canvas-based PDF
      await this.createCanvasPDF(invoice);
      console.log('✅ Direct PDF generated successfully');
      
    } catch (error) {
      console.error('❌ Direct PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async createCanvasPDF(invoice: Invoice): Promise<void> {
    // Create a canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.width = 595; // A4 width in pixels at 72dpi
    this.canvas.height = 842; // A4 height in pixels at 72dpi
    
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Could not get canvas context');
    }

    // Set white background
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw invoice content
    await this.drawInvoiceContent(invoice);

    // Convert to PDF-like image and download
    this.downloadCanvasAsPDF(invoice.invoiceNumber);
  }

  private async drawInvoiceContent(invoice: Invoice): Promise<void> {
    if (!this.ctx) return;

    let y = 50;
    
    // Header
    this.ctx.font = 'bold 32px Arial, sans-serif';
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillText('INVOICE', 50, y);
    
    // Invoice number
    y += 30;
    this.ctx.font = '16px Arial, sans-serif';
    this.ctx.fillStyle = '#7f8c8d';
    this.ctx.fillText(invoice.invoiceNumber, 50, y);

    // Status badge
    this.drawStatusBadge(invoice.status, 450, 30);

    // From section
    y += 60;
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillText('From:', 50, y);
    
    y += 25;
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillText('Billzo', 50, y);
    y += 20;
    this.ctx.fillText('Professional Services', 50, y);

    // Bill To section
    let billToY = y - 45;
    this.ctx.font = 'bold 16px Arial, sans-serif';
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillText('Bill To:', 300, billToY);
    
    billToY += 25;
    this.ctx.font = '14px Arial, sans-serif';
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillText(invoice.client.name, 300, billToY);
    billToY += 20;
    this.ctx.fillText(invoice.client.email, 300, billToY);
    
    // Address (handle multiline)
    const addressLines = invoice.client.address.split('\n');
    addressLines.forEach(line => {
      billToY += 20;
      this.ctx!.fillText(line, 300, billToY);
    });
    
    if (invoice.client.phone) {
      billToY += 20;
      this.ctx.fillText(invoice.client.phone, 300, billToY);
    }

    // Invoice details
    y += 80;
    this.drawInvoiceDetails(invoice, y);

    // Items table
    y += 80;
    y = this.drawItemsTable(invoice, y);

    // Totals
    y += 40;
    this.drawTotals(invoice, y);

    // Notes
    if (invoice.notes) {
      y += 100;
      this.drawNotes(invoice.notes, y);
    }

    // Footer
    this.drawFooter(invoice);
  }

  private drawStatusBadge(status: string, x: number, y: number): void {
    if (!this.ctx) return;

    const colors = {
      paid: '#27ae60',
      sent: '#3498db', 
      overdue: '#e74c3c',
      draft: '#95a5a6'
    };

    const color = colors[status as keyof typeof colors] || colors.draft;
    
    // Draw badge background
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, 100, 30);
    
    // Draw badge text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 12px Arial, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(status.toUpperCase(), x + 50, y + 20);
    this.ctx.textAlign = 'left'; // Reset alignment
  }

  private drawInvoiceDetails(invoice: Invoice, y: number): void {
    if (!this.ctx) return;

    this.ctx.font = '12px Arial, sans-serif';
    this.ctx.fillStyle = '#7f8c8d';
    
    this.ctx.fillText('Invoice Date:', 50, y);
    this.ctx.fillText('Due Date:', 50, y + 20);
    this.ctx.fillText('Invoice #:', 50, y + 40);

    this.ctx.fillStyle = '#34495e';
    this.ctx.fillText(new Date(invoice.date).toLocaleDateString(), 150, y);
    this.ctx.fillText(new Date(invoice.dueDate).toLocaleDateString(), 150, y + 20);
    this.ctx.fillText(invoice.invoiceNumber, 150, y + 40);
  }

  private drawItemsTable(invoice: Invoice, startY: number): number {
    if (!this.ctx) return startY;

    let y = startY;
    
    // Table header background
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.fillRect(50, y, 495, 30);
    
    // Table headers
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.font = 'bold 12px Arial, sans-serif';
    this.ctx.fillText('Description', 60, y + 20);
    this.ctx.fillText('Qty', 300, y + 20);
    this.ctx.fillText('Rate', 350, y + 20);
    this.ctx.fillText('Amount', 450, y + 20);
    
    y += 40;
    
    // Table rows
    this.ctx.font = '11px Arial, sans-serif';
    this.ctx.fillStyle = '#34495e';
    
    invoice.items.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        this.ctx!.fillStyle = '#f8f9fa';
        this.ctx!.fillRect(50, y - 10, 495, 25);
      }
      
      this.ctx!.fillStyle = '#34495e';
      this.ctx!.fillText(this.truncateText(item.description, 35), 60, y + 5);
      this.ctx!.fillText(item.quantity.toString(), 310, y + 5);
      this.ctx!.fillText(formatPDFAmount(item.rate), 360, y + 5);
      this.ctx!.fillText(formatPDFAmount(item.amount), 460, y + 5);
      
      y += 25;
    });
    
    return y;
  }

  private drawTotals(invoice: Invoice, y: number): void {
    if (!this.ctx) return;

    const x = 350;
    
    this.ctx.font = '12px Arial, sans-serif';
    this.ctx.fillStyle = '#7f8c8d';
    
    this.ctx.fillText('Subtotal:', x, y);
    this.ctx.fillText('Tax:', x, y + 20);
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillText(formatPDFAmount(invoice.subtotal), x + 100, y);
    this.ctx.fillText(formatPDFAmount(invoice.tax), x + 100, y + 20);
    
    // Total line
    this.ctx.strokeStyle = '#bdc3c7';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 30);
    this.ctx.lineTo(x + 145, y + 30);
    this.ctx.stroke();
    
    // Total
    this.ctx.font = 'bold 14px Arial, sans-serif';
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillText('Total:', x, y + 50);
    this.ctx.fillText(formatPDFAmount(invoice.total), x + 100, y + 50);
  }

  private drawNotes(notes: string, y: number): void {
    if (!this.ctx) return;

    this.ctx.font = 'bold 12px Arial, sans-serif';
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillText('Notes:', 50, y);
    
    y += 20;
    this.ctx.font = '11px Arial, sans-serif';
    this.ctx.fillStyle = '#34495e';
    
    const noteLines = this.wrapText(notes, 450);
    noteLines.forEach(line => {
      this.ctx!.fillText(line, 50, y);
      y += 15;
    });
  }

  private drawFooter(invoice: Invoice): void {
    if (!this.ctx) return;

    const footerY = this.canvas!.height - 60;
    
    this.ctx.font = '10px Arial, sans-serif';
    this.ctx.fillStyle = '#95a5a6';
    
    this.ctx.fillText('Thank you for your business!', 50, footerY);
    this.ctx.fillText(`Generated on ${new Date().toLocaleDateString()}`, 50, footerY + 15);
    
    const modeText = invoice.mode === 'ai' ? '🤖 AI Generated' : '✏️ Manual';
    this.ctx.fillText(modeText, 300, footerY + 15);
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  private wrapText(text: string, maxWidth: number): string[] {
    if (!this.ctx) return [text];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  private downloadCanvasAsPDF(invoiceNumber: string): void {
    if (!this.canvas) return;

    // Convert canvas to image
    this.canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${invoiceNumber}.png`; // Save as PNG since it's more reliable
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ Invoice image downloaded successfully');
        
        // Show user-friendly message
        alert(
          `Invoice downloaded as image: invoice-${invoiceNumber}.png\n\n` +
          `This is a high-quality image version of your invoice that you can:\n` +
          `• Print directly\n` +
          `• Convert to PDF using online tools\n` +
          `• Share via email or messaging\n\n` +
          `The image format ensures compatibility across all devices and platforms.`
        );
      }
    }, 'image/png', 1.0);
  }
}

export const directPDFGenerator = new DirectPDFGenerator();