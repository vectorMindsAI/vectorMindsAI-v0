# 🚀 Inngest Setup Guide for AI Research Agent

## What is Inngest?

Inngest is a background job and workflow orchestration platform used in this project to handle:
- **Research Workflows** - Complex multi-step research operations
- **Extended Research** - Deep dive research sessions
- **Vector Embeddings** - Processing and storing embeddings
- **Agent Execution** - Running AI agent plans

## Quick Setup

### 1. Sign Up for Inngest

Visit [https://www.inngest.com/](https://www.inngest.com/) and create a free account.

### 2. Create an App

1. Click "Create App" in the Inngest dashboard
2. Name it "AI Research Agent" or similar
3. Copy your credentials:
   - **Event Key** - Used to send events to Inngest
   - **Signing Key** - Used to verify webhook signatures

### 3. Add to Environment Variables

Add these to your `.env.local` file:

```bash
INNGEST_EVENT_KEY=your-event-key-here
INNGEST_SIGNING_KEY=your-signing-key-here
INNGEST_DEV=false  # true for development
```

## Development vs Production

### Development Mode (Recommended for Local Work)

Use the **Inngest Dev Server** for local development:

```bash
# Install Inngest CLI
npm install -g inngest-cli

# Start dev server
npx inngest-cli@latest dev
```

**Benefits:**
- ✅ No cloud connection needed
- ✅ Real-time debugging dashboard at `http://localhost:8288`
- ✅ See function execution in real-time
- ✅ Replay failed jobs
- ✅ Test without deployment

**Environment Setup:**
```bash
INNGEST_DEV=true
INNGEST_EVENT_KEY=test  # Can be any value in dev mode
INNGEST_SIGNING_KEY=test  # Can be any value in dev mode
```

**Usage:**
```bash
# Terminal 1: Start Inngest Dev Server
npx inngest-cli@latest dev

# Terminal 2: Start your app
npm run dev
# OR with Docker
docker-compose --profile dev up -d

# Terminal 3: Access dev dashboard
# Open http://localhost:8288 in browser
```

### Production Mode

Use **Inngest Cloud** for production deployments:

**Environment Setup:**
```bash
INNGEST_DEV=false
INNGEST_EVENT_KEY=evt_your_real_event_key
INNGEST_SIGNING_KEY=signkey_your_real_signing_key
```

**Deployment Steps:**
1. Deploy your app to production
2. Ensure `/api/inngest` endpoint is publicly accessible
3. Inngest will automatically discover your functions
4. Monitor execution in Inngest Cloud dashboard

## Registered Functions

This project registers 4 Inngest functions:

### 1. Research Flow (`research-flow`)
- **Trigger:** `research/start` event
- **Purpose:** Main research workflow
- **Cancelable:** Yes, via `research/cancel` event
- **What it does:**
  - Enhances search prompt
  - Executes web searches
  - Reviews and filters results
  - Stores findings

### 2. Extended Research Flow (`extended-research-flow`)
- **Trigger:** `research/extended` event
- **Purpose:** Deep dive research sessions
- **What it does:**
  - Multi-iteration research
  - Comprehensive source gathering
  - In-depth analysis

### 3. Process Embeddings (`process-embeddings`)
- **Trigger:** `embeddings/process` event
- **Purpose:** Vector embedding processing
- **What it does:**
  - Generates text embeddings
  - Stores in vector database
  - Enables semantic search

### 4. Agent Plan Executor (`agent-plan-executor`)
- **Trigger:** `agent/execute` event
- **Purpose:** Execute AI agent plans
- **What it does:**
  - Runs multi-step agent workflows
  - Coordinates between planner and researcher
  - Aggregates results

## Verifying Installation

### Check Function Registration

**In Development:**
```bash
# Start Inngest Dev Server
npx inngest-cli@latest dev

# Start your app
npm run dev

# Open http://localhost:8288
# You should see 4 functions listed
```

**In Production:**
```bash
# Check Inngest Cloud dashboard
# Navigate to: https://app.inngest.com/
# Go to: Apps > Your App > Functions
# Verify all 4 functions are registered
```

### Test a Research Job

```typescript
// In your app or API route
const response = await fetch('/api/research', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keywords: 'test search',
    criteria: ['test criteria'],
    apiKeys: {
      groq: 'your-groq-key',
      tavily: 'your-tavily-key'
    }
  })
});
```

**Check Execution:**
- **Dev:** Watch in dev server dashboard (`http://localhost:8288`)
- **Prod:** Check Inngest Cloud dashboard

## Troubleshooting

### Functions Not Appearing

```bash
# 1. Check environment variables
echo $INNGEST_EVENT_KEY
echo $INNGEST_SIGNING_KEY

# 2. Verify endpoint is accessible
curl http://localhost:3000/api/inngest

# 3. Check app logs
npm run dev
# Look for: "Inngest functions registered"

# 4. Restart Inngest Dev Server
npx inngest-cli@latest dev
```

### Jobs Not Executing

**Check Event is Being Sent:**
```typescript
// In your code, verify event is triggered
import { inngest } from '@/lib/inngest/client';

await inngest.send({
  name: 'research/start',
  data: { jobId, keywords, criteria }
});
```

**Check Dev Server:**
- Open `http://localhost:8288`
- Go to "Events" tab
- Verify event was received

**Check Function Logs:**
- Click on function in dev server
- View execution logs
- Look for errors

### Connection Issues

**Dev Mode:**
```bash
# Ensure dev server is running
npx inngest-cli@latest dev

# Check it's listening on port 8288
curl http://localhost:8288
```

**Production:**
```bash
# Ensure webhook endpoint is public
curl https://your-domain.com/api/inngest

# Check Inngest Cloud logs for webhook failures
```

## Common Patterns

### Triggering a Research Job

```typescript
import { inngest } from '@/lib/inngest/client';

// Send event to trigger research
await inngest.send({
  name: 'research/start',
  data: {
    jobId: 'unique-job-id',
    keywords: 'AI research',
    criteria: ['Relevance: High quality sources'],
    apiKeys: {
      groq: process.env.GROQ_API_KEY,
      tavily: process.env.TAVILY_API_KEY
    },
    model: 'llama-3.1-8b-instant'
  }
});
```

### Canceling a Job

```typescript
// Send cancel event
await inngest.send({
  name: 'research/cancel',
  data: {
    jobId: 'job-id-to-cancel'
  }
});
```

### Monitoring Job Progress

```typescript
// Jobs are stored in MongoDB
// Check job status from your API
const job = await Job.findOne({ jobId });
console.log(job.status); // 'processing', 'completed', 'failed', 'cancelled'
console.log(job.progress); // 0-100
console.log(job.logs); // Array of log entries
```

## Best Practices

1. **Use Dev Server Locally** - Always use Inngest Dev Server for local development
2. **Test Before Deploy** - Verify functions work in dev before production
3. **Monitor Logs** - Check Inngest dashboard regularly for failures
4. **Handle Errors** - Inngest will retry failed functions automatically
5. **Keep Keys Secret** - Never commit API keys to version control
6. **Set Timeouts** - Long-running functions should have appropriate timeouts
7. **Use Job IDs** - Always use unique job IDs for tracking

## Resources

- 📚 [Inngest Documentation](https://www.inngest.com/docs)
- 🎯 [Inngest Quickstart](https://www.inngest.com/docs/quick-start)
- 🐛 [Inngest Discord Community](https://www.inngest.com/discord)
- 📊 [Inngest Dashboard](https://app.inngest.com/)

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review [DOCKER.md](./DOCKER.md) for Docker-specific issues
3. Check Inngest documentation
4. Open an issue on GitHub

---

**Pro Tip:** Start with Inngest Dev Server in development. It's the fastest way to debug and understand how your workflows execute!
