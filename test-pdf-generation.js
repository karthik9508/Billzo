// Simple test to check if PDF generation works
// This simulates the invoice generation in a browser environment

const testInvoice = {
  id: 'test-1',
  invoiceNumber: 'INV-001',
  date: '2024-01-01',
  dueDate: '2024-01-31',
  status: 'draft',
  mode: 'manual',
  client: {
    name: 'Test Client',
    email: 'test@example.com',
    address: '123 Test Street\nTest City, TC 12345',
    phone: '+1-234-567-8900'
  },
  items: [
    {
      id: '1',
      description: 'Test Service',
      quantity: 1,
      rate: 100.00,
      amount: 100.00
    }
  ],
  subtotal: 100.00,
  tax: 10.00,
  total: 110.00,
  notes: 'Test invoice for PDF generation'
};

console.log('Test invoice created:', JSON.stringify(testInvoice, null, 2));
console.log('To test PDF generation, open the browser and use this invoice object with the pdfGenerator.generateInvoicePDF() method');