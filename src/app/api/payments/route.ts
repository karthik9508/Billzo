import { NextRequest, NextResponse } from 'next/server'
import { customerStatementsService } from '@/lib/supabase/services/customer-statements'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const payments = await customerStatementsService.getCustomerPayments(customerId)
    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      customerId, 
      invoiceId, 
      amount, 
      paymentDate, 
      paymentMethod, 
      referenceNumber, 
      notes 
    } = body

    if (!customerId || !amount || !paymentDate || !paymentMethod) {
      return NextResponse.json(
        { error: 'Customer ID, amount, payment date, and payment method are required' },
        { status: 400 }
      )
    }

    const payment = await customerStatementsService.addPayment({
      customerId,
      invoiceId,
      amount: Number(amount),
      paymentDate,
      paymentMethod,
      referenceNumber,
      notes
    })

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error adding payment:', error)
    return NextResponse.json(
      { error: 'Failed to add payment' },
      { status: 500 }
    )
  }
}