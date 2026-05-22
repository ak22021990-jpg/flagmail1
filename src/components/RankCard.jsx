import PropTypes from 'prop-types';
import { getProgressTitle } from '../utils/competency.js';

export default function RankCard({ player, finalScore }) {
  const safePlayer = player ?? { name: 'Analyst' };
  const safeScore = Number.isFinite(finalScore) ? finalScore : 0;
  const title = getProgressTitle(safeScore);
  const accent = safeScore >= 80 ? '#FF3B30' : safeScore >= 50 ? '#FF9500' : '#34C759';
  const eyebrow = safeScore >= 80 ? 'Advanced analyst' : safeScore >= 50 ? 'Developing analyst' : 'Foundation analyst';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.76)',
        backdropFilter: 'blur(22px) saturate(150%)',
        WebkitBackdropFilter: 'blur(22px) saturate(150%)',
        border: '1px solid rgba(255,255,255,0.82)',
        borderRadius: 26,
        boxShadow: '0 24px 80px rgba(32, 52, 89, 0.10), 0 8px 24px rgba(32, 52, 89, 0.05)',
        padding: 24,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(circle at 18% 18%, ${accent}16, transparent 24%)`,
        }}
      />

      <div style={{ position: 'relative', display: 'grid', gap: 18 }}>
        <div
          style={{
            display: 'inline-flex',
            justifySelf: 'start',
            padding: '8px 14px',
            borderRadius: 999,
            background: `${accent}12`,
            border: `1px solid ${accent}22`,
            color: accent,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>

        <div>
          <div style={{ fontSize: 32, lineHeight: 0.98, fontWeight: 700, letterSpacing: '-0.05em', color: '#111827', marginBottom: 8 }}>
            {safePlayer.name}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(17,24,39,0.60)', lineHeight: 1.55 }}>
            Final score based on classification accuracy, subcategory precision, and clue usage.
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(17,24,39,0.46)', marginBottom: 6 }}>
              Competency tier
            </div>
            <div style={{ fontSize: 24, lineHeight: 1, fontWeight: 800, letterSpacing: '-0.04em', color: accent }}>
              {title}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, color: '#111827' }}>
            <span style={{ fontSize: 62, lineHeight: 0.92, fontWeight: 800, letterSpacing: '-0.06em' }}>{safeScore}</span>
            <span style={{ fontSize: 22, fontWeight: 600, color: 'rgba(17,24,39,0.30)' }}>/100</span>
          </div>
        </div>

        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: 'rgba(17,24,39,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(100, safeScore))}%`,
              height: '100%',
              borderRadius: 999,
              background: `linear-gradient(90deg, ${accent} 0%, ${accent}AA 100%)`,
            }}
          />
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: '14px',
            background: 'rgba(255,255,255,0.84)',
            border: '1px solid rgba(13,26,51,0.06)',
            display: 'grid',
            gap: 6,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(17,24,39,0.46)' }}>
            Assessment
          </div>
          <div style={{ fontSize: 18, lineHeight: 1.1, fontWeight: 700, letterSpacing: '-0.03em', color: '#111827' }}>
            Flagmail
          </div>
        </div>
      </div>
    </div>
  );
}

RankCard.propTypes = {
  player: PropTypes.shape({ name: PropTypes.string }),
  finalScore: PropTypes.number,
};
