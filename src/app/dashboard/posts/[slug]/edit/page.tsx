'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/types/database';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function load() {
      // Check auth
      const { data: { user:authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/auth/login'); return; }

      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();

      if (!user || !['author', 'admin'].includes(user.role)) {
        router.push('/dashboard');
        return;
      }

      // Fetch post
      const res = await fetch(`/api/posts/${params.slug}`);
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
        setTitle(data.post.title);
        setBody(data.post.body);
        setImageUrl(data.post.image_url || '');
      }
      setFetching(false);
    }
    load();
  }, [params.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await fetch(`/api/posts/${params.slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        image_url: imageUrl.trim() || null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/blog/${data.post.slug}`);
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to update post');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <div className="spinner" style={{ margin: '0 auto', width: '32px', height: '32px', borderWidth: '3px' }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem' }}>
        <h2>Post not found</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 0 5rem' }}>
      <div className="content-container fade-up">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.4rem' }}>Edit Post</h1>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>
            Note: Editing does not regenerate the AI summary (cost optimization).
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ fontSize: '1.1rem' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Featured Image URL</label>
            <input
              type="url"
              className="form-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg (optional)"
            />
            {imageUrl && (
              <div style={{ marginTop: '0.75rem', borderRadius: '8px', overflow: 'hidden', maxHeight: '240px' }}>
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{ width: '100%', height: '240px', objectFit: 'cover' }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Content *</label>
            <textarea
              className="form-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={20}
              style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
            />
          </div>

          {body && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                Preview
              </label>
              <div
                className="prose"
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  maxHeight: '400px',
                  overflow: 'auto',
                }}
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: '16px', height: '16px' }} /> Saving...</> : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => router.back()} disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
