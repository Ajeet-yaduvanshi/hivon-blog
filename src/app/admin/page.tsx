'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

type PostType = any;
type CommentType = any;
type UserType = any;

type Tab = 'posts' | 'comments' | 'users';

export default function AdminPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [comments, setComments] = useState<CommentType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('posts');

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: currentUser } = await (supabase
        .from('users' as any) as any)
        .select('*')
        .eq('id', session.user.id)
        .single();

      const userData = currentUser as any;

      if (!userData || userData.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setUser(userData);

      // POSTS
      const { data: allPosts } = await (supabase
        .from('posts' as any) as any)
        .select(`*, author:users!posts_author_id_fkey(id, name, email)`)
        .order('created_at', { ascending: false });

      setPosts(allPosts || []);

      // COMMENTS
      const { data: allComments } = await (supabase
        .from('comments' as any) as any)
        .select(`*, user:users!comments_user_id_fkey(id, name, email), post:posts(id, title, slug)`)
        .order('created_at', { ascending: false });

      setComments(allComments || []);

      // USERS
      const { data: allUsers } = await (supabase
        .from('users' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });

      setUsers(allUsers || []);

      setLoading(false);
    }

    load();
  }, []);

  const handleDeletePost = async (slug: string) => {
    if (!confirm('Delete this post and all its comments?')) return;

    const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });

    if (res.ok) {
      setPosts(prev => prev.filter(p => p.slug !== slug));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });

    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await (supabase
      .from('users' as any) as any)
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
      );
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <div className="spinner" style={{ margin: '0 auto', width: '32px', height: '32px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container">

        {/* POSTS */}
        {posts.map(post => (
          <div key={post.id}>
            <Link href={`/blog/${post.slug}`}>
              {post.title}
            </Link>

            <div>
              by {(post.author as any)?.name} ·{' '}
              {post.created_at
                ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                : 'recent'}
            </div>
          </div>
        ))}

        {/* COMMENTS */}
        {comments.map(comment => (
          <div key={comment.id}>
            <strong>{comment.user?.name}</strong> ·{' '}
            {comment.created_at
              ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
              : 'recent'}
          </div>
        ))}

        {/* USERS */}
        {users.map(u => (
          <div key={u.id}>
            {u.name} ({u.role})

            {u.id !== user?.id && (
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value)}
              >
                <option value="viewer">viewer</option>
                <option value="author">author</option>
                <option value="admin">admin</option>
              </select>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}