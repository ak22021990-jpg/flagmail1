import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { glass } from '../styles/tokens.js';

const TIPS = [
  {
    icon: '\uD83D\uDD0D',
    title: 'Read the message first',
    caption: 'Check sender, request, and pressure before classifying.',
  },
  {
    icon: '\uD83D\uDCA1',
    title: 'Use hints only when needed',
    caption: 'Each clue costs a point from your score.',
  },
  {
    icon: '\uD83D\uDDC2\uFE0F',
    title: 'Classify in two layers',
    caption: 'Pick the threat category, then refine to the subtype.',
  },
  {
    icon: '\u23F1\uFE0F',
    title: 'Lock the call in fast',
    caption: 'Enough time to think, not enough to drift.',
  },
];

// TutorialScreen uses slightly more transparent glass
const localGlass = { ...glass, background: 'rgba(255,255,255,0.72)' };

export default function TutorialScreen({ onSkip }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        padding: 'clamp(16px, 2.5vw, 28px)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .tutorial-tips-grid {
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
            'radial-gradient(circle at 12% 14%, rgba(10,132,255,0.14), transparent 24%)',
            'radial-gradient(circle at 84% 12%, rgba(52,199,89,0.12), transparent 20%)',
            'radial-gradient(circle at 50% 84%, rgba(255,149,0,0.10), transparent 24%)',
          ].join(','),
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 26 }}
        style={{
          ...localGlass,
          borderRadius: 34,
          padding: 'clamp(22px, 3vw, 34px)',
          maxWidth: 680,
          width: '100%',
          display: 'grid',
          gap: 22,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(17,24,39,0.52)',
            }}
          >
            Quick Briefing
          </div>
          <div
            style={{
              fontSize: 'clamp(28px, 3.5vw, 38px)',
              lineHeight: 1,
              letterSpacing: '-0.05em',
              fontWeight: 700,
              color: '#111827',
            }}
          >
            How this works
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'rgba(17,24,39,0.56)',
              letterSpacing: '0.02em',
            }}
          >
            15 emails &middot; 4 zones (including SOC) &middot; 120s per round
          </div>
        </div>

        <div
          className="tutorial-tips-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          {TIPS.map((tip) => (
            <div
              key={tip.title}
              style={{
                borderRadius: 22,
                padding: '16px',
                background: 'rgba(249,250,252,0.88)',
                border: '1px solid rgba(13,26,51,0.06)',
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 22, lineHeight: 1 }}>{tip.icon}</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: '#111827',
                }}
              >
                {tip.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: 'rgba(17,24,39,0.60)',
                }}
              >
                {tip.caption}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderRadius: 999,
            background: 'linear-gradient(135deg, rgba(52,199,89,0.10) 0%, rgba(255,255,255,0.90) 100%)',
            border: '1px solid rgba(52,199,89,0.18)',
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 600,
            color: 'rgba(17,24,39,0.64)',
            letterSpacing: '-0.01em',
          }}
        >
          Accuracy first. Hints second. Speed third.
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderRadius: 16,
            background: 'rgba(255,59,48,0.06)',
            border: '1px solid rgba(255,59,48,0.16)',
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: '#791F1F',
            letterSpacing: '-0.01em',
          }}
        >
          Do not move out of the screen, once the test is started as proctoring is enabled.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            onClick={onSkip}
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              border: '1px solid rgba(13,26,51,0.08)',
              background: 'rgba(255,255,255,0.78)',
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(17,24,39,0.60)',
              cursor: 'pointer',
            }}
          >
            Skip
          </button>

          <motion.button
            onClick={onSkip}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              border: '1px solid rgba(52,199,89,0.24)',
              background: 'linear-gradient(135deg, #34C759 0%, #23A345 100%)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              boxShadow: '0 16px 28px rgba(52,199,89,0.22)',
              cursor: 'pointer',
            }}
          >
            Start
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

TutorialScreen.propTypes = {
  onSkip: PropTypes.func.isRequired,
};
