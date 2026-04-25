'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '9',
        ...(search && { search }),
      });
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div style={{ padding: '3rem 0 4rem' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>The Blog</h1>
          <p style={{ color: 'var(--ink-muted)' }}>
            {pagination.total} {pagination.total === 1 ? 'story' : 'stories'} published
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{
          display: 'flex',
          gap: '0.75rem',
          maxWidth: '480px',
          margin: '0 auto 3rem',
        }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
            >
              Clear
            </button>
          )}
        </form>

        {search && (
          <p style={{ textAlign: 'center', color: 'var(--ink-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Showing results for "<strong>{search}</strong>"
          </p>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem', width: '32px', height: '32px', borderWidth: '3px' }} />
            <p>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-muted)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>✦</p>
            <h3>No posts found</h3>
            <p>{search ? 'Try a different search term.' : 'Be the first to publish a post!'}</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.75rem',
          }}>
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${p === page ? 'active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}

            <button
              className="page-btn"
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, index }: { post: Post; index: number }) {
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
      <article
        className="card fade-up"
        style={{ animationDelay: `${index * 60}ms`, height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Featured Image */}
        {post.image_url ? (
          <div style={{ position: 'relative', height: '200px', overflow: 'hidden', background: 'var(--cream-dark)' }}>
            <img
              src={post.image_url}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>
        ) : (
          <div style={{
            height: '200px',
            background: 'linear-gradient(135deg, var(--cream-dark), var(--cream-darker))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            color: 'var(--border)',
          }}>
            ✦
          </div>
        )}

        <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--accent)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: '700',
              flexShrink: 0,
            }}>
              {post.author?.name?.charAt(0).toUpperCase()}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
              {post.author?.name} ·{' '}
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.2rem',
            fontWeight: '600',
            marginBottom: '0.75rem',
            color: 'var(--ink)',
            lineHeight: '1.35',
          }}>
            {post.title}
          </h2>

          {/* AI Summary */}
          {post.summary && (
            <div style={{
              fontSize: '0.875rem',
              color: 'var(--ink-muted)',
              lineHeight: '1.6',
              flex: 1,
              marginBottom: '1rem',
            }}>
              {post.summary.slice(0, 160)}{post.summary.length > 160 ? '...' : ''}
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)',
            marginTop: 'auto',
          }}>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: '600',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}>
              AI Summary ✦
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              Read more →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
