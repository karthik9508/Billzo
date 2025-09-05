import { NextRequest, NextResponse } from 'next/server';
import { generateInvoiceFromPrompt } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid prompt is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const invoiceData = await generateInvoiceFromPrompt(prompt);

    return NextResponse.json({
      success: true,
      data: invoiceData
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate invoice',
        details: 'Please check your OpenAI API key and try again.'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Invoice generation endpoint. Use POST with a prompt.' },
    { status: 200 }
  );
}