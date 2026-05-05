'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Post } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';


type PostWithAuthor = Post & {
  author?: { id: string; name: string; email: string } | null;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
   const supabase = createClient();
 

  useEffect(() => {
    async function load() {
      // ✅ Use getUser() instead of getSession()
      const { data: { user:authUser}, error: authError } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser(currentUser);

      if (currentUser) {
        let query = supabase
          .from('posts')
          .select(`
            *,
            author:users!posts_author_id_fkey(id, name, email)
          `)
          .order('created_at', { ascending: false });

        if (currentUser.role !== 'admin') {
          query = query.eq('author_id', currentUser.id);
        }

        const { data: userPosts } = await query;
        setPosts((userPosts as PostWithAuthor[]) || []);
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleDeletePost = async (slug: string) => {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE' });
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.slug !== slug));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--ink-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px', borderWidth: '3px' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="container fade-up">
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2.5rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>
              Hello, {user?.name?.split(' ')[0]} 👋
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>{user?.email}</span>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
          </div>
          {(user?.role === 'author' || user?.role === 'admin') && (
            <Link href="/dashboard/posts/new" className="btn btn-primary">
              + Write New Post
            </Link>
          )}
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem',
        }}>
          {[
            { label: 'Total Posts', value: posts.length, icon: '📝' },
            { label: 'Published', value: posts.filter(p => p.published).length, icon: '✅' },
            { label: 'Total Comments', value: 'View on posts', icon: '💬' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '1.25rem 1.5rem',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Admin Link */}
        {user?.role === 'admin' && (
          <div className="alert alert-info" style={{ marginBottom: '2rem' }}>
            🛡️ You are an Admin. <Link href="/admin">Visit the Admin Panel</Link> to manage all posts and comments.
          </div>
        )}

        {/* Posts Table */}
        {(user?.role === 'author' || user?.role === 'admin') && (
          <>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.35rem' }}>
              {user.role === 'admin' ? 'All Posts' : 'Your Posts'}
            </h2>

            {posts.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: 'var(--white)',
                border: '1px dashed var(--border)',
                borderRadius: '10px',
                color: 'var(--ink-muted)',
              }}>
                <p style={{ marginBottom: '1rem' }}>No posts yet. Start writing!</p>
                <Link href="/dashboard/posts/new" className="btn btn-primary">
                  Write Your First Post
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {posts.map((post) => (
                  <div key={post.id} style={{
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link
                        href={`/blog/${post.slug}`}
                        style={{
                          fontWeight: '600',
                          color: 'var(--ink)',
                          fontSize: '0.95rem',
                          display: 'block',
                          marginBottom: '0.25rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {post.title}
                      </Link>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                        {post.created_at
                          ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                          : 'Unknown date'}
                        {user.role === 'admin' && post.author && ` · by ${post.author.name}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                      <Link href={`/dashboard/posts/${post.slug}/edit`} className="btn btn-secondary btn-sm">
                        Edit
                      </Link>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeletePost(post.slug)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Viewer dashboard */}
        {user?.role === 'viewer' && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
          }}>
            <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>👁</p>
            <h3 style={{ marginBottom: '0.5rem' }}>You're logged in as a Viewer</h3>
            <p style={{ color: 'var(--ink-muted)', marginBottom: '1.5rem' }}>
              Browse posts, read AI summaries, and leave comments.
            </p>
            <Link href="/blog" className="btn btn-primary">
              Explore Posts →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}