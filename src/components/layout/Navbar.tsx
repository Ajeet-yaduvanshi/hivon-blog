'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/types/database';

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      // ✅ Fix: use authUser directly, not session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(data);
      }
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(data);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 'var(--nav-height)',
      background: 'rgba(247, 244, 239, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border)',
      zIndex: 100,
    }}>
      <div className="container" style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          fontWeight: '700',
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
        }}>
          Hivon<span style={{ color: 'var(--accent)' }}>.</span>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/blog" style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', fontWeight: '500' }}>
            Blog
          </Link>

          {user ? (
            <>
              <Link href="/dashboard" style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', fontWeight: '500' }}>
                Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" style={{ color: 'var(--gold)', fontSize: '0.9rem', fontWeight: '500' }}>
                  Admin
                </Link>
              )}
              {(user.role === 'author' || user.role === 'admin') && (
                <Link href="/dashboard/posts/new" className="btn btn-primary btn-sm">
                  Write Post
                </Link>
              )}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'none', border: '1.5px solid var(--border)',
                    borderRadius: '6px', padding: '0.35rem 0.75rem',
                    cursor: 'pointer', color: 'var(--ink-soft)',
                    fontSize: '0.88rem', fontWeight: '500',
                  }}
                >
                  <span style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'var(--accent)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: '700', flexShrink: 0,
                  }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                  {user.name?.split(' ')[0]}
                </button>

                {menuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'var(--white)', border: '1px solid var(--border)',
                    borderRadius: '8px', boxShadow: 'var(--shadow-md)',
                    minWidth: '180px', overflow: 'hidden', zIndex: 200,
                  }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{user.email}</div>
                      <span className={`badge badge-${user.role}`}>{user.role}</span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      style={{ display: 'block', padding: '0.65rem 1rem', color: 'var(--ink-soft)', fontSize: '0.9rem' }}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); handleLogout(); }}
                      style={{
                        width: '100%', textAlign: 'left',
                        padding: '0.65rem 1rem', background: 'none',
                        border: 'none', color: 'var(--error)',
                        fontSize: '0.9rem', cursor: 'pointer',
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', fontWeight: '500' }}>
                Sign In
              </Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
