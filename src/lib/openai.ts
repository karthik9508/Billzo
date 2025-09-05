import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface InvoiceGenerationData {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientPhone?: string;
  dueDate: string;
  items: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
}

export async function generateInvoiceFromPrompt(prompt: string): Promise<InvoiceGenerationData> {
  // Check if OpenAI is available
  if (!openai) {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables to use AI invoice generation.');
  }

  try {
    const systemPrompt = `You are an AI assistant that generates invoice data from user prompts. 
    
    Parse the user's request and extract invoice information. If information is missing, make reasonable business assumptions.
    
    Respond with a JSON object in this exact format:
    {
      "clientName": "string",
      "clientEmail": "string (generate if not provided)",
      "clientAddress": "string",
      "clientPhone": "string (optional)",
      "dueDate": "YYYY-MM-DD (30 days from today if not specified)",
      "items": [
        {
          "description": "string",
          "quantity": number,
          "rate": number,
          "amount": number (quantity * rate)
        }
      ],
      "subtotal": number,
      "tax": number (10% of subtotal),
      "total": number (subtotal + tax),
      "notes": "string (payment terms, thank you message, etc.)"
    }
    
    Guidelines:
    - If client info is missing, create professional placeholders
    - Generate realistic pricing for services/products mentioned
    - Include standard business terms in notes
    - Ensure all calculations are correct
    - Use today's date + 30 days for due date if not specified`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let invoiceData: InvoiceGenerationData;
    try {
      invoiceData = JSON.parse(response);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        invoiceData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from OpenAI');
      }
    }

    // Validate required fields
    if (!invoiceData.clientName || !invoiceData.items || invoiceData.items.length === 0) {
      throw new Error('Incomplete invoice data generated');
    }

    // Ensure calculations are correct
    invoiceData.subtotal = invoiceData.items.reduce((sum, item) => {
      item.amount = item.quantity * item.rate;
      return sum + item.amount;
    }, 0);
    
    invoiceData.tax = invoiceData.subtotal * 0.1;
    invoiceData.total = invoiceData.subtotal + invoiceData.tax;

    return invoiceData;
    
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Failed to generate invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export default openai;