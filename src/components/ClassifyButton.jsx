import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

export default function ClassifyButton({ onClick, disabled, accent, endColor }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.015 } : {}}
      whileTap={!disabled ? { scale: 0.985 } : {}}
      style={{
        width: '100%',
        padding: '16px 18px',
        borderRadius: 18,
        border: !disabled ? '1px solid rgba(255,255,255,0.45)' : '1px solid rgba(17,24,39,0.10)',
        background: !disabled
          ? `linear-gradient(135deg, ${accent} 0%, ${endColor} 100%)`
          : 'rgba(17,24,39,0.06)',
        color: !disabled ? '#fff' : 'rgba(17,24,39,0.50)',
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: '0.01em',
        boxShadow: !disabled ? `0 18px 30px ${accent}2E` : 'none',
        cursor: !disabled ? 'pointer' : 'default',
      }}
    >
      Submit
    </motion.button>
  );
}

ClassifyButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  accent: PropTypes.string.isRequired,
  endColor: PropTypes.string.isRequired,
};
