# 🔄 Search History Auto-Save Flow

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER PERFORMS RESEARCH                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. User fills in city name and clicks "Start Research"          │
│     Location: components/research-panel.tsx                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. POST /api/research - Creates research job                    │
│     - Sends: city, apiKey, tavilyKey, model, criteria           │
│     - Returns: jobId                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Polling Loop - Check job status every 1 second              │
│     GET /api/research/status?id=${jobId}                        │
│     - Status: searching → waiting_for_selection → completed     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Research Completes - Results received                        │
│     - job.status === "completed"                                │
│     - job.result contains full JSON response                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. AUTO-SAVE TO HISTORY (Background)                           │
│     Function: saveToHistory(results)                            │
│     Location: components/research-panel.tsx (line 41-56)        │
│                                                                  │
│     POST /api/history                                           │
│     Body: {                                                     │
│       query: "New York",           // City name                 │
│       criteria: [...],             // Criteria array            │
│       results: {...},              // FULL JSON RESPONSE        │
│       model: "groq/compound",      // Model used                │
│       status: "success"                                         │
│     }                                                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. API ROUTE PROCESSING                                        │
│     Location: app/api/history/route.ts                         │
│                                                                  │
│     a) Get authenticated user session                           │
│        - session.user.id                                        │
│                                                                  │
│     b) Calculate JSON size                                      │
│        - sizeKB = Buffer.byteLength(JSON.stringify(results))   │
│        - Check if < 15MB                                        │
│                                                                  │
│     c) Connect to MongoDB                                       │
│        - await dbConnect()                                      │
│                                                                  │
│     d) Create SearchHistory document                            │
│        await SearchHistory.create({                             │
│          userId: session.user.id,                               │
│          query: "New York",                                     │
│          criteria: [...],                                       │
│          results: {...},        // ← FULL JSON STORED HERE     │
│          model: "groq/compound",                                │
│          sizeKB: 125.45,                                        │
│          status: "success",                                     │
│          timestamp: Date.now()                                  │
│        })                                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. SAVED IN MONGODB                                            │
│     Database: ai-research-agent                                 │
│     Collection: searchhistories                                 │
│                                                                  │
│     Document Structure:                                         │
│     {                                                           │
│       _id: ObjectId("..."),                                     │
│       userId: "675a1b2c3d4e5f6g7h8i9j0k",                      │
│       query: "New York",                                        │
│       criteria: [                                               │
│         {                                                       │
│           id: "1",                                              │
│           name: "Average Temperature",                          │
│           description: "Annual average..."                      │
│         }                                                       │
│       ],                                                        │
│       results: {                    // ← FULL JSON STORED       │
│         city: "New York",                                       │
│         temperature: 15.5,                                      │
│         population: 8336817,                                    │
│         sources: [...],                                         │
│         criteria_results: {...}                                 │
│       },                                                        │
│       model: "groq/compound",                                   │
│       sizeKB: 125.45,                                           │
│       status: "success",                                        │
│       timestamp: ISODate("2025-12-23T10:30:00.000Z"),          │
│       createdAt: ISODate("2025-12-23T10:30:00.000Z"),          │
│       updatedAt: ISODate("2025-12-23T10:30:00.000Z")           │
│     }                                                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  8. USER VIEWS HISTORY                                          │
│     Tab: Dashboard → History                                    │
│     Component: SearchHistoryPanel                               │
│                                                                  │
│     GET /api/history?page=1&limit=20                           │
│     - Returns list WITHOUT results (for performance)            │
│     - Shows: query, criteria, size, timestamp, model           │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  9. USER CLICKS ON HISTORY ITEM                                 │
│     Action: View Details                                        │
│                                                                  │
│     GET /api/history/${id}                                      │
│     - Returns FULL document WITH results                        │
│     - Displays JSON in modal with syntax highlighting           │
│     - Options: Download, Delete                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. **Authentication Flow**
```typescript
User Sign In → NextAuth creates session
              → session.user.id = MongoDB User._id
              → Used to associate history with user
```

