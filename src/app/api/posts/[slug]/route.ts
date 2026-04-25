import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

function makeSupabase() {
  const cookieStore = cookies();
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

// GET /api/posts/[slug]
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = makeSupabase();
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey(id, name, email, role, avatar_url),
        comments(
          id, comment_text, created_at,
          user:users!comments_user_id_fkey(id, name, email, avatar_url)
        )
      `)
      .eq('slug', params.slug)
      .eq('published', true)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (error) {
    console.error('GET /api/posts/[slug] error:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

// PUT /api/posts/[slug]
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = makeSupabase();
    const admin = makeAdminClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: currentUser } = await supabase
      .from('users').select('*').eq('id', session.user.id).single();

    const { data: existingPost } = await supabase
      .from('posts').select('*').eq('slug', params.slug).single();

    if (!existingPost) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const canEdit =
      currentUser?.role === 'admin' ||
      (currentUser?.role === 'author' && existingPost.author_id === session.user.id);

    if (!canEdit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { title, body: postBody, image_url } = body;

    const { data: post, error } = await admin
      .from('posts')
      .update({
        title: title || existingPost.title,
        body: postBody || existingPost.body,
        image_url: image_url !== undefined ? image_url : existingPost.image_url,
      })
      .eq('id', existingPost.id)
      .select(`*, author:users!posts_author_id_fkey(id, name, email, role)`)
      .single();

    if (error) throw error;
    return NextResponse.json({ post });
  } catch (error) {
    console.error('PUT /api/posts/[slug] error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}

// DELETE /api/posts/[slug]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = makeSupabase();
    const admin = makeAdminClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: currentUser } = await supabase
      .from('users').select('*').eq('id', session.user.id).single();

    const { data: existingPost } = await supabase
      .from('posts').select('*').eq('slug', params.slug).single();

    if (!existingPost) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const canDelete =
      currentUser?.role === 'admin' ||
      (currentUser?.role === 'author' && existingPost.author_id === session.user.id);

    if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await admin.from('posts').delete().eq('id', existingPost.id);
    if (error) throw error;

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/posts/[slug] error:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
