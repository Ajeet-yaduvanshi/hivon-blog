import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

async function makeSupabase() {
  const cookieStore = await cookies(); // ← add await
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

// Then await it in POST and DELETE:
const supabase = await makeSupabase(); // ← add await

function makeAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const supabase =await makeSupabase();
    const admin = makeAdminClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - Please log in to comment' }, { status: 401 });
    }

    const body = await request.json();
    const { post_id, comment_text } = body;

    if (!post_id || !comment_text?.trim()) {
      return NextResponse.json({ error: 'Post ID and comment text are required' }, { status: 400 });
    }

    const { data: comment, error } = await admin
      .from('comments')
      .insert({ post_id, user_id: session.user.id, comment_text: comment_text.trim() })
      .select(`*, user:users!comments_user_id_fkey(id, name, email, avatar_url)`)
      .single();

    if (error) throw error;
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/comments error:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

// DELETE /api/comments?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await makeSupabase();
    const admin = makeAdminClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');
    if (!commentId) return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });

    const { data: currentUser } = await supabase
      .from('users').select('role').eq('id', session.user.id).single();

    const { data: comment } = await supabase
      .from('comments').select('*').eq('id', commentId).single();

    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    const canDelete = currentUser?.role === 'admin' || comment.user_id === session.user.id;
    if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await admin.from('comments').delete().eq('id', commentId);
    if (error) throw error;

    return NextResponse.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('DELETE /api/comments error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
