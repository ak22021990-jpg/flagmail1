import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getProgressTitle } from '../utils/competency.js';
import { glass } from '../styles/tokens.js';

// Leaderboard uses softer surface style
const surface = { ...glass, background: 'rgba(255,255,255,0.76)', backdropFilter: 'blur(22px) saturate(150%)', WebkitBackdropFilter: 'blur(22px) saturate(150%)', border: '1px solid rgba(255,255,255,0.82)', boxShadow: '0 24px 80px rgba(32, 52, 89, 0.10), 0 8px 24px rgba(32, 52, 89, 0.05)' };

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export default function Leaderboard({ playerName, playerScore, entries, loading, error, onFetch, onBack }) {
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      onFetch();
    }
  }, [onFetch]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        padding: 'clamp(18px, 2.8vw, 28px)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        position: 'relative',
      }}
    >
      <style>{`
        @media (max-width: 760px) {
          .leaderboard-header,
          .leaderboard-row,
          .leaderboard-head {
            grid-template-columns: 44px minmax(0, 1fr) 70px !important;
          }

          .leaderboard-date {
            display: none !important;
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: [
            'radial-gradient(circle at 12% 14%, rgba(10,132,255,0.12), transparent 24%)',
            'radial-gradient(circle at 86% 12%, rgba(255,149,0,0.10), transparent 20%)',
          ].join(','),
        }}
      />

      <div style={{ maxWidth: 920, margin: '0 auto', position: 'relative', zIndex: 1, display: 'grid', gap: 16 }}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{
            ...surface,
            borderRadius: 30,
            padding: '18px 20px',
          }}
        >
          <div
            className="leaderboard-header"
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0, 1fr) auto',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <button
              onClick={onBack}
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: '1px solid rgba(13,26,51,0.08)',
                background: 'rgba(255,255,255,0.82)',
                color: 'rgba(17,24,39,0.64)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Back
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(17,24,39,0.46)', marginBottom: 6 }}>
                Global leaderboard
              </div>
              <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.05em', color: '#111827' }}>
                See where your judgment lands.
              </div>
            </div>

            <div
              style={{
                justifySelf: 'end',
                padding: '8px 12px',
                borderRadius: 999,
                background: 'rgba(10,132,255,0.10)',
                color: '#0A84FF',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              All time
            </div>
          </div>
        </motion.div>

        {loading && (
          <div style={{ ...surface, borderRadius: 28, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 15, color: 'rgba(17,24,39,0.62)' }}>Loading leaderboard…</div>
          </div>
        )}

        {error && (
          <div style={{ ...surface, borderRadius: 28, padding: 24, display: 'grid', gap: 12 }}>
            <div style={{ fontSize: 15, color: '#FF3B30', fontWeight: 700 }}>{error}</div>
            <button
              onClick={onFetch}
              style={{
                justifySelf: 'start',
                padding: '12px 16px',
                borderRadius: 14,
                border: '1px solid rgba(10,132,255,0.22)',
                background: 'linear-gradient(135deg, #0A84FF 0%, #0066CC 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Retry fetch
            </button>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div style={{ ...surface, borderRadius: 28, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>No scores yet.</div>
            <div style={{ fontSize: 14, color: 'rgba(17,24,39,0.60)' }}>Complete the assessment to become the first ranked analyst.</div>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{ ...surface, borderRadius: 30, overflow: 'hidden' }}
          >
            <div
              className="leaderboard-head"
              style={{
                display: 'grid',
                gridTemplateColumns: '56px minmax(0, 1fr) 86px 110px',
                gap: 12,
                padding: '14px 18px',
                borderBottom: '1px solid rgba(13,26,51,0.06)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(17,24,39,0.46)',
              }}
            >
              <div>Rank</div>
              <div>Analyst</div>
              <div style={{ textAlign: 'right' }}>Score</div>
              <div className="leaderboard-date" style={{ textAlign: 'right' }}>Date</div>
            </div>

            {entries.map((entry, index) => {
              const isCurrentPlayer = entry.name === playerName && entry.score === playerScore;
              const rank = index + 1;

              return (
                <motion.div
                  key={`${entry.name}-${entry.score}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.24, ease: 'easeOut' }}
                  className="leaderboard-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '56px minmax(0, 1fr) 86px 110px',
                    gap: 12,
                    padding: '16px 18px',
                    alignItems: 'center',
                    borderBottom: index < entries.length - 1 ? '1px solid rgba(13,26,51,0.05)' : 'none',
                    background: isCurrentPlayer ? 'rgba(10,132,255,0.06)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      background: rank <= 3 ? 'rgba(255,214,10,0.12)' : 'rgba(17,24,39,0.06)',
                      color: rank <= 3 ? '#A16207' : 'rgba(17,24,39,0.54)',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {rank}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isCurrentPlayer ? '#0A84FF' : '#111827' }}>
                      {entry.name}{isCurrentPlayer ? ' (You)' : ''}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(17,24,39,0.50)' }}>
                      {entry.title || getProgressTitle(entry.score)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: '#111827' }}>
                    {entry.score}
                  </div>

                  <div className="leaderboard-date" style={{ textAlign: 'right', fontSize: 12, color: 'rgba(17,24,39,0.50)' }}>
                    {formatDate(entry.date)}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
