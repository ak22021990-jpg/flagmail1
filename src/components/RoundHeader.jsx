import PropTypes from 'prop-types';
import TimerBar from './TimerBar.jsx';
import ScoreDisplay from './ScoreDisplay.jsx';
import { glass } from '../styles/tokens.js';

const surface = { ...glass, backdropFilter: 'blur(30px) saturate(165%)', WebkitBackdropFilter: 'blur(30px) saturate(165%)', border: '1px solid rgba(255,255,255,0.84)' };

function formatClock(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function RoundHeader({
  zone,
  meta,
  emailInZone,
  emailsInZone,
  phaseColor,
  timeLeft,
  phase,
  progress,
  scoreRef,
  totalScore,
}) {
  return (
    <div
      style={{
        ...surface,
        borderRadius: 30,
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(260px, 1fr) minmax(180px, 0.6fr)',
          gap: 14,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto minmax(0, 1fr)',
            gap: 14,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `${meta.accent}14`,
              border: `1px solid ${meta.accent}24`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: meta.accent,
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {zone}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: '#111827',
                }}
              >
                {meta.name}
              </span>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: `${meta.accent}12`,
                  color: meta.accent,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                Email {emailInZone} of {emailsInZone}
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'rgba(17,24,39,0.58)',
              }}
            >
              {meta.tone}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 22,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(245,248,252,0.92) 100%)',
            border: '1px solid rgba(13,26,51,0.06)',
          }}
        >
          <div style={{ display: 'grid', gap: 10 }}>
            <TimerBar timeLeft={timeLeft} phase={phase} progress={progress} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 12, color: 'rgba(17,24,39,0.48)' }}>
                Time remaining
              </div>
              <span
                className={phase === 'red' ? 'anim-timerPulse' : ''}
                style={{
                  minWidth: 62,
                  textAlign: 'right',
                  fontSize: 22,
                  lineHeight: 1,
                  fontWeight: 700,
                  color: phaseColor,
                }}
              >
                {formatClock(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        <ScoreDisplay totalScore={totalScore} scoreRef={scoreRef} />
      </div>
    </div>
  );
}

RoundHeader.propTypes = {
  zone: PropTypes.number.isRequired,
  meta: PropTypes.shape({
    name: PropTypes.string.isRequired,
    accent: PropTypes.string.isRequired,
    tone: PropTypes.string,
  }).isRequired,
  emailInZone: PropTypes.number.isRequired,
  emailsInZone: PropTypes.number.isRequired,
  phaseColor: PropTypes.string.isRequired,
  timeLeft: PropTypes.number.isRequired,
  phase: PropTypes.string,
  progress: PropTypes.number.isRequired,
  scoreRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
  totalScore: PropTypes.number.isRequired,
};
