'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Post, Comment, User } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'posts' | 'comments' | 'users';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('posts');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }

      const { data: currentUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setUser(currentUser);

      // Fetch all posts
      const { data: allPosts } = await supabase
        .from('posts')
        .select(`*, author:users!posts_author_id_fkey(id, name, email)`)
        .order('created_at', { ascending: false });
      setPosts(allPosts || []);

      // Fetch all comments
      const { data: allComments } = await supabase
        .from('comments')
        .select(`*, user:users!comments_user_id_fkey(id, name, email), post:posts(id, title, slug)`)
        .order('created_at', { ascending: false });
      setComments(allComments || []);

      // Fetch all users
      const { data: allUsers } = await supabase
        .from('users')
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
    if (res.ok) setPosts(prev => prev.filter(p => p.slug !== slug));
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
    if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <div className="spinner" style={{ margin: '0 auto', width: '32px', height: '32px', borderWidth: '3px' }} />
      </div>
    );
  }

  const tabs = [
    { id: 'posts' as Tab, label: `Posts (${posts.length})` },
    { id: 'comments' as Tab, label: `Comments (${comments.length})` },
    { id: 'users' as Tab, label: `Users (${users.length})` },
  ];

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container fade-up">
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2.5rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              marginBottom: '0.4rem',
            }}>
              Admin Panel
            </div>
            <h1 style={{ fontSize: '2rem' }}>Site Management</h1>
          </div>
          <span className="badge badge-admin">Administrator</span>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}>
          {[
            { label: 'Total Posts', value: posts.length, color: 'var(--accent)' },
            { label: 'Total Comments', value: comments.length, color: 'var(--gold)' },
            { label: 'Total Users', value: users.length, color: 'var(--success)' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '1.25rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: stat.color, fontFamily: 'var(--font-display)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '0.2rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.25rem',
          borderBottom: '2px solid var(--border)',
          marginBottom: '2rem',
        }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '0.75rem 1.25rem',
                background: 'none',
                border: 'none',
                borderBottom: `3px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`,
                marginBottom: '-2px',
                fontWeight: tab === t.id ? '600' : '400',
                color: tab === t.id ? 'var(--accent)' : 'var(--ink-muted)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                transition: 'all 200ms',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Posts Tab */}
        {tab === 'posts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {posts.map(post => (
              <div key={post.id} style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/blog/${post.slug}`} style={{ fontWeight: '600', color: 'var(--ink)', fontSize: '0.95rem' }}>
                    {post.title}
                  </Link>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
                    by {(post.author as any)?.name} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/dashboard/posts/${post.slug}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeletePost(post.slug)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comments Tab */}
        {tab === 'comments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {comments.map(comment => (
              <div key={comment.id} style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1.25rem 1.5rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                    <strong>{comment.user?.name}</strong> on{' '}
                    <Link href={`/blog/${comment.post?.slug}`} style={{ color: 'var(--accent)' }}>
                      {comment.post?.title}
                    </Link>
                    {' · '}{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteComment(comment.id)}>
                    Delete
                  </button>
                </div>
                <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', margin: 0 }}>
                  {comment.comment_text}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map(u => (
              <div key={u.id} style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{u.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge badge-${u.role}`}>{u.role}</span>
                  {u.id !== user?.id && (
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="form-select"
                      style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
                    >
                      <option value="viewer">viewer</option>
                      <option value="author">author</option>
                      <option value="admin">admin</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
