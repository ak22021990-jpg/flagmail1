import PropTypes from 'prop-types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const modalSurface = {
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(24px) saturate(150%)',
  WebkitBackdropFilter: 'blur(24px) saturate(150%)',
  border: '1px solid rgba(255,255,255,0.82)',
  boxShadow: '0 28px 90px rgba(17, 24, 39, 0.26)',
};

export default function ReasoningModal({ email, l1WasCorrect, onComplete }) {
  const [selected, setSelected] = useState(null);
  const [showPlus, setShowPlus] = useState(false);

  const question = l1WasCorrect
    ? (email.reasoningQuestion || `Why is this "${email.level1}"?`)
    : `The correct category was "${email.level1}". Why?`;

  const options = email.reasoningOptions || [];

  function handleConfirm() {
    if (selected === null) return;
    const correct = selected === email.correctReason;
    if (correct) {
      setShowPlus(true);
      setTimeout(() => onComplete({ skipped: false, selectedIndex: selected, correct }), 600);
      return;
    }
    onComplete({ skipped: false, selectedIndex: selected, correct });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1500,
        display: 'grid',
        placeItems: 'center',
        padding: '24px 16px',
        background: 'rgba(17,24,39,0.42)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        style={{
          ...modalSurface,
          width: '100%',
          maxWidth: 620,
          borderRadius: 30,
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: [
              'radial-gradient(circle at 14% 18%, rgba(10,132,255,0.10), transparent 24%)',
              'radial-gradient(circle at 84% 16%, rgba(52,199,89,0.08), transparent 20%)',
            ].join(','),
          }}
        />

        <AnimatePresence>
          {showPlus && (
            <motion.div
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -30, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.48, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: 18,
                right: 22,
                fontSize: 24,
                fontWeight: 800,
                color: '#34C759',
                pointerEvents: 'none',
              }}
            >
              +1
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ position: 'relative', display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(17,24,39,0.46)',
              }}
            >
              Reasoning Check · +1 pt
            </div>
            <div
              style={{
                fontSize: 'clamp(24px, 3vw, 32px)',
                lineHeight: 1.08,
                letterSpacing: '-0.04em',
                fontWeight: 700,
                color: '#111827',
                maxWidth: 520,
              }}
            >
              {question}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.55,
                color: 'rgba(17,24,39,0.62)',
                maxWidth: 470,
              }}
            >
              Pick the best explanation for the category call. This adds one point only if your reasoning is correct.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {options.map((option, index) => {
              const isSelected = selected === index;
              return (
                <button
                  key={option}
                  onClick={() => setSelected(index)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: 18,
                    border: isSelected ? '1.5px solid rgba(10,132,255,0.42)' : '1px solid rgba(13,26,51,0.08)',
                    background: isSelected
                      ? 'linear-gradient(180deg, rgba(10,132,255,0.10) 0%, rgba(255,255,255,0.96) 100%)'
                      : 'rgba(255,255,255,0.82)',
                    boxShadow: isSelected ? '0 14px 28px rgba(10,132,255,0.10)' : 'none',
                    display: 'grid',
                    gridTemplateColumns: '20px minmax(0, 1fr)',
                    gap: 12,
                    alignItems: 'start',
                    color: '#111827',
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: isSelected ? '6px solid #0A84FF' : '1.5px solid rgba(17,24,39,0.22)',
                      marginTop: 1,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 15,
                      lineHeight: 1.5,
                      fontWeight: isSelected ? 600 : 500,
                    }}
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 10 }}>
            <button
              onClick={() => onComplete({ skipped: true })}
              style={{
                padding: '14px 16px',
                borderRadius: 16,
                border: '1px solid rgba(13,26,51,0.08)',
                background: 'rgba(255,255,255,0.78)',
                fontSize: 14,
                fontWeight: 600,
                color: 'rgba(17,24,39,0.68)',
              }}
            >
              Skip reasoning
            </button>

            <button
              onClick={handleConfirm}
              disabled={selected === null}
              style={{
                padding: '14px 16px',
                borderRadius: 16,
                border: '1px solid rgba(10,132,255,0.22)',
                background: selected === null
                  ? 'rgba(17,24,39,0.10)'
                  : 'linear-gradient(135deg, #0A84FF 0%, #0066CC 100%)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: selected === null ? 'none' : '0 16px 28px rgba(10,132,255,0.24)',
                cursor: selected === null ? 'default' : 'pointer',
              }}
            >
              Confirm answer
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

ReasoningModal.propTypes = {
  email: PropTypes.shape({
    reasoningQuestion: PropTypes.string,
    level1: PropTypes.string.isRequired,
    reasoningOptions: PropTypes.arrayOf(PropTypes.string),
    correctReason: PropTypes.number.isRequired,
  }).isRequired,
  l1WasCorrect: PropTypes.bool.isRequired,
  onComplete: PropTypes.func.isRequired,
};
