'use client';

import { useState, useEffect, useCallback } from 'react'
import { Invoice, DashboardStats } from '@/types/invoice'
import { invoiceService } from '@/lib/supabase/services/invoice'
import { useAuth } from '@/contexts/AuthContext'

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const loadInvoices = useCallback(async () => {
    if (!user) {
      setInvoices([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await invoiceService.getAllInvoices()
      setInvoices(data)
    } catch (err) {
      console.error('Error loading invoices:', err)
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  // Disabled real-time subscription for better performance
  // Re-enable this if real-time updates are critical
  // useEffect(() => {
  //   if (!user) return

  //   const subscription = invoiceService.subscribeToInvoiceChanges(() => {
  //     // Reload invoices when changes occur
  //     loadInvoices()
  //   })

  //   return () => {
  //     subscription.unsubscribe()
  //   }
  // }, [user, loadInvoices])

  const saveInvoice = async (invoice: Invoice) => {
    try {
      setError(null)
      const savedInvoice = await invoiceService.saveInvoice(invoice)
      
      // Update local state optimistically
      setInvoices(prev => {
        const index = prev.findIndex(inv => inv.id === savedInvoice.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = savedInvoice
          return updated
        } else {
          return [savedInvoice, ...prev]
        }
      })
      
      return savedInvoice
    } catch (err) {
      console.error('Error saving invoice:', err)
      setError('Failed to save invoice')
      throw err
    }
  }

  const deleteInvoice = async (id: string) => {
    try {
      setError(null)
      await invoiceService.deleteInvoice(id)
      
      // Update local state optimistically
      setInvoices(prev => prev.filter(inv => inv.id !== id))
    } catch (err) {
      console.error('Error deleting invoice:', err)
      setError('Failed to delete invoice')
      throw err
    }
  }

  const getInvoiceById = (id: string): Invoice | undefined => {
    return invoices.find(inv => inv.id === id)
  }

  return {
    invoices,
    loading,
    error,
    saveInvoice,
    deleteInvoice,
    getInvoiceById,
    refresh: loadInvoices,
  }
}

export function useInvoice(id: string) {
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const loadInvoice = async () => {
      if (!user || !id) {
        setInvoice(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await invoiceService.getInvoiceById(id)
        setInvoice(data)
      } catch (err) {
        console.error('Error loading invoice:', err)
        setError('Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }

    loadInvoice()
  }, [id, user])

  return { invoice, loading, error }
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueInvoices: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const loadStats = useCallback(async () => {
    if (!user) {
      setStats({
        totalInvoices: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueInvoices: 0,
      })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await invoiceService.getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('Error loading dashboard stats:', err)
      setError('Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return { stats, loading, error, refresh: loadStats }
}

// Combined hook for dashboard - single API call instead of two
export function useDashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueInvoices: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setInvoices([])
      setStats({
        totalInvoices: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueInvoices: 0,
      })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const { invoices: dashboardInvoices, stats: dashboardStats } = await invoiceService.getDashboardData()
      setInvoices(dashboardInvoices)
      setStats(dashboardStats)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return { 
    invoices: invoices.slice(0, 5), // Only recent invoices for dashboard
    allInvoices: invoices, 
    stats, 
    loading, 
    error, 
    refresh: loadDashboard 
  }
}