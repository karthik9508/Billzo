import { NextRequest, NextResponse } from 'next/server'
import { customerStatementsService } from '@/lib/supabase/services/customer-statements'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { action, sentVia } = body
    const { id } = await params

    if (action === 'mark_sent') {
      if (!sentVia || !['email', 'whatsapp', 'manual'].includes(sentVia)) {
        return NextResponse.json(
          { error: 'Valid sentVia is required for mark_sent action' },
          { status: 400 }
        )
      }

      await customerStatementsService.markStatementAsSent(id, sentVia)
      
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating customer statement:', error)
    return NextResponse.json(
      { error: 'Failed to update customer statement' },
      { status: 500 }
    )
  }
}