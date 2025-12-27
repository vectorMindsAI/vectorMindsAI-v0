"""
PostHog Analytics Test Utility

Run this in your browser console to test if analytics are working.
"""

# Step 1: Check PostHog Configuration
def check_posthog_config():
    """Check if PostHog is properly configured"""
    
    results = {
        'api_key_present': False,
        'api_key_value': '',
        'posthog_loaded': False,
        'posthog_initialized': False,
        'test_tracking_works': False,
    }
    
    # Check in browser console:
    print("""
    ══════════════════════════════════════════════════════════
    📊 PostHog Analytics Configuration Test
    ══════════════════════════════════════════════════════════
    
    Run these commands in your BROWSER CONSOLE (F12):
    
    // 1. Check if API key is set
    console.log('API Key:', process.env.NEXT_PUBLIC_POSTHOG_KEY);
    
    // 2. Check if PostHog is loaded
    console.log('PostHog loaded:', !!window.posthog);
    console.log('PostHog initialized:', window.posthog?.__loaded);
    
    // 3. Check PostHog object
    console.log('PostHog object:', window.posthog);
    
    // 4. Send test event
    if (window.posthog) {
        window.posthog.capture('test_event', {
            test: true,
            timestamp: new Date().toISOString(),
            source: 'manual_test'
        });
        console.log('✅ Test event sent!');
    } else {
        console.log('❌ PostHog not loaded');
    }
    
    // 5. Check network requests
    // Open Network tab, filter by "posthog" or "capture"
    // You should see POST requests to app.posthog.com/capture/
    
    ══════════════════════════════════════════════════════════
    """)

# Step 2: Setup Instructions
def setup_instructions():
    print("""
    ══════════════════════════════════════════════════════════
    🔧 SETUP INSTRUCTIONS
    ══════════════════════════════════════════════════════════
    
    If you see "undefined" or errors, follow these steps:
    
    1. CREATE .env.local FILE:
       ────────────────────────────────────────────────────
       In your project root, create: .env.local
       
       Add these lines:
       
       NEXT_PUBLIC_POSTHOG_KEY=phc_your_actual_key_here
       NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
       
    
    2. GET POSTHOG API KEY:
       ────────────────────────────────────────────────────
       a) Go to: https://posthog.com/signup
       b) Create account (free)
       c) Create new project
       d) Go to: Settings → Project Settings
       e) Copy "Project API Key" (starts with phc_)
       f) Paste into .env.local file
    
    
    3. RESTART YOUR SERVER:
       ────────────────────────────────────────────────────
       Stop your dev server (Ctrl+C)
       Run: npm run dev
       
       Wait for it to fully start
    
    
    4. TEST IN BROWSER:
       ────────────────────────────────────────────────────
       a) Open: http://localhost:3000
       b) Open DevTools (F12)
       c) Go to Network tab
       d) Filter by: "posthog"
       e) Perform a search in your app
       f) You should see POST requests to:
          https://app.posthog.com/capture/
          Status: 200 OK
    
    
    5. CHECK POSTHOG DASHBOARD:
       ────────────────────────────────────────────────────
       a) Go to: https://app.posthog.com
       b) Click: Activity → Events
       c) Enable: Live mode (toggle in top right)
       d) Perform search in your app
       e) Event should appear within 1-2 seconds
    
    ══════════════════════════════════════════════════════════
    """)

# Step 3: How to View Data in PostHog
def view_data_instructions():
    print("""
    ══════════════════════════════════════════════════════════
    📊 HOW TO SEE USER SEARCHES IN POSTHOG
    ══════════════════════════════════════════════════════════
    
    METHOD 1: View Live Events
    ────────────────────────────────────────────────────────
    1. Login: https://app.posthog.com
    2. Click: Activity → Events (left sidebar)
    3. Toggle: "Live" mode (top right)
    4. Click on any "research_completed" event
    5. Look at "Properties" section:
       
       ✅ query: "what user searched"
       ✅ outputLength: 2500 (characters)
       ✅ outputCharacters: 2500
       ✅ duration: 3200 (milliseconds)
       ✅ model: "gemini-flash"
       ✅ success: true
       ✅ resultsCount: 5
    
    
    METHOD 2: Create Insight for Search Queries
    ────────────────────────────────────────────────────────
    1. Click: "Insights" (left sidebar)
    2. Click: "New Insight"
    3. Select: Event → "research_completed"
    4. Change view to: "Table"
    5. Add columns:
       - Click "+ Add column"
       - Select: Properties → query
       - Select: Properties → outputLength
       - Select: Properties → duration
       - Select: Properties → model
    6. Click: "Save" → Name it "User Searches"
    
    Now you have a table showing:
    - What each user searched
    - How long results were
    - How long it took
    - Which model was used
    
    
    METHOD 3: Create Dashboard
    ────────────────────────────────────────────────────────
    1. Click: "Dashboards" (left sidebar)
    2. Click: "New Dashboard"
    3. Name it: "User Activity Monitor"
    4. Click: "Add insight"
    5. Add your saved insights from Method 2
    6. Arrange tiles as you like
    
    
    METHOD 4: Export Data
    ────────────────────────────────────────────────────────
    1. Go to any Insight
    2. Click: "..." (three dots)
    3. Select: "Export" → CSV or JSON
    4. Download and analyze in Excel/Python
    
    ══════════════════════════════════════════════════════════
    """)

# Step 4: Sample Queries
def sample_queries():
    print("""
    ══════════════════════════════════════════════════════════
    🔍 SAMPLE POSTHOG QUERIES
    ══════════════════════════════════════════════════════════
    
    QUERY 1: See all searches today
    ────────────────────────────────────────────────────────
    Event: research_initiated
    Filter: timestamp > -1d
    Group by: properties.query
    
    
    QUERY 2: Average result length
    ────────────────────────────────────────────────────────
    Event: research_completed
    Property: outputLength
    Aggregation: Average
    Time period: Last 7 days
    
    
    QUERY 3: Most popular searches
    ────────────────────────────────────────────────────────
    Event: research_initiated
    Group by: properties.query
    Sort by: count (descending)
    Limit: 10
    
    
    QUERY 4: Search duration by model
    ────────────────────────────────────────────────────────
    Event: research_completed
    Property: duration
    Aggregation: Average
    Breakdown by: properties.model
    
    
    QUERY 5: Output length distribution
    ────────────────────────────────────────────────────────
    Event: research_completed
    Property: outputLength
    Visualization: Histogram
    Buckets: 0-1000, 1000-5000, 5000-10000, 10000+
    
    ══════════════════════════════════════════════════════════
    """)

# Main execution
if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║                                                          ║
    ║        PostHog Analytics Testing Guide                  ║
    ║                                                          ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    check_posthog_config()
    setup_instructions()
    view_data_instructions()
    sample_queries()
    
    print("""
    ══════════════════════════════════════════════════════════
    ✅ CHECKLIST
    ══════════════════════════════════════════════════════════
    
    □ Created .env.local file
    □ Added NEXT_PUBLIC_POSTHOG_KEY
    □ Added NEXT_PUBLIC_POSTHOG_HOST
    □ Restarted dev server
    □ Tested in browser (F12 → Network tab)
    □ Saw POST requests to posthog.com
    □ Checked PostHog dashboard
    □ Saw events in Activity → Events
    □ Created insights for searches
    □ Created dashboard
    
    ══════════════════════════════════════════════════════════
    
    Need help? Check:
    - POSTHOG_SETUP_GUIDE.md
    - ANALYTICS_TRACKING.md
    
    ══════════════════════════════════════════════════════════
    """)
