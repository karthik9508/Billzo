import { Invoice } from '@/types/invoice';

const STORAGE_KEY = 'invoices';

export const invoiceStorage = {
  getAll: (): Invoice[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  save: (invoice: Invoice): void => {
    if (typeof window === 'undefined') return;
    const invoices = invoiceStorage.getAll();
    const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
    
    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.push(invoice);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  },

  delete: (id: string): void => {
    if (typeof window === 'undefined') return;
    const invoices = invoiceStorage.getAll().filter(inv => inv.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  },

  getById: (id: string): Invoice | null => {
    return invoiceStorage.getAll().find(inv => inv.id === id) || null;
  }
};