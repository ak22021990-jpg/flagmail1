import { motion } from 'framer-motion';

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

const shell = {
  background: 'rgba(255,255,255,0.74)',
  backdropFilter: 'blur(24px) saturate(155%)',
  WebkitBackdropFilter: 'blur(24px) saturate(155%)',
  border: '1px solid rgba(255,255,255,0.84)',
  boxShadow: '0 24px 80px rgba(32,52,89,0.10), 0 8px 24px rgba(32,52,89,0.05)',
};

export default function TutorialScreen({ onSkip }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        padding: 'clamp(16px, 2.5vw, 28px)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
        display: 'grid',
        placeItems: 'center',
        position: 'relative',
      }}
    >
      <style>{`
        @media (max-width: 600px) {
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

      <button
        onClick={onSkip}
        style={{
          position: 'absolute',
          top: 20,
          right: 22,
          zIndex: 2,
          padding: '4px 0',
          border: 'none',
          background: 'transparent',
          color: 'rgba(17,24,39,0.44)',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        Skip tutorial
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 26 }}
        style={{
          ...shell,
          maxWidth: 580,
          width: '100%',
          borderRadius: 32,
          padding: 'clamp(22px, 3vw, 32px)',
          display: 'grid',
          gap: 20,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(17,24,39,0.52)',
              marginBottom: 8,
            }}
          >
            Quick Briefing
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(26px, 4vw, 36px)',
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: '#111827',
            }}
          >
            How to play FlagMail
          </h1>
        </div>

        <div
          className="tutorial-tips-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          {TIPS.map((tip, i) => (
            <motion.div
              key={tip.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.28 }}
              style={{
                borderRadius: 20,
                padding: '14px 16px',
                background: 'rgba(249,250,252,0.84)',
                border: '1px solid rgba(13,26,51,0.06)',
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ fontSize: 24, lineHeight: 1 }}>{tip.icon}</div>
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
                  color: 'rgba(17,24,39,0.58)',
                }}
              >
                {tip.caption}
              </div>
            </motion.div>
          ))}
        </div>

        <div
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'rgba(17,24,39,0.50)',
            letterSpacing: '-0.01em',
          }}
        >
          15 emails &middot; 3 zones &middot; 180s per round
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'center',
            justifySelf: 'center',
            padding: '8px 18px',
            borderRadius: 999,
            background: 'linear-gradient(180deg, rgba(52,199,89,0.10) 0%, rgba(255,255,255,0.90) 100%)',
            border: '1px solid rgba(52,199,89,0.18)',
            fontSize: 14,
            fontWeight: 600,
            color: '#1F8A49',
            letterSpacing: '-0.01em',
          }}
        >
          Accuracy first. Hints second. Speed third.
        </div>

        <motion.button
          onClick={onSkip}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          style={{
            width: '100%',
            padding: '16px 18px',
            borderRadius: 18,
            border: '1px solid rgba(52,199,89,0.24)',
            background: 'linear-gradient(135deg, #34C759 0%, #23A345 100%)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.01em',
            boxShadow: '0 18px 30px rgba(52,199,89,0.22)',
            cursor: 'pointer',
          }}
        >
          Start
        </motion.button>
      </motion.div>
    </div>
  );
}