### 2. **Auto-Save Trigger**
```typescript
// components/research-panel.tsx (line 60)
if (job.status === "completed") {
  setResearchReport(job.result)
  saveToHistory(job.result)  // ← Auto-save here
  toast.success("Research completed!")
}
```

### 3. **JSON Storage Strategy**
- **Direct Storage**: JSON stored as BSON in MongoDB
- **No File System**: Everything in database
- **Size Limit**: 15MB (MongoDB limit is 16MB)
- **Compression**: None (MongoDB handles it internally)

### 4. **Data Retrieval**
```typescript
// List view - Exclude results for performance
SearchHistory.find().select("-results")

// Detail view - Include everything
SearchHistory.findOne({ _id, userId })
```

## File Structure

```
app/
  api/
    history/
      route.ts              # POST: save, GET: list
      [id]/
        route.ts            # GET: details, DELETE: remove
    research/
      route.ts              # POST: start research
      status/
        route.ts            # GET: poll status

components/
  research-panel.tsx        # Auto-save on complete
  search-history.tsx        # UI for viewing history

lib/
  models/
    SearchHistory.ts        # MongoDB schema
    User.ts                 # User model

auth.ts                     # NextAuth config
```

## Security Features

✅ **User Isolation**: Each user sees only their history
✅ **Authentication Required**: All history endpoints check session
✅ **Size Validation**: Prevents storing files > 15MB
✅ **Data Sanitization**: MongoDB handles escaping
✅ **Index Optimization**: Fast queries on userId + timestamp

## Usage Example

### User Journey:
1. **Sign In** → Session created with user.id
2. **Go to Research Tab** → Enter "Tokyo"
3. **Complete Research** → Results appear
4. **Background**: Results auto-saved to MongoDB ✓
5. **Go to History Tab** → See "Tokyo" in list
6. **Click "Tokyo"** → View full JSON
7. **Click Download** → Save as tokyo-2025-12-23.json

### Technical Journey:
```javascript
// 1. Research completes
results = { city: "Tokyo", temperature: 18.5, ... }

// 2. Auto-save triggered
await fetch("/api/history", {
  method: "POST",
  body: JSON.stringify({
    query: "Tokyo",
    results: results,  // ← Full JSON here
    criteria: [...],
    model: "groq/compound"
  })
})

// 3. Stored in MongoDB
await SearchHistory.create({
  userId: session.user.id,
  results: results,  // ← Stored as BSON
  ...
})

// 4. Retrieved later
const history = await SearchHistory.findOne({ _id })
return history.results  // ← Full JSON retrieved
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Not authenticated | 401 Unauthorized |
| Missing fields | 400 Bad Request |
| JSON > 15MB | 413 Payload Too Large |
| MongoDB error | 500 Internal Server Error |
| Auto-save fails | Console.error (silent fail) |

## Performance Optimizations

1. **Pagination**: 20 items per page
2. **Lazy Loading**: Results loaded only on click
3. **Indexing**: userId + timestamp for fast queries
4. **Caching**: MongoDB connection cached
5. **Selective Fields**: List view excludes large results field

## Testing the Flow

```bash
# 1. Start dev server
npm run dev

# 2. Sign in
# Visit: http://localhost:3000/auth/signin

# 3. Perform research
# Dashboard → Research Tab → Enter city → Search

# 4. Check MongoDB
mongosh
use ai-research-agent
db.searchhistories.find().pretty()

# 5. View in UI
# Dashboard → History Tab
```

## Troubleshooting

**History not saving?**
- Check: User is signed in (session exists)
- Check: MongoDB connection (MONGODB_URI in .env.local)
- Check: Console for errors

**Can't see history?**
- Check: Signed in as same user
- Check: Research actually completed (check status)
- Check: No errors in browser console

**Download not working?**
- Check: Browser allows downloads
- Check: Results exist in database
- Check: JSON is valid

---

🎉 **The flow is complete and automatic!** Every successful research is now saved to MongoDB with full JSON results.
