export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  client: {
    name: string;
    email: string;
    address: string;
    phone?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  mode: 'ai' | 'manual';
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface DashboardStats {
  totalInvoices: number;
  pendingAmount: number;
  paidAmount: number;
  overdueInvoices: number;
}