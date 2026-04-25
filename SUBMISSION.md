# Hivon Blog — Submission Explanation

**Candidate:** Ajeet Yadav
**Assignment:** Full-Stack Blogging Platform
**Company:** Hivon Automations LLP

---

## 2. Feature Logic

### Authentication Flow
1. User visits `/auth/register` and fills in name, email, password, and selects a role (Viewer or Author)
2. Supabase Auth creates a new auth user
3. A Postgres trigger (`handle_new_user`) fires on `INSERT` to `auth.users` and automatically inserts a row in the public `users` table with the role from metadata
4. The user is redirected to `/dashboard`
5. Sessions are managed server-side via `@supabase/auth-helpers-nextjs` cookies
6. `middleware.ts` intercepts requests to `/dashboard/*` and `/admin/*` and redirects unauthenticated users to `/auth/login`

### Role-Based Access Control
Three roles are enforced at three layers:

**UI Layer** (conditional rendering):
- "Write Post" button only shown to Authors/Admins in Navbar
- Edit/Delete buttons on posts only shown to the post's Author or Admins
- Admin Panel link only shown to Admins
- Comment delete button only shown to comment owner or Admins

**API Layer** (every route checks role):
- `POST /api/posts` returns 403 if user is not Author or Admin
- `PUT /api/posts/[slug]` returns 403 if user is not the post's author or an Admin
- `DELETE /api/posts/[slug]` returns 403 if user is not the post's author or an Admin
- All comment operations check session before proceeding

**Database Layer** (Supabase RLS):
- Policies on the `posts` table enforce that only authors with the correct role can insert/update/delete
- The `comments` table requires an authenticated `user_id` matching `auth.uid()` for inserts
- These act as a final security backstop even if the API layer is bypassed

### Post Creation Logic
1. Author submits the form with title, body (HTML), and optional image URL
2. `POST /api/posts` validates the user's session and role
3. `generateUniqueSlug(title)` creates a URL-friendly slug with a timestamp suffix for uniqueness
4. `generatePostSummary(title, body)` calls the Google Gemini API
5. The post (with summary) is inserted into Supabase using the admin client
6. The user is redirected to the new post's page at `/blog/[slug]`

### AI Summary Generation Flow
1. On post creation, the body text is stripped of HTML tags to get clean text
2. Text is truncated to 3000 characters (cost optimization — reduces tokens sent to Gemini)
3. A prompt instructs Gemini 1.5 Flash to produce a ~200-word standalone summary
4. The summary is saved to `posts.summary` in the database
5. The summary is displayed on the blog listing page (first 160 chars as preview) and in full on the post detail page inside an "AI-Generated Summary" box
6. If the Gemini call fails (e.g. API quota), a fallback extracts the first 200 words from the plain text body

---

## 3. Cost Optimization

**Strategy: Generate Once, Store Forever**

The most important cost optimization implemented is that the AI summary is **generated exactly once** — at post creation time — and stored permanently in the `posts.summary` database column.

**Token reduction approaches:**
- **Single generation**: Summary is never regenerated when a post is edited. The `PUT /api/posts/[slug]` route does not call the Gemini API at all, preserving the original summary.
- **Input truncation**: The body text is truncated to 3,000 characters before being sent to Gemini. A 10,000-word article is trimmed to approximately 600 words of input, drastically reducing input tokens while still capturing enough context for a meaningful summary.
- **HTML stripping**: Raw HTML (with tags like `<p>`, `<h2>`, `<strong>`) is stripped before sending to the AI. This removes non-semantic tokens from the input.
- **Model selection**: Gemini 1.5 Flash is used instead of Gemini 1.5 Pro — it's faster and cheaper, making it ideal for a background summarization task.
- **DB as cache**: Since the summary is stored in PostgreSQL, there is zero API cost for reads. Displaying summaries on the listing page (which may be called thousands of times) incurs no AI cost whatsoever.

**Quantified impact**: A blog with 1000 posts would require exactly 1000 Gemini API calls total (one per post creation), regardless of how many times those posts are read, searched, or paginated through.

---

## 4. Development Understanding

### Bug Encountered and Fixed

**Problem:** After deploying the post creation endpoint, new posts were being created with `summary: null` even though the Gemini API was returning a valid string. The issue only happened in production (Vercel), not locally.

**Root cause:** The `GOOGLE_AI_API_KEY` environment variable was being accessed server-side in the API route, but it hadn't been added to the Vercel project's environment variable settings. In Next.js, variables without the `NEXT_PUBLIC_` prefix are only available server-side and must be explicitly configured in the deployment platform.

**Fix:** Added `GOOGLE_AI_API_KEY` to Vercel's Environment Variables dashboard (Settings → Environment Variables). Also added a try/catch with a graceful fallback in `generatePostSummary()` so that if the API call fails for any reason, the function returns a plain-text excerpt instead of null, ensuring the summary column always has useful content.

**Lesson:** Always verify all non-public environment variables are configured in your deployment platform. The `console.error` inside the try/catch was key to diagnosing this — it showed the error message "API key not valid" in the Vercel function logs.

### Key Architectural Decisions

**1. Two Supabase clients (session client vs. admin client)**
The application uses two different Supabase clients. The `createServerComponentClient` (using cookies/session) is used to verify who the user is. The `createClient` with the service role key is used for the actual database writes. This separation means: authentication logic stays clean and uses the session properly, while write operations that need to bypass RLS (e.g., creating a post on behalf of a user from the server) use the admin client. This avoids the common mistake of using service role for everything (a security risk) or session-only (which can fail with RLS on server-side insert).

**2. Slug-based URLs over ID-based**
Posts use slugs (`/blog/my-post-title-abc123`) instead of UUIDs (`/blog/550e8400-...`). This is better for SEO, more readable in shared links, and a better user experience. A timestamp suffix is appended to the slug base to ensure uniqueness without a separate database lookup.

**3. HTML body with live preview**
Rather than integrating a rich text editor library (which would add bundle size), posts use raw HTML input with a live rendered preview panel below the textarea. This keeps the implementation simple and gives authors full formatting power while staying lightweight.
