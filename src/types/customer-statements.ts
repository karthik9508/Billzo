export interface Customer {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  invoiceId?: string;
  customerId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'card' | 'other';
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerStatement {
  id: string;
  userId: string;
  customerId: string;
  statementNumber: string;
  fromDate: string;
  toDate: string;
  totalSales: number;
  totalPayments: number;
  outstandingBalance: number;
  status: 'draft' | 'sent';
  sentVia?: 'email' | 'whatsapp' | 'manual';
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Joined data
  customer?: Customer;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    total: number;
    status: string;
  }>;
  payments?: Payment[];
}

export interface CustomerStatementSummary {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  totalSales: number;
  totalPayments: number;
  outstandingBalance: number;
  invoiceCount: number;
  paymentCount: number;
}

export interface WhatsAppMessage {
  to: string;
  message: string;
  attachment?: {
    filename: string;
    content: string; // base64 encoded
    mimetype: string;
  };
}

export interface StatementFilters {
  customerId?: string;
  customerEmail?: string;
  fromDate?: string;
  toDate?: string;
  status?: 'draft' | 'sent';
}