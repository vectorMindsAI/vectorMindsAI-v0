# Admin Role Management

## Overview

The cache dashboard and admin tools are restricted to users with the `admin` role. By default, all users are created with the `user` role.

## Security Model

- **Regular Users**: Can access their own research, jobs, and history
- **Admin Users**: 
  - Can access the cache dashboard at `/cache`
  - Can view system-wide cache statistics
  - Can clear and invalidate caches
  - Can see all cached entries (from all users)

⚠️ **Important**: The cache is system-wide, not per-user. Admin access is required because it shows data from ALL users.

## Promoting a User to Admin

### Method 1: Using the Script (Recommended)

```bash
# From the project root
node scripts/make-admin.js user@example.com
```

Example output:
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

✅ Successfully promoted user@example.com to admin role

User details:
  Name: John Doe
  Email: user@example.com
  Role: admin
  Created: 2026-01-06T10:30:00.000Z

🔌 Disconnected from MongoDB
```

### Method 2: Direct Database Update

Using MongoDB Compass or mongo shell:

```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "admin" } }
)
```

### Method 3: During User Creation

When creating a user programmatically:

```typescript
const newUser = await User.create({
  name: "Admin User",
  email: "admin@example.com",
  password: hashedPassword,
  provider: "credentials",
  role: "admin", // Set role to admin
})
```

## Verifying Admin Access

1. Sign in with the admin user
2. Check the sidebar - "Cache Dashboard" link should be visible
3. Navigate to `/cache` - should show the dashboard
4. Regular users will be redirected to `/dashboard` if they try to access `/cache`

## Admin-Protected Endpoints

The following endpoints require `role: "admin"`:

- `GET /api/cache/stats` - View cache statistics
- `DELETE /api/cache/stats` - Clear caches
- `GET /api/cache/invalidate` - List invalidation actions
- `POST /api/cache/invalidate` - Execute cache invalidation
- `/cache` page - Cache dashboard UI

## Revoking Admin Access

```bash
# Update using MongoDB
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "user" } }
)
```

Or create a similar script `scripts/revoke-admin.js` if needed.

## First Admin Setup

For a new deployment:

1. Create your first user account through signup
2. Promote yourself to admin using the script:
   ```bash
   node scripts/make-admin.js your-email@example.com
   ```
3. Sign out and sign back in to refresh the session
4. The cache dashboard link will now appear in the sidebar

## Session Updates

After changing a user's role:
- The user must **sign out and sign back in** for the role change to take effect
- The role is stored in the JWT token and updated during the sign-in flow

## Environment Variables

Make sure you have MongoDB connection configured:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

The `make-admin.js` script reads from `.env.local` or `.env` files.

## Troubleshooting

**"User not found"**
- Verify the email is correct (case-insensitive)
- Check that the user exists in the database

**"Already an admin"**
- User already has admin role, no action needed

**Cache dashboard not showing**
- Sign out and sign back in after role change
- Clear browser cookies/localStorage
- Check browser console for errors

**403 Forbidden on cache endpoints**
- Verify user role in the database
- Check that JWT token includes role (inspect in browser dev tools)
- Ensure session is refreshed after role change
