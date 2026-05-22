import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClueSystem({ clues, revealed, onReveal, disabled }) {
  const nextIndex = revealed.length;
  const hasMore = nextIndex < clues.length && !disabled;
  const remaining = clues.length - revealed.length;

  function handleHintClick() {
    if (hasMore) onReveal(nextIndex);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Revealed hints — Framer Motion staggered reveal */}
      <AnimatePresence initial={false}>
        {revealed.map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '9px 13px',
              borderRadius: 12,
              background: 'rgba(255,214,10,0.13)',
              border: '1px solid rgba(255,214,10,0.40)',
              fontSize: 12.5,
              lineHeight: 1.55,
              color: '#7A5A00',
              fontWeight: 500,
            }}
          >
            <motion.span
              initial={{ rotate: -20, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 16, delay: 0.06 }}
              style={{ fontSize: 14, flexShrink: 0, marginTop: 1, display: 'inline-block' }}
            >
              💡
            </motion.span>
            <span>{clues[i]}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Hint button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.button
          onClick={handleHintClick}
          disabled={!hasMore}
          whileHover={hasMore ? { scale: 1.03 } : {}}
          whileTap={hasMore ? { scale: 0.96 } : {}}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 16px',
            borderRadius: 20,
            border: hasMore
              ? '1.5px solid rgba(10,132,255,0.45)'
              : '1.5px solid rgba(0,0,0,0.10)',
            background: hasMore
              ? 'rgba(10,132,255,0.09)'
              : 'rgba(0,0,0,0.04)',
            color: hasMore ? '#0A84FF' : '#AEAEB2',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: hasMore ? 'pointer' : 'default',
            transition: 'background 0.18s ease, border-color 0.18s ease',
          }}
        >
          <span style={{ fontSize: 13 }}>🔍</span>
          <span>Hint</span>
          {remaining > 0 && (
            <motion.span
              key={remaining}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              style={{
                background: hasMore ? '#0A84FF' : '#C7C7CC',
                color: '#fff',
                borderRadius: 10,
                padding: '1px 8px',
                fontSize: 11,
                fontWeight: 700,
                minWidth: 20,
                textAlign: 'center',
                display: 'inline-block',
              }}
            >
              {remaining}
            </motion.span>
          )}
        </motion.button>

        <AnimatePresence mode="wait">
          {hasMore && (
            <motion.span
              key="cost"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.2 }}
              style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 500 }}
            >
              −1 pt each
            </motion.span>
          )}
          {!hasMore && revealed.length > 0 && remaining === 0 && (
            <motion.span
              key="used"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: 11, color: '#AEAEB2' }}
            >
              All hints used
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

ClueSystem.propTypes = {
  clues: PropTypes.arrayOf(PropTypes.string).isRequired,
  revealed: PropTypes.arrayOf(PropTypes.number).isRequired,
  onReveal: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};
