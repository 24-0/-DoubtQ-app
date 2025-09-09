# Doubt Posting App - Complete Setup Guide

This guide will help you set up the Doubt Posting App with both frontend and backend, including authentication.

## Project Overview

The Doubt Posting App is a React-based application with the following features:
- User authentication and profiles
- Question posting and answering system
- Study groups and community features
- Real-time messaging and file sharing
- Points and reputation system

**Tech Stack:**
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend:** Supabase (PostgreSQL), Node.js server with Hono
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage for files and avatars

## Prerequisites

Before setting up the project, ensure you have the following installed:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/

2. **Supabase Account**
   - Sign up at: https://supabase.com/
   - Create a new project

3. **Git** (optional, for version control)
   - Download from: https://git-scm.com/

## Step 1: Supabase Project Setup

### 1.1 Create a Supabase Project
1. Go to https://supabase.com/
2. Click "New Project"
3. Fill in your project details:
   - Name: `doubt-posting-app`
   - Database Password: Choose a strong password
   - Region: Select the closest region to you

### 1.2 Get Your Project Credentials
After your project is created, go to Settings > API to get:
- **Project URL** (e.g., `https://your-project-id.supabase.co`)
- **anon/public key** (starts with `eyJ...`)
- **service_role key** (starts with `eyJ...`) - Keep this secret!

### 1.3 Set Up Storage Buckets
In your Supabase dashboard:
1. Go to Storage
2. Create the following buckets (all private):
   - `make-0a52de3b-avatars` - For user profile pictures
   - `make-0a52de3b-attachments` - For question attachments
   - `make-0a52de3b-group-files` - For group file sharing

## Step 2: Environment Variables Setup

### 2.1 Create Environment Files

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here

# Backend Environment Variables (for local development)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important:** Replace the placeholder values with your actual Supabase credentials.

### 2.2 VSCode Environment Setup
1. Install the "DotENV" extension in VSCode for syntax highlighting
2. Make sure `.env.local` is in your `.gitignore` file to avoid committing secrets

## Step 3: Frontend Setup

### 3.1 Install Dependencies
```bash
npm install
```

### 3.2 Verify Installation
Check that all dependencies are installed correctly:
```bash
npm list --depth=0
```

### 3.3 Start Development Server
```bash
npm run dev
```

The frontend will be available at: `http://localhost:3000`

## Step 4: Backend Setup

### 4.1 Deploy Backend Function to Supabase

#### Option A: Using Supabase CLI (Recommended)
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy make-server-0a52de3b
   ```

#### Option B: Manual Upload via Dashboard
1. Go to your Supabase dashboard
2. Navigate to Edge Functions
3. Create a new function named `make-server-0a52de3b`
4. Copy the content from `src/supabase/functions/server/index.tsx`
5. Set environment variables in the function settings:
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

### 4.2 Local Development (Optional)
For local development of the backend server:

1. Ensure your `.env.local` file contains the correct environment variables:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Run the server locally:
   ```bash
   npm run start
   ```

   The backend will be available at: `http://localhost:3000`

   **Note:** Environment variables are automatically loaded from `.env.local` using dotenv.

## Step 5: Authentication Setup

### 5.1 Configure Supabase Auth
In your Supabase dashboard:

1. Go to Authentication > Settings
2. Configure the following:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add `http://localhost:3000`
   - **Enable email confirmations**: Toggle as needed

### 5.2 Test Authentication
1. Start the frontend: `npm run dev`
2. Click "Sign In" in the app
3. Try registering a new account
4. Verify the authentication flow works

## Step 6: Database Schema (Optional)

If you need to set up additional database tables, you can create them in Supabase:

1. Go to SQL Editor in your Supabase dashboard
2. Run SQL commands to create tables as needed

The current backend uses a key-value store abstraction, so additional tables might not be necessary unless you extend the functionality.

## Step 7: Running the Complete Application

### 7.1 Development Mode
1. **Terminal 1:** Start the frontend
   ```bash
   npm run dev
   ```

2. **Terminal 2:** Start the backend (if running locally)
   ```bash
   npm run start
   ```

### 7.2 Production Build
1. Build the frontend:
   ```bash
   npm run build
   ```

2. The built files will be in the `build/` directory
3. Deploy the `build/` folder to your hosting service (Netlify, Vercel, etc.)

## Step 8: Features Overview

### 8.1 Core Features
- **Question Feed:** Browse and search questions
- **Post Questions:** Create new questions with tags and subjects
- **Answer System:** Provide answers with point rewards
- **User Profiles:** View stats and manage profile
- **Study Groups:** Create and join study groups
- **Community:** Country-based community messaging
- **File Sharing:** Upload attachments and group files

### 8.2 Authentication Features
- User registration and login
- Guest mode for browsing
- Session management
- Protected routes

## Step 9: Troubleshooting

### Common Issues

#### 1. "Failed to fetch" errors
- Check your Supabase URL and keys in `.env.local`
- Ensure the backend function is deployed and accessible
- Verify CORS settings in Supabase

#### 2. Authentication not working
- Check Supabase Auth settings
- Verify redirect URLs are configured correctly
- Ensure email confirmation is set up properly

#### 3. Storage upload fails
- Verify storage buckets exist and have correct permissions
- Check file size limits in Supabase settings

#### 4. Backend server errors
- Check Node.js version compatibility
- Verify environment variables are set correctly
- Review server logs in the terminal

### Debug Mode
Enable debug logging by setting:
```env
VITE_DEBUG=true
```

### Getting Help
- Check Supabase documentation: https://supabase.com/docs
- Review the code comments for implementation details
- Check browser console and network tab for errors

## Step 10: Deployment

### Frontend Deployment
Deploy the built frontend to:
- **Vercel:** Connect your GitHub repo
- **Netlify:** Drag and drop the `build/` folder
- **GitHub Pages:** Use GitHub Actions

### Backend Deployment
The backend is already deployed to Supabase Edge Functions. No additional deployment needed.

### Environment Variables for Production
Set the production environment variables in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Additional Configuration

### Custom Domain
1. In Supabase dashboard: Settings > Custom Domains
2. Add your custom domain
3. Update environment variables with the custom domain URL

### Email Templates
Customize authentication emails in: Supabase > Authentication > Email Templates

### Rate Limiting
Configure rate limits in: Supabase > Edge Functions > Settings

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development
npm run dev

# Build for production
npm run build
```

## Support

If you encounter any issues during setup:
1. Check this guide for troubleshooting steps
2. Verify all prerequisites are installed
3. Ensure environment variables are correct
4. Check Supabase dashboard for any service issues

The application should now be fully functional with authentication, backend API, and all features working correctly!
