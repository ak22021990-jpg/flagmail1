import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { glass } from '../styles/tokens.js';

// ZoneComplete uses softer surface style
const surface = { ...glass, background: 'rgba(255,255,255,0.76)', backdropFilter: 'blur(22px) saturate(150%)', WebkitBackdropFilter: 'blur(22px) saturate(150%)', border: '1px solid rgba(255,255,255,0.82)', boxShadow: '0 24px 80px rgba(32, 52, 89, 0.10), 0 8px 24px rgba(32, 52, 89, 0.05)' };

const ZONE_META = {
  1: { label: 'Inbox', accent: '#0A84FF' },
  2: { label: 'Queue', accent: '#30B0C7' },
  3: { label: 'Escalation', accent: '#FF7A1A' },
};

const PERFORMANCE_MESSAGES = {
  1: {
    high: 'Strong start. You cut through the obvious threats cleanly.',
    mid: 'Solid opening pass. A few clear signals still slipped through.',
    low: 'This zone needed cleaner first-pass judgment before the harder rounds.',
  },
  2: {
    high: 'You handled the polished fakes well and kept the details in view.',
    mid: 'The cleaner emails created hesitation, but the pattern is there.',
    low: 'The polished messages caused trouble. Slow down and compare details.',
  },
  3: {
    high: 'Specialist-level finish. You found the subtle signals that mattered.',
    mid: 'The edge cases held up reasonably well, but a few decisive clues were missed.',
    low: 'The subtle signals proved difficult here. The final review should help.',
  },
};

function getPerformanceTier(correctCount) {
  const pct = correctCount / 5;
  if (pct >= 0.8) return 'high';
  if (pct >= 0.4) return 'mid';
  return 'low';
}

