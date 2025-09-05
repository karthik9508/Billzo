# AI Invoice Maker - Setup Instructions

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Copy the API key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Important:** Replace `your_openai_api_key_here` with your actual OpenAI API key.

### 4. Start the Development Server
```bash
npm run dev
```

### 5. Access the Application
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤖 Using the AI Invoice Generator

### How to Create AI-Powered Invoices

1. Navigate to **Create Invoice** → **AI-Powered**
2. Enter a natural language description of your invoice requirements
3. Click **Generate Invoice with AI**
4. Review and edit the generated invoice as needed

### Example Prompts

**Web Development Services:**
```
Create an invoice for ABC Company at 123 Main St, New York. 
I provided web development services: homepage design ($2,000), 
contact form setup ($500), and mobile optimization ($800).
```

**Consulting Work:**
```
Invoice for consulting work with John Smith at Tech Solutions Inc, 
456 Oak Ave, Los Angeles. 15 hours of business strategy at $150/hour 
plus a market analysis report for $750. Due in 30 days.
```

**Design Services:**
```
Bill Sarah Johnson at Creative Agency, 789 Pine St, Chicago 
for graphic design services: logo design ($1,200), 
brochure design ($800), and social media graphics ($600).
```

## 💡 Tips for Better AI Results

1. **Be Specific:** Include client name, address, and contact details
2. **List Services:** Clearly describe what work was done
3. **Include Pricing:** Specify costs for each item or hourly rates
4. **Add Terms:** Mention payment terms, due dates, or special conditions
5. **Use Natural Language:** Write as you would explain the invoice to someone

## 🛠️ Technical Details

### Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS with dark mode support
- **AI:** OpenAI GPT-3.5-turbo
- **Storage:** Local Storage (client-side)

### Project Structure
```
src/
├── app/
│   ├── api/generate-invoice/    # OpenAI API integration
│   ├── dashboard/               # Dashboard with stats
│   ├── invoices/               # Invoice management
│   │   ├── new/ai/            # AI-powered creation
│   │   ├── new/manual/        # Manual creation
│   │   └── [id]/              # Invoice details & edit
├── components/                  # Reusable components
├── lib/                        # Utility functions
└── types/                      # TypeScript interfaces
```

## 🔧 Troubleshooting

### Common Issues

**"OpenAI API key is not configured"**
- Make sure `.env.local` exists in the root directory
- Verify your API key is correctly set
- Restart the development server after adding the API key

**"Failed to generate invoice"**
- Check your OpenAI account has sufficient credits
- Verify your API key is valid and active
- Try simplifying your prompt if it's too complex

**Invoice not generating properly**
- Ensure your prompt includes client and service details
- Check the browser console for error messages
- Try using one of the example prompts first

### Getting Help
- Check your OpenAI account usage and billing
- Verify the API key has the correct permissions
- Make sure you're using a valid OpenAI API key (not an organization key)

## 🌟 Features

- ✅ **AI-Powered Generation:** Natural language to invoice conversion
- ✅ **Manual Mode:** Traditional form-based invoice creation
- ✅ **Dark Mode Support:** Automatic theme switching
- ✅ **Professional Design:** Print-ready invoice layouts
- ✅ **Client Management:** Store and reuse client information
- ✅ **Status Tracking:** Draft, sent, paid, overdue statuses
- ✅ **Local Storage:** No backend required for basic usage
- ✅ **Responsive Design:** Works on desktop and mobile devices

Enjoy creating professional invoices with the power of AI! 🚀