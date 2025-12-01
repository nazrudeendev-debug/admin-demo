# PinoyMobile Admin Panel

## Overview
This is an admin panel for PinoyMobile.com, a mobile phone database and comparison website. The admin panel allows administrators to manage phone brands, specifications, prices, articles, and comparisons.

**Project Type:** Next.js 16 (App Router) Web Application  
**Current State:** Configured and running on Replit  
**Last Updated:** December 1, 2024

## Technology Stack
- **Framework:** Next.js 16.0.6 (App Router)
- **Language:** JavaScript (no TypeScript)
- **UI Library:** React 19.2.0
- **Styling:** Tailwind CSS 4.0
- **Components:** shadcn/ui (Radix UI components)
- **Icons:** Lucide React
- **Backend:** Supabase (Database, Authentication, Storage)
- **Database:** PostgreSQL (via Supabase)

## Project Structure
```
/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard and management pages
│   │   ├── api-logs/      # API import logs
│   │   ├── articles/      # Blog/news/review management
│   │   ├── brands/        # Brand management
│   │   ├── comparisons/   # Phone comparison tool
│   │   ├── media/         # Media library
│   │   ├── phones/        # Phone management & specs
│   │   ├── prices/        # Price management
│   │   └── users/         # User role management
│   ├── login/             # Authentication page
│   ├── layout.js          # Root layout with AuthProvider
│   └── page.js            # Redirects to /login
├── components/
│   ├── ui/                # shadcn/ui components
│   └── admin-sidebar.js   # Admin navigation sidebar
├── lib/
│   ├── auth-context.js    # Authentication context provider
│   ├── supabase.js        # Supabase client & helpers
│   └── utils.js           # Utility functions
├── supabase/
│   └── migrations/        # Database schema migrations
└── public/                # Static assets

```

## Key Features

### 1. Phone Management
- Add phones with basic information (brand, model, release date)
- Upload main images and galleries
- Publish/unpublish phones
- **Fetch specifications from mobile-api.dev API** (KEY FEATURE)
- Manual specification editing

### 2. Brand Management
- Add, edit, and delete phone brands
- Upload brand logos
- Manage brand descriptions

### 3. Specification Management
The admin panel's main workflow:
1. Add phone with basic info
2. Click "Fetch Specs" button
3. System fetches all specs from mobile-api.dev API
4. Review specs in editable form
5. Edit, remove, or add specifications
6. Save to database

### 4. Price Management
- Add prices for phones (region, currency, amount)
- View current prices
- Automatic price history tracking
- View all price changes

### 5. Content Management
- Create blog posts, news, and reviews
- Markdown content support
- Featured images
- Publish/draft status

### 6. Comparisons
- Create phone comparisons
- Compare multiple phones side by side
- Save and publish comparisons

### 7. User Management
- **Admin role:** Full access
- **Editor role:** Create/edit but cannot delete
- **Viewer role:** Read-only access

## Database Schema
All tables are managed via Supabase with Row Level Security (RLS) enabled:
- `brands` - Phone manufacturers
- `phones` - Phone models
- `phone_images` - Phone image galleries
- `specifications` - Phone specifications
- `prices` - Current prices
- `price_history` - Price change tracking
- `comparisons` - Phone comparisons
- `comparison_phones` - Comparison junction table
- `articles` - Blog/news/review content
- `api_import_logs` - API import tracking
- `user_roles` - User role assignments

## Replit Configuration

### Environment Variables
The following environment variables are required (stored as shared):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public key

### Workflow
- **Next.js Dev Server**: Runs `npm run dev -- -H 0.0.0.0 -p 5000`
  - Port: 5000 (required for Replit webview)
  - Host: 0.0.0.0 (allows external connections)
  - Output: webview

### Next.js Configuration
The `next.config.mjs` is configured to allow all origins for server actions, which is required for Replit's proxy environment.

## Setup Instructions

### First-Time Setup
1. **Environment Variables**: Already configured in Replit
2. **Install Dependencies**: Run `npm install` (already done)
3. **Database Migration**: Run the SQL migration in Supabase SQL Editor:
   - File: `supabase/migrations/20251201171122_create_pinoymobile_schema.sql`

### Create First Admin User
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter email and password, copy the User ID
4. Run in Supabase SQL Editor:
   ```sql
   INSERT INTO user_roles (user_id, role)
   VALUES ('YOUR_USER_ID_HERE', 'admin');
   ```
5. Access the admin panel and log in

## Development Workflow

### Running the Application
The Next.js dev server automatically starts via the workflow. If you need to manually restart:
- Click the "Run" button in Replit, or
- Use the command: `npm run dev -- -H 0.0.0.0 -p 5000`

### Making Changes
- Edit files in the `app/`, `components/`, or `lib/` directories
- Next.js will automatically hot-reload changes
- The webview will update automatically

## Important Notes

1. **Authentication Required**: All admin pages require login with a user that has a role in the `user_roles` table
2. **Supabase Storage**: For file uploads (images, logos), configure Supabase Storage buckets
3. **API Integration**: The spec fetching feature uses mobile-api.dev API
4. **Proxy Environment**: Next.js is configured to work with Replit's iframe-based proxy

## Troubleshooting

### Can't See Changes
- Check that the Next.js dev server is running
- Verify environment variables are set correctly
- Try a hard refresh in the browser

### Login Issues
- Ensure user exists in Supabase Authentication
- Verify user has a role in `user_roles` table
- Check Supabase credentials are correct

### Database Errors
- Ensure the migration has been run in Supabase
- Check RLS policies are enabled
- Verify user authentication is working

## Additional Resources
- [Setup Guide](SETUP.md) - Detailed setup instructions
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
