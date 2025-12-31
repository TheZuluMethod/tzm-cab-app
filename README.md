# The Zulu Method Customer Advisory Board

Instantly deploy 20 AI personas modeled on your core ICP to test ideas, products, messaging, positioning, branding, pricing, or anything else. Get deep input and feedback as if you were meeting with a trusted cohort of your actual target and existing customers.

## Features

- Generate 20 diverse board member personas based on your ICP
- Stream real-time analysis from your virtual advisory board
- Upload supporting documents for context
- Export reports as PDF or HTML
- Save and load previous board sessions
- Swap individual board members for better representation
- Dark mode support
- Analytics dashboard for app owners
- Competitor analysis capabilities
- Industry research and visualizations

## Prerequisites

- Node.js 18 or higher
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
- Supabase account (for database and storage)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your API keys in environment variables (create a `.env` file):
   ```bash
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173)

## Build for Production

```bash
npm run build
npm run preview
```

## Tech Stack

- React 19 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Google Gemini AI for persona generation and analysis
- Supabase for database and storage
- React Markdown for report rendering
- Recharts for analytics visualizations

## Documentation

See the various `.md` files in the root directory for detailed setup instructions:
- `SUPABASE_SETUP.md` - Database setup
- `API_KEY_SETUP.md` - API key configuration
- `BACKUP_INSTRUCTIONS.md` - Git backup guide
