# PinoyMobile Admin Panel - Setup Guide

## Quick Start

### 1. Create Your First Admin User

Before you can use the admin panel, you need to create an admin user in Supabase:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to **Authentication** > **Users**
3. Click **Add User** > **Create new user**
4. Enter your email and password
5. Copy the User ID that is generated

### 2. Assign Admin Role

After creating the user, run this SQL in the Supabase SQL Editor:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin');
```

Replace `YOUR_USER_ID_HERE` with the actual User ID you copied.

### 3. Access the Admin Panel

1. Run the development server: `npm run dev`
2. Go to http://localhost:3000
3. You'll be redirected to the login page
4. Sign in with your email and password
5. You'll be taken to the admin dashboard

## Features Overview

### Dashboard
- View statistics (total phones, brands, articles, price changes)
- Quick actions to add new content
- Recent phones and articles overview

### Brand Management
- Add, edit, and delete phone brands
- Upload brand logos
- Manage brand information

### Phone Management
- Add phones with basic info (brand, model, release date)
- Upload main images
- Publish/unpublish phones
- **Fetch specifications from mobile-api.dev**

### Specification Management (THE KEY FEATURE)
1. Go to Phones page
2. Click "Fetch Specs" on any phone
3. System fetches all specs from mobile-api.dev API
4. Review the specs in an editable form
5. Edit, remove, or add specifications as needed
6. Save to database

This means you DON'T have to manually type 50-100 specifications!

### Price Management
- Add prices for phones
- Specify region and currency
- View current prices
- Automatic price history tracking
- View all price changes

### Blog & News Management
- Create blog posts, news, and reviews
- Markdown content support
- Featured images
- Publish/draft status

### Comparisons
- Create phone comparisons
- Compare multiple phones side by side
- Save and publish comparisons

### API Import Logs
- View history of all API imports
- Track success and error messages
- Monitor specification fetches

### User Management
- Admin role: Full access
- Editor role: Create/edit but cannot delete
- Viewer role: Read-only access

## Important Notes

1. **Authentication is required** - You must be logged in to access any admin page

2. **API Specification Import** - The main workflow is:
   - Add phone with basic info
   - Click "Fetch Specs" button
   - Review and edit the imported data
   - Save to database

3. **Role-based Access** - Make sure your user has the "admin" role in the database

4. **Supabase Storage** - For file uploads, you'll need to configure Supabase Storage buckets

## Technology Stack

- Next.js 16 (App Router)
- JavaScript (no TypeScript)
- Supabase (Database, Auth, Storage)
- shadcn/ui components
- Tailwind CSS
- Lucide icons

## Database Schema

All tables are created automatically with the migration:
- brands
- phones
- phone_images
- specifications
- prices
- price_history
- comparisons
- comparison_phones
- articles
- api_import_logs
- user_roles

## Support

For issues or questions, check the Supabase dashboard logs and the API import logs page in the admin panel.
