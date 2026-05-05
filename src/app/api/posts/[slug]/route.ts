import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

async function makeSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
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

// ===================== GET =====================
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = await makeSupabase();

    const { data: post } = await supabase
      .from('posts' as any)
      .select(`
        *,
        author:users!posts_author_id_fkey(id, name, email, role, avatar_url),
        comments(
          id, comment_text, created_at,
          user:users!comments_user_id_fkey(id, name, email, avatar_url)
        )
      `)
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// ===================== PUT =====================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = await makeSupabase();
    const admin = makeAdminClient();

    const { data: { user:authUser } } = await supabase.auth.getUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: currentUser } = await supabase
      .from('users' as any)
      .select('*')
      .eq('id', authUser.id)
      .single();

    const user = currentUser as any;

    const { data: existingPost } = await supabase
      .from('posts' as any)
      .select('*')
      .eq('slug', slug)
      .single();

    const postData = existingPost as any;

    if (!postData) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const canEdit =
      user?.role === 'admin' ||
      (user?.role === 'author' && postData.author_id === authUser.id);

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, body: postBody, image_url } = body;

    const { data: post } = await (admin
      .from('posts' as any) as any)
      .update({
        title: title || postData.title,
        body: postBody || postData.body,
        image_url: image_url !== undefined ? image_url : postData.image_url,
      })
      .eq('id', postData.id)
      .select('*')
      .single();

    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// ===================== DELETE =====================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const supabase = await makeSupabase();
    const admin = makeAdminClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: currentUser } = await supabase
      .from('users' as any)
      .select('*')
      .eq('id', authUser.id)
      .single();

    const user = currentUser as any;

    const { data: existingPost } = await supabase
      .from('posts' as any)
      .select('*')
      .eq('slug', slug)
      .single();

    const postData = existingPost as any;

    if (!postData) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const canDelete =
      user?.role === 'admin' ||
      (user?.role === 'author' && postData.author_id === authUser.id);

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await admin.from('posts' as any).delete().eq('id', postData.id);

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
