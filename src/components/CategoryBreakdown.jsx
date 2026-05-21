import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

export default function CategoryBreakdown({ scoreLines, showDelta, points, accent }) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: '16px',
        background: 'rgba(249,250,252,0.84)',
        border: '1px solid rgba(13,26,51,0.06)',
        display: 'grid',
        gap: 10,
        position: 'relative',
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
        Score Breakdown
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {scoreLines.map((line) => (
          <div
            key={line}
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: 'rgba(17,24,39,0.68)',
            }}
          >
            {line}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showDelta && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 10,
              right: 14,
              fontSize: 14,
              fontWeight: 700,
              color: accent,
            }}
          >
            {points > 0 ? `+${points}` : '0'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

CategoryBreakdown.propTypes = {
  scoreLines: PropTypes.arrayOf(PropTypes.string).isRequired,
  showDelta: PropTypes.bool,
  points: PropTypes.number.isRequired,
  accent: PropTypes.string.isRequired,
};
