# AI City Research Agent

**Multi-Step Enrichment Engine for City Data Intelligence**

---

## Overview

AI City Research Agent is a powerful, privacy-first research platform that enables multi-step data enrichment for city intelligence gathering. Built on a **Bring Your Own Key (BYOK)** model, it puts you in complete control of your API usage and costs while providing enterprise-grade research capabilities.

### What It Does

Transform basic city names into comprehensive intelligence reports by orchestrating multiple AI models and data sources to gather, analyze, and enrich location data with custom criteria.

---

## Unique Selling Points

### 1. **BYOK Model - True Privacy & Control**
- No vendor lock-in - use your own OpenAI, Anthropic, or other AI provider keys
- Complete control over API costs and usage
- Your data never touches third-party servers beyond your chosen providers
- Transparent billing through your own API accounts

### 2. **Intelligent Fallback System**
- Primary + Fallback model architecture ensures high availability
- Automatic failover when primary model is unavailable or rate-limited
- Supports mixing different providers (e.g., OpenAI primary, Anthropic fallback)
- Never lose research progress due to API failures

### 3. **MongoDB Schema Detection**
- Connect directly to your MongoDB databases
- Automatically detect and merge unique fields across multiple collections
- Instantly convert database schemas into research criteria
- Perfect for enriching existing datasets with missing fields

### 4. **Multi-Step Enrichment Pipeline**
- Define custom research criteria with detailed descriptions
- Chain multiple data enrichment steps automatically
- Built-in Tavily search integration for web research
- JSON-structured output for easy integration

### 5. **Resource Injection**
- Add custom documents, PDFs, or text snippets
- Inject domain-specific knowledge into research workflows
- Guide AI responses with proprietary information
- Perfect for specialized industry research

---

## Key Features

### Research Panel
- Single-city or batch city research
- Real-time activity logs with detailed step tracking
- Downloadable JSON reports
- Interactive report preview with syntax highlighting
- Progress indicators for long-running operations

### Custom Criteria Builder
- Visual field definition interface
- Drag-and-drop field ordering
- Field descriptions for precise AI instructions
- Template library for common use cases
- Export/import criteria sets

### MongoDB Integration
- Secure connection string management
- Multi-collection document fetching
- Automatic field detection and deduplication
- One-click "Add to Search Criteria" functionality
- Support for complex nested schemas

### Model Settings
- Support for 20+ AI models (GPT-4, Claude, Gemini, etc.)
- Per-model parameter tuning (temperature, max tokens)
- Token usage tracking and cost estimation
- Model performance comparison

### Analytics & Logs
- Real-time request monitoring
- Token usage analytics with cost breakdowns
- Success/failure rate tracking
- Response time metrics
- Export logs for auditing

### Documentation Hub
- Interactive API documentation
- Usage examples and code snippets
- Best practices and optimization guides
- Troubleshooting tutorials

---

## Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript 5** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling with custom design tokens
- **shadcn/ui** - High-quality React components
- **Lucide Icons** - Beautiful, consistent iconography

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database for flexible data storage
- **Vercel AI SDK** - Unified AI model integration
- **Tavily API** - Web search and research capabilities

### Key Libraries
- **Recharts** - Data visualization and analytics
- **SWR** - Client-side data fetching and caching
- **React Hook Form** - Performant form handling

---

## Getting Started

### Prerequisites

