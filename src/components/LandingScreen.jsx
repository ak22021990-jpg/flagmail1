import { useState } from 'react';
import { motion } from 'framer-motion';

const glass = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(28px) saturate(165%)',
  WebkitBackdropFilter: 'blur(28px) saturate(165%)',
  border: '1px solid rgba(255,255,255,0.86)',
  boxShadow: '0 24px 80px rgba(32, 52, 89, 0.11), 0 8px 24px rgba(32, 52, 89, 0.06)',
};

const ZONE_CARDS = [
  { zone: 1, title: 'Inbox',      detail: 'Spot the loud red flags fast and build your rhythm.',               accent: '#0A84FF' },
  { zone: 2, title: 'Queue',      detail: 'The copy gets cleaner here. Trust the details, not the polish.',   accent: '#30B0C7' },
  { zone: 3, title: 'Escalation', detail: 'One subtle inconsistency is usually the whole story.',             accent: '#FF7A1A' },
];

const STATS = [
  { value: '15', label: 'emails' },
  { value: '3', label: 'zones' },
  { value: '120s', label: 'per round' },
];

export default function LandingScreen({ onStart }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Both fields are required to begin.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    onStart(name.trim(), email.trim());
  }

  const inputStyle = (field) => ({
    width: '100%',
    padding: '14px 16px',
    borderRadius: 16,
    border: focusedField === field
      ? '1.5px solid rgba(10,132,255,0.6)'
      : '1.5px solid rgba(13,26,51,0.08)',
    background: focusedField === field
      ? 'rgba(255,255,255,0.92)'
      : 'rgba(249,250,252,0.88)',
    fontSize: 15,
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease',
    boxShadow: focusedField === field
      ? '0 0 0 4px rgba(10,132,255,0.10)'
      : 'none',
  });

  return (
    <div
      className="landing-screen"
      style={{
        minHeight: '100dvh',
        padding: 'clamp(16px, 2.8vw, 32px)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
        position: 'relative',
        overflowY: 'auto',
      }}
    >
      <style>{`
        @media (max-width: 1080px) {
          .landing-shell {
            grid-template-columns: minmax(0, 1fr) !important;
            max-width: 860px !important;
          }
        }

        @media (max-width: 720px) {
          .landing-root {
            min-height: auto !important;
          }

          .landing-card {
            padding: 22px !important;
          }

          .landing-stats,
          .landing-zones {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: [
            'radial-gradient(circle at 16% 20%, rgba(10,132,255,0.14), transparent 28%)',
            'radial-gradient(circle at 84% 16%, rgba(255,122,26,0.13), transparent 24%)',
            'radial-gradient(circle at 50% 80%, rgba(48,176,199,0.10), transparent 32%)',
          ].join(','),
        }}
      />

      <motion.div
        className="landing-root"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 28 }}
        style={{
          width: '100%',
          maxWidth: 1220,
          minHeight: 'calc(100dvh - (2 * clamp(16px, 2.8vw, 32px)))',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          className="landing-shell"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.08fr) minmax(360px, 0.92fr)',
            gap: 20,
            alignItems: 'stretch',
            width: '100%',
          }}
        >
          <motion.div
            className="landing-card"
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06, duration: 0.4 }}
            style={{
              ...glass,
              borderRadius: 34,
              padding: 'clamp(24px, 2.8vw, 34px)',
              display: 'grid',
              gap: 22,
              alignContent: 'space-between',
            }}
          >
            <div style={{ display: 'grid', gap: 18 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(13,26,51,0.07)',
                  justifySelf: 'start',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'linear-gradient(180deg, #0A84FF 0%, #0066CC 100%)',
                    boxShadow: '0 0 0 6px rgba(10,132,255,0.12)',
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(17,24,39,0.62)',
                  }}
                >
                  Flagmail Assessment
                </span>
              </div>

              <div style={{ display: 'grid', gap: 12, maxWidth: 680 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: 'rgba(17,24,39,0.48)',
                  }}
                >
                  Sharpen Judgment, Not Just Recall
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: 'clamp(42px, 5.4vw, 68px)',
                    lineHeight: 0.96,
                    letterSpacing: '-0.05em',
                    color: '#111827',
                    fontWeight: 700,
                    maxWidth: '13.5ch',
                    textWrap: 'balance',
                  }}
                >
                  Prove your judgment against real email threats.
                </h1>

                <p
                  style={{
                    margin: 0,
                    fontSize: 'clamp(15px, 1.5vw, 18px)',
                    lineHeight: 1.55,
                    color: 'rgba(17,24,39,0.68)',
                    maxWidth: 620,
                  }}
                >
                  15 timed scenarios across 3 escalating zones. Each decision is scored, reviewed, and translated into a competency tier.
                </p>
              </div>

              <div
                className="landing-stats"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 12,
                }}
              >
                {STATS.map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: 'rgba(255,255,255,0.82)',
                      border: '1px solid rgba(13,26,51,0.06)',
                      borderRadius: 22,
                      padding: '14px 16px 12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        letterSpacing: '-0.04em',
                        color: '#111827',
                        lineHeight: 1,
                      }}
                    >
                      {stat.value}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        lineHeight: 1.4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'rgba(17,24,39,0.54)',
                        marginTop: 6,
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                  color: 'rgba(17,24,39,0.52)',
                }}
              >
                What you'll face
              </div>

              <div
                className="landing-zones"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 12,
                }}
              >
                {ZONE_CARDS.map((card) => (
                  <div
                    key={card.zone}
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 24,
                      padding: '16px',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(244,247,252,0.94) 100%)',
                      border: '1px solid rgba(13,26,51,0.06)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: '0 auto 0 0',
                        width: 4,
                        background: card.accent,
                        opacity: 0.7,
                        borderRadius: '4px 0 0 4px',
                      }}
                    />
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: card.accent,
                        marginBottom: 10,
                      }}
                    >
                      {card.zone}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        color: '#111827',
                        marginBottom: 6,
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.45,
                        color: 'rgba(17,24,39,0.62)',
                      }}
                    >
                      {card.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="landing-card"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
            style={{
              ...glass,
              borderRadius: 32,
              padding: 'clamp(24px, 2.6vw, 30px)',
              display: 'grid',
              gap: 18,
              alignContent: 'start',
            }}
          >
            <div style={{ display: 'grid', gap: 10 }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  fontWeight: 700,
                  color: 'rgba(17,24,39,0.52)',
                }}
              >
                Your Details
              </div>
              <div
                style={{
                  fontSize: 'clamp(28px, 2.7vw, 38px)',
                  fontWeight: 700,
                  letterSpacing: '-0.05em',
                  color: '#111827',
                  lineHeight: 0.98,
                }}
              >
                Begin the assessment
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: 'rgba(17,24,39,0.66)',
                  maxWidth: 420,
                }}
              >
                Enter your details to begin. Your name and email are used to record the final assessment result.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: 8,
                    letterSpacing: '0.02em',
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Your full name"
                  style={inputStyle('name')}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: 8,
                    letterSpacing: '0.02em',
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  style={inputStyle('email')}
                />
              </div>

              {error && (
                <p
                  style={{
                    fontSize: 12,
                    color: '#FF3B30',
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  marginTop: 4,
                  padding: '15px 18px',
                  borderRadius: 18,
                  border: '1px solid rgba(10,132,255,0.32)',
                  background: 'linear-gradient(135deg, #0A84FF 0%, #0066CC 100%)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  boxShadow: '0 18px 32px rgba(10,132,255,0.22)',
                }}
              >
                Start Assessment
              </button>
            </form>

            <div
              style={{
                borderRadius: 24,
                background: 'rgba(249,250,252,0.78)',
                border: '1px solid rgba(13,26,51,0.06)',
                padding: '16px',
                display: 'grid',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(17,24,39,0.48)',
                }}
              >
                Assessment flow
              </div>
              {[
                'Enter your details and start the assessment.',
                'Classify each email in a timed round.',
                'Receive your competency result.',
              ].map((line, index) => (
                <div
                  key={line}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px minmax(0, 1fr)',
                    gap: 10,
                    alignItems: 'start',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: 'rgba(17,24,39,0.06)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#111827',
                    }}
                  >
                    {index + 1}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.45,
                      color: 'rgba(17,24,39,0.64)',
                    }}
                  >
                    {line}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