function CategoryBreakdown({ zoneEmails, accent }) {
  const categories = {};

  for (const record of zoneEmails) {
    const key = record.correctL1;
    if (!categories[key]) categories[key] = { total: 0, correct: 0 };
    categories[key].total += 1;
    if (record.l1Correct) categories[key].correct += 1;
  }

  const rows = Object.entries(categories)
    .map(([name, value]) => ({
      name,
      accuracy: value.total ? Math.round((value.correct / value.total) * 100) : 0,
      correct: value.correct,
      total: value.total,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  if (!rows.length) return null;

  return (
    <div
      style={{
        borderRadius: 24,
        padding: '18px',
        background: 'rgba(249,250,252,0.84)',
        border: '1px solid rgba(13,26,51,0.06)',
        display: 'grid',
        gap: 12,
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
        Zone Breakdown
      </div>

      {rows.map((row) => (
        <div key={row.name} style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{row.name}</span>
            <span style={{ fontSize: 13, color: 'rgba(17,24,39,0.56)' }}>
              {row.correct}/{row.total} · {row.accuracy}%
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: 'rgba(17,24,39,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${row.accuracy}%`,
                height: '100%',
                borderRadius: 999,
                background: `linear-gradient(90deg, ${accent} 0%, ${accent}AA 100%)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

ZoneComplete.propTypes = {
  zone: PropTypes.number.isRequired,
  zoneScore: PropTypes.number.isRequired,
  maxZoneScore: PropTypes.number.isRequired,
  zoneEmails: PropTypes.arrayOf(PropTypes.shape({
    l1Correct: PropTypes.bool.isRequired,
    correctL1: PropTypes.string,
  })).isRequired,
  earlyUnlocked: PropTypes.bool.isRequired,
  consecutivePerfect: PropTypes.number.isRequired,
  onContinue: PropTypes.func.isRequired,
};

export default function ZoneComplete({
  zone,
  zoneScore,
  maxZoneScore,
  zoneEmails,
  earlyUnlocked,
  consecutivePerfect,
  onContinue,
}) {
  const meta = ZONE_META[zone];
  const correctCount = zoneEmails.filter((record) => record.l1Correct).length;
  const wrongCount = zoneEmails.length - correctCount;
  const accuracy = zoneEmails.length ? Math.round((correctCount / zoneEmails.length) * 100) : 0;
  const flawless = wrongCount === 0;
  const lastZone = zone === 3;
  const performanceMessage = PERFORMANCE_MESSAGES[zone][getPerformanceTier(correctCount)];

  const stats = [
    { label: 'Zone score', value: `${zoneScore}/${maxZoneScore}` },
    { label: 'Accuracy', value: `${accuracy}%` },
    { label: 'Missed', value: `${wrongCount}` },
  ];

  return (
    <div
      style={{
        minHeight: '100dvh',
        padding: 'clamp(18px, 3vw, 28px)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @media (max-width: 920px) {
          .zone-complete-shell {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 720px) {
          .zone-complete-main,
          .zone-complete-side {
            padding: 20px !important;
            border-radius: 28px !important;
          }

          .zone-complete-stats {
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
            `radial-gradient(circle at 14% 16%, ${meta.accent}16, transparent 24%)`,
            'radial-gradient(circle at 84% 14%, rgba(255,255,255,0.72), transparent 20%)',
            flawless ? 'radial-gradient(circle at 50% 82%, rgba(52,199,89,0.12), transparent 28%)' : 'radial-gradient(circle at 50% 82%, rgba(17,24,39,0.06), transparent 28%)',
          ].join(','),
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        className="zone-complete-shell"
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          minHeight: 'calc(100dvh - (2 * clamp(18px, 3vw, 28px)))',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.08fr) minmax(320px, 0.92fr)',
          gap: 18,
          alignItems: 'stretch',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="zone-complete-main"
          style={{
            ...surface,
            borderRadius: 34,
            padding: 'clamp(24px, 3vw, 30px)',
            display: 'grid',
            gap: 18,
            alignContent: 'start',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              borderRadius: 999,
              background: `${meta.accent}12`,
              border: `1px solid ${meta.accent}24`,
              justifySelf: 'start',
              color: meta.accent,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Zone {zone} complete
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div
              style={{
                fontSize: 'clamp(40px, 6vw, 72px)',
                lineHeight: 0.92,
                letterSpacing: '-0.06em',
                fontWeight: 700,
                color: '#111827',
                maxWidth: '10ch',
              }}
            >
              {flawless ? 'Flawless pass.' : performanceMessage}
            </div>
            {!flawless && (
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: 'rgba(17,24,39,0.64)',
                  maxWidth: 620,
                }}
              >
                {performanceMessage}
              </p>
            )}
            {flawless && (
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: 'rgba(17,24,39,0.64)',
                  maxWidth: 620,
                }}
              >
                Every category call landed cleanly in this zone. Carry the same discipline into the next room.
              </p>
            )}
          </div>

          <div
            className="zone-complete-stats"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  borderRadius: 22,
                  padding: '16px',
                  background: 'rgba(255,255,255,0.84)',
                  border: '1px solid rgba(13,26,51,0.06)',
                  display: 'grid',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 30, lineHeight: 1, fontWeight: 800, letterSpacing: '-0.05em', color: '#111827' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(17,24,39,0.48)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <CategoryBreakdown zoneEmails={zoneEmails} accent={meta.accent} />
        </div>

        <div
          className="zone-complete-side"
          style={{
            ...surface,
            borderRadius: 32,
            padding: 'clamp(24px, 3vw, 28px)',
            display: 'grid',
            gap: 16,
            alignContent: 'start',
          }}
        >
          <div
            style={{
              borderRadius: 24,
              padding: '18px',
              background: `linear-gradient(180deg, ${meta.accent}14 0%, rgba(255,255,255,0.92) 100%)`,
              border: `1px solid ${meta.accent}20`,
              display: 'grid',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: meta.accent }}>
              Section summary
            </div>
            <div style={{ fontSize: 26, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.04em', color: '#111827' }}>
              {meta.label}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(17,24,39,0.64)' }}>
              {lastZone ? 'Final review is ready.' : `Next up: Zone ${zone + 1}.`}
            </div>
          </div>

          {earlyUnlocked && !lastZone && (
            <div
              style={{
                borderRadius: 22,
                padding: '16px',
                background: 'rgba(255,184,0,0.12)',
                border: '1px solid rgba(255,184,0,0.24)',
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A16207' }}>
                Early unlock
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(17,24,39,0.68)' }}>
                {consecutivePerfect} consecutive perfect rounds unlocked the next zone early.
              </div>
            </div>
          )}

          <div
            style={{
              borderRadius: 22,
              padding: '16px',
              background: 'rgba(249,250,252,0.84)',
              border: '1px solid rgba(13,26,51,0.06)',
              display: 'grid',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(17,24,39,0.48)' }}>
              What to carry forward
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55, color: 'rgba(17,24,39,0.66)' }}>
              Keep checking sender credibility, request realism, and any pressure to act before verifying.
            </div>
          </div>

          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              width: '100%',
              marginTop: 'auto',
              padding: '16px 18px',
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.36)',
              background: `linear-gradient(135deg, ${meta.accent} 0%, ${lastZone ? '#E56A00' : '#0066CC'} 100%)`,
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '0.01em',
              boxShadow: `0 18px 30px ${meta.accent}26`,
            }}
          >
            {lastZone ? 'See final results' : `Enter zone ${zone + 1}`}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
