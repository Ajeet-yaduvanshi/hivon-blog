# Hivon Blog Platform

A full-stack blogging platform built with **Next.js 14**, **Supabase**, and **Google Gemini AI** for AI-generated post summaries.

---


## 🚀 Live Demo

**Deployed URL:** `https://hivon-blog-pied.vercel.app/`

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend + Backend | Next.js 14 (App Router) |
| Authentication | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| AI Summaries | Google Gemini 1.5 Flash API |
| Version Control | Git + GitHub |
| Deployment | Vercel |

---

## 📋 Features

- **Three user roles**: Author (write/edit own posts), Viewer (read/comment), Admin (manage everything)
- **AI-generated summaries**: Every post gets a ~200-word Gemini-generated summary on creation (stored in DB to avoid repeat API calls)
- **Search** across post titles and content
- **Pagination** on the blog listing page (9 posts per page)
- **Featured images** on posts
- **Comments system** with delete permissions
- **Admin panel** with user role management, post moderation, comment monitoring
- **Role-based access control** enforced at both UI and API level
- **Row Level Security** on all Supabase tables

---

## 🗄 Database Schema

```sql
-- Three tables as required:
users     (id, name, email, role, avatar_url, created_at, updated_at)
posts     (id, title, body, image_url, author_id, summary, slug, published, created_at, updated_at)
comments  (id, post_id, user_id, comment_text, created_at, updated_at)
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)
- A Google AI API key (free at [aistudio.google.com](https://aistudio.google.com))

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/hivon-blog.git
cd hivon-blog
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
3. In **Storage**, create a bucket named `post-images` and set it to public

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_AI_API_KEY=your-google-ai-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Find your Supabase keys at: **Project Settings → API**

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🚢 Deployment (Vercel)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Hivon Blog Platform"
git remote add origin https://github.com/YOUR_USERNAME/hivon-blog.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Add all environment variables from `.env.local` in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_AI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel URL)
3. Click **Deploy**

### 3. Configure Supabase Auth redirect

In Supabase Dashboard → **Authentication → URL Configuration**:
- Add your Vercel URL to **Redirect URLs**: `https://your-app.vercel.app/api/auth/callback`

---

## 🤖 AI Tool Used

**Claude (claude.ai)** was used as the AI coding assistant throughout development.

**Why Claude?**
- Excellent understanding of full-stack Next.js + Supabase architecture
- Accurate TypeScript type generation
- Strong knowledge of Supabase Row Level Security policies
- Helpful for debugging API routes and auth flows

**How it helped:**
- Generated the complete database schema with RLS policies
- Scaffolded all API routes with proper error handling
- Helped design the role-based permission system
- Assisted with the Google Gemini integration for AI summaries
- Suggested cost optimization: generate summary once at creation, store in DB

---

## 🏗 Architecture Decisions

### Authentication Flow
1. User signs up via Supabase Auth with email/password
2. A database trigger (`handle_new_user`) automatically creates a `users` row with the selected role
3. Session is managed via Supabase Auth Helpers for Next.js
4. Middleware protects `/dashboard` and `/admin` routes

### Role-Based Access
- **Viewer**: Default role. Can view all posts, read summaries, post comments
- **Author**: Can create posts, edit/delete their own posts, view their own comments
- **Admin**: Full access — edit/delete any post, delete any comment, change user roles

Permissions are enforced at:
1. **UI level** — buttons/links shown conditionally
2. **API level** — every route checks session + role before performing actions
3. **Database level** — Row Level Security policies on all tables

### AI Summary Generation Flow
1. User submits a new post via the form
2. `POST /api/posts` route calls `generatePostSummary(title, body)`
3. Gemini 1.5 Flash generates a ~200-word summary
4. Summary is stored in the `posts.summary` column
5. Summary is displayed on the blog listing and post detail pages
6. **Cost optimization**: Summary is generated ONCE at creation. Editing a post does NOT regenerate the summary, avoiding repeated API calls and token costs.

### Key Technical Decisions
- **App Router** over Pages Router for better layouts and server components
- **Service Role client** used in API routes to bypass RLS where needed (post creation, comment deletion)
- **Slug-based URLs** for SEO-friendly post URLs
- **Full-text search** using Postgres `ilike` for simplicity; can be upgraded to `to_tsvector` for production

---

## 🐛 Bug Encountered & Fixed

**Problem**: After creating a post, the user was redirected but the post wasn't visible because the Supabase RLS policy for `INSERT` was checking `auth.uid()` but the server-side API route was using the service role client which bypasses auth headers.

**Solution**: Used the regular session-based client to verify the user's identity and role, then switched to the admin (service role) client only for the actual database write. This way authentication is checked properly while still having permission to write.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── posts/route.ts          # GET all posts, POST new post
│   │   ├── posts/[slug]/route.ts   # GET, PUT, DELETE single post
│   │   ├── comments/route.ts       # POST comment, DELETE comment
│   │   └── auth/callback/route.ts  # Supabase auth callback
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── blog/
│   │   ├── page.tsx                # Blog listing with search + pagination
│   │   └── [slug]/page.tsx         # Single post with comments
│   ├── dashboard/
│   │   ├── page.tsx                # User dashboard
│   │   └── posts/
│   │       ├── new/page.tsx        # Create post
│   │       └── [slug]/edit/page.tsx # Edit post
│   ├── admin/page.tsx              # Admin panel
│   ├── layout.tsx
│   ├── page.tsx                    # Homepage
│   └── globals.css
├── components/
│   └── layout/Navbar.tsx
├── lib/
│   ├── ai.ts                       # Google Gemini integration
│   ├── auth.ts                     # Auth helpers
│   ├── slugify.ts                  # Slug generation
│   └── supabase/
│       ├── client.ts               # Browser client
│       └── server.ts               # Server + admin clients
├── middleware.ts                   # Route protection
└── types/
    └── database.ts                 # TypeScript types
```
