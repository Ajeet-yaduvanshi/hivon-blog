import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { generatePostSummary } from '@/lib/ai';
import { generateUniqueSlug } from '@/lib/slugify';
import { Database } from '@/types/database';

async function makeSupabase() {
  const cookieStore =  await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

function makeAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/posts
export async function GET(request: NextRequest) {
  try {
    const supabase = await makeSupabase();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let query = supabase
      .from('posts')
      .select(
        `id, title, body, image_url, summary, slug, published, created_at, author_id,
         author:users!posts_author_id_fkey(id, name, email, role, avatar_url)`,
        { count: 'exact' }
      )
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);
    }

    const { data: posts, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('GET /api/posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
    const supabase = await makeSupabase();
    const admin = makeAdminClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('*')
      .eq('id',authUser.id)
      .single();

    const user = currentUser as {
      role: 'author' | 'viewer' | 'admin'
    } | null;

    if (!user || !['author', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden - Authors and Admins only' }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: postBody, image_url } = body;

    if (!title || !postBody) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const slug = generateUniqueSlug(title);
    // Generate summary once at creation — stored in DB to avoid repeated API calls
    const summary = await generatePostSummary(title, postBody);

    const { data: post, error } = await admin
      .from('posts' as any)
      .insert([
        {
          title,
          body: postBody,
          image_url: image_url || null,
          author_id: authUser.id,
          summary,
          slug,
          published: true,
        },
      ] as any)
      .select(`*, author:users!posts_author_id_fkey(id, name, email, role)`)
      .single();

    if (error) throw error;

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('POST /api/posts error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
