import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";

export default function HintPanel({ hints, revealedCount, onReveal }) {
  const hasMore = revealedCount < hints.length;

  return (
    <div style={{
      borderRadius: 22, padding: 16,
      background: "rgba(10,132,255,0.06)", border: "1px solid rgba(10,132,255,0.18)",
      display: "grid", gap: 10,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(10,132,255,0.70)" }}>
        Hints
      </div>

      <AnimatePresence initial={false}>
        {hints.slice(0, revealedCount).map((hint, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            style={{
              padding: "10px 13px", borderRadius: 12,
              background: "rgba(10,132,255,0.09)",
              border: "1px solid rgba(10,132,255,0.20)",
              fontSize: 12.5, lineHeight: 1.55, color: "#0A84FF", fontWeight: 500,
            }}
          >
            {hint}
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.button
        onClick={onReveal}
        disabled={!hasMore}
        whileHover={hasMore ? { scale: 1.02 } : {}}
        whileTap={hasMore ? { scale: 0.97 } : {}}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 14,
          fontSize: 13, fontWeight: 600,
          border: hasMore
            ? "1.5px solid rgba(10,132,255,0.35)"
            : "1.5px solid rgba(0,0,0,0.08)",
          background: hasMore
            ? "rgba(10,132,255,0.10)"
            : "rgba(0,0,0,0.03)",
          color: hasMore ? "#0A84FF" : "#AEAEB2",
          cursor: hasMore ? "pointer" : "default",
        }}
      >
        {hasMore ? `Get a hint (${hints.length - revealedCount} left)` : "No more hints"}
      </motion.button>
    </div>
  );
}

HintPanel.propTypes = {
  hints: PropTypes.arrayOf(PropTypes.string).isRequired,
  revealedCount: PropTypes.number.isRequired,
  onReveal: PropTypes.func.isRequired,
};