\`\`\`bash
Node.js 18+ and npm/yarn/pnpm
\`\`\`

### Installation

1. **Clone the repository**
\`\`\`bash
git clone https://github.com/priyansh56701-gmailcoms-projects/AI-Research-Agent.git
cd AI-Research-Agent
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

3. **Set up environment variables**
   Create a `.env.local` file in the root directory and add the following keys:
   ```bash
   MONGODB_URI="your_mongodb_connection_string"
   AUTH_SECRET="your_nextauth_secret" # Generate using `openssl rand -base64 32`
   NEXTAUTH_URL="http://localhost:3000"
   AUTH_GOOGLE_ID="your_google_client_id"
   AUTH_GOOGLE_SECRET="your_google_client_secret"
   ```

4. **Run Development Server**
   You need two terminals running simultaneously:

   **Terminal 1 (Next.js App)**:
   ```bash
   npm run dev
   ```

   **Terminal 2 (Inngest Dev Server)**:
   ```bash
   npx inngest-cli@latest dev
   ```

5. **Open the App**
   Visit [http://localhost:3000](http://localhost:3000)

## Key Features
*   **Deep Research**: Automates multi-step research on any topic.
*   **Vector Store**: Embed and store knowledge for RAG applications.
*   **Human-in-the-Loop**: "Extended Research" allows manual selection of sources.
*   **Analytics**: View detailed usage stats.

### Advanced: MongoDB Integration

1. **Connect to MongoDB** (MongoDB Tab)
   - Enter your MongoDB connection string
   - Click "Connect to MongoDB"
   - Select one or more collections
   - Click "Fetch Documents"

2. **Auto-Generate Criteria**
   - Review merged unique fields from all collections
   - Click "Add to Search Criteria"
   - Fields are automatically added to Criteria Builder

3. **Enrich Existing Data**
   - Use the generated criteria to research cities
   - Match the JSON output structure to your database schema
   - Bulk import enriched data back to MongoDB

---

## Architecture

### Design Philosophy

**Clean, Minimal, Professional** - Inspired by Apple's design language with rounded cards, subtle shadows, generous whitespace, and a neutral color palette with blue accents.

**Mobile-First Responsive** - Collapsible sidebar, horizontal scrolling tabs, touch-friendly buttons, and optimized spacing for phones and tablets.

**Dark Mode Native** - Custom scrollbars, high-contrast text, themed borders, and proper color tokens for comfortable night usage.

### Data Flow

\`\`\`
User Input → API Key Validation → Criteria Loading → Research Execution
                                                              ↓
                                    Activity Logging ← AI Model Call
                                                              ↓
                                    Fallback Trigger? ← Error Handling
                                                              ↓
                                    JSON Report ← Data Aggregation
\`\`\`

### File Structure

\`\`\`
ai-research-agent/
├── app/
│   ├── api/                    # API routes
│   │   ├── research/          # Research execution
│   │   ├── enrich/            # Data enrichment
│   │   └── mongodb/           # MongoDB operations
│   ├── auth/                  # Authentication pages
│   ├── dashboard/             # Main dashboard
│   ├── page.tsx               # Landing page
│   └── layout.tsx             # Root layout
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── research-panel.tsx     # Research interface
│   ├── criteria-builder.tsx   # Field definitions
│   ├── mongodb-integration.tsx # Database connection
│   ├── model-settings.tsx     # AI model config
│   ├── analytics-logs.tsx     # Monitoring dashboard
│   └── documentation.tsx      # Help docs
├── lib/
│   ├── utils.ts               # Utility functions
│   └── toast.ts               # Toast notifications
└── public/                    # Static assets
\`\`\`

---

## API Reference

### POST `/api/research`

Run city research with custom criteria.

**Request:**
\`\`\`json
{
  "cityName": "San Francisco",
  "criteria": [
    {
      "id": "1",
      "name": "Population",
      "description": "Current estimated population"
    }
  ],
  "primaryApiKey": "sk-...",
  "fallbackApiKey": "sk-...",
  "tavilyApiKey": "tvly-..."
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "city": "San Francisco",
    "Population": "874,784",
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
\`\`\`

### POST `/api/mongodb/connect`

Test MongoDB connection.

**Request:**
\`\`\`json
{
  "connectionString": "mongodb+srv://..."
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "databases": ["mydb"],
  "collections": ["cities", "users"]
}
\`\`\`

---

## Roadmap

- [ ] **Batch Processing** - Upload CSV files for bulk city research
- [ ] **Scheduling** - Cron jobs for periodic data updates
- [ ] **Webhooks** - Real-time notifications for completed research
- [ ] **Team Collaboration** - Share criteria templates and reports
- [ ] **Advanced Analytics** - ML-powered insights on research data
- [ ] **API Rate Limiting** - Built-in rate limit management
- [ ] **Export Formats** - CSV, Excel, PDF report generation
- [ ] **Custom Integrations** - Zapier, Make, n8n connectors

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- **Documentation**: Built-in docs in the app
- **Issues**: [GitHub Issues](https://github.com/priyansh56701-gmailcoms-projects/AI-Research-Agent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/priyansh56701-gmailcoms-projects/AI-Research-Agent/discussions)

---

## Acknowledgments

Built with [v0.app](https://v0.app) - AI-powered UI generation
Powered by [Vercel](https://vercel.com) - Deployment platform
UI components by [shadcn/ui](https://ui.shadcn.com)

---

**Built with ❤️ for researchers, data scientists, and city intelligence professionals**
