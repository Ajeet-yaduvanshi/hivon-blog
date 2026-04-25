import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section style={{
        padding: '5rem 0 4rem',
        background: 'linear-gradient(160deg, var(--cream) 0%, var(--cream-dark) 100%)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Decorative lines */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 80px, var(--border) 80px, var(--border) 81px)',
          opacity: 0.3,
          pointerEvents: 'none',
        }} />

        <div className="container fade-up" style={{ position: 'relative', textAlign: 'center' }}>
          <p style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: '1.25rem',
          }}>
            A space for ideas
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 7vw, 5rem)',
            fontWeight: '700',
            lineHeight: '1.08',
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
            color: 'var(--ink)',
          }}>
            Stories that matter.<br />
            <em style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Voices that inspire.</em>
          </h1>
          <p style={{
            fontSize: '1.15rem',
            color: 'var(--ink-muted)',
            maxWidth: '520px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.7',
          }}>
            A curated blogging platform where authors share deep insights,
            AI-powered summaries help you read smarter, and every voice counts.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/blog" className="btn btn-primary btn-lg">
              Explore Stories →
            </Link>
            <Link href="/auth/register" className="btn btn-secondary btn-lg">
              Start Writing
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}>
            {[
              {
                icon: '✦',
                title: 'AI-Powered Summaries',
                desc: 'Every post gets a Google Gemini-generated 200-word summary so you can decide what to read in depth.',
                color: 'var(--accent)',
              },
              {
                icon: '◈',
                title: 'Role-Based Access',
                desc: 'Three distinct roles — Authors write, Viewers read & comment, Admins moderate — with proper permissions throughout.',
                color: 'var(--gold)',
              },
              {
                icon: '◉',
                title: 'Thoughtful Design',
                desc: 'Clean, distraction-free reading experience with search, pagination, and a focus on the content that matters.',
                color: 'var(--success)',
              },
            ].map((feature) => (
              <div key={feature.title} className="card card-body fade-up">
                <div style={{
                  fontSize: '1.75rem',
                  marginBottom: '1rem',
                  color: feature.color,
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{feature.title}</h3>
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', lineHeight: '1.65' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '4rem 0',
        background: 'var(--ink)',
        color: 'var(--cream)',
        textAlign: 'center',
      }}>
        <div className="container">
          <h2 style={{
            color: 'var(--cream)',
            marginBottom: '1rem',
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
          }}>
            Ready to share your story?
          </h2>
          <p style={{ color: 'var(--cream-darker)', marginBottom: '2rem' }}>
            Join as an Author and publish your first post in minutes.
          </p>
          <Link href="/auth/register" className="btn btn-primary btn-lg">
            Create Your Account
          </Link>
        </div>
      </section>
    </>
  );
}
