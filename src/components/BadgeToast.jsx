import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Lottie from 'lottie-react';

// ── Lottie animation imports ───────────────────────────────────────────────
import LIGHTNING_READ   from '../assets/animation/LIGHTNING_READ.json';
import ON_FIRE          from '../assets/animation/ON_FIRE.json';
import ZONE_CLEAR       from '../assets/animation/ZONE_CLEAR.json';
import SNIPER           from '../assets/animation/SNIPER.json';
import BEAT_THE_CLOCK   from '../assets/animation/BEAT_THE_CLOCK.json';
import EAGLE_EYE        from '../assets/animation/EAGLE_EYE.json';
import GHOST_DETECTIVE  from '../assets/animation/GHOST_DETECTIVE.json';
import ICE_COLD         from '../assets/animation/ICE_COLD.json';
import PERFECT_EYE      from '../assets/animation/PERFECT_EYE.json';
import NO_HINTS_NEEDED  from '../assets/animation/NO_HINTS_NEEDED.json';

const LOTTIE_MAP = {
  LIGHTNING_READ, ON_FIRE, ZONE_CLEAR, SNIPER, BEAT_THE_CLOCK,
  EAGLE_EYE, GHOST_DETECTIVE, ICE_COLD, PERFECT_EYE, NO_HINTS_NEEDED,
};

// ── Confetti ───────────────────────────────────────────────────────────────
import { runConfetti } from '../utils/confetti.js';

// ── Rare badge — full-screen cinematic reveal ──────────────────────────────
function RareBadgeScreen({ badge, onDismiss }) {
  const anim = LOTTIE_MAP[badge.id];
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    return runConfetti(canvasRef.current);
  }, []);

  return (
    <motion.div
      key="rare-screen"
      role="alert"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(30,20,0,0.97) 0%, #0a0a0a 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {/* Confetti */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Radiating gold rings */}
      {[0, 0.4, 0.8].map((delay, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.2, opacity: 0.6 }}
          animate={{ scale: 4.5, opacity: 0 }}
          transition={{ duration: 2.4, ease: 'easeOut', delay, repeat: Infinity, repeatDelay: 1.2 }}
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: '50%',
            border: '2px solid rgba(255,214,10,0.55)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Content */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '0 32px' }}>

        {/* RARE label */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: 'rgba(255,214,10,0.14)',
            border: '1px solid rgba(255,214,10,0.5)',
            borderRadius: 24,
            padding: '6px 20px',
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 15 }}>🌟</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#FFD60A', letterSpacing: '0.14em' }}>
            RARE BADGE UNLOCKED
          </span>
        </motion.div>

        {/* Lottie — full-size, no card boxing it */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.18 }}
          style={{ width: 280, height: 280, margin: '0 auto 24px' }}
        >
          {anim
            ? <Lottie animationData={anim} loop={false} />
            : <span style={{ fontSize: 140, lineHeight: 1 }}>{badge.icon}</span>
          }
        </motion.div>

        {/* Badge name — large, white, no container */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, type: 'spring', stiffness: 260, damping: 22 }}
          style={{
            fontSize: 42,
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            marginBottom: 14,
            textShadow: '0 4px 32px rgba(255,214,10,0.35)',
          }}
        >
          {badge.name}
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
          style={{
            fontSize: 17,
            color: 'rgba(255,255,255,0.62)',
            lineHeight: 1.55,
            maxWidth: 340,
            margin: '0 auto 36px',
          }}
        >
          {badge.desc}
        </motion.div>

        {/* CTA — pill button, not full-width card button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.62, type: 'spring', stiffness: 300, damping: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          style={{
            padding: '14px 48px',
            borderRadius: 50,
            border: '1px solid rgba(255,214,10,0.55)',
            background: 'rgba(255,214,10,0.14)',
            color: '#FFD60A',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
            backdropFilter: 'blur(12px)',
          }}
        >
          Nice one! →
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.38 }}
          transition={{ delay: 0.9 }}
          style={{ marginTop: 20, fontSize: 12, color: '#fff' }}
        >
          or tap anywhere to continue
        </motion.p>
      </div>
    </motion.div>
  );
}

// ── Common badge — dramatic full-screen reveal ─────────────────────────────
function CommonBadgeScreen({ badge, onDismiss }) {
  const anim = LOTTIE_MAP[badge.id];
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    return runConfetti(canvasRef.current);
  }, []);

  return (
    <motion.div
      key="common-screen"
      role="alert"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 38%, rgba(0,20,45,0.96) 0%, #060c18 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {/* Confetti */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Single expanding ring */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0.5 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 1.8, ease: 'easeOut', delay: 0.1 }}
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          border: '2px solid rgba(10,132,255,0.6)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', textAlign: 'center', padding: '0 32px' }}>

        {/* BADGE UNLOCKED label */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#0A84FF',
            letterSpacing: '0.18em',
            marginBottom: 24,
            textTransform: 'uppercase',
          }}
        >
          Badge Unlocked
        </motion.div>

        {/* Lottie — no bounding card */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.14 }}
          style={{ width: 240, height: 240, margin: '0 auto 22px' }}
        >
          {anim
            ? <Lottie animationData={anim} loop={false} />
            : <span style={{ fontSize: 120, lineHeight: 1 }}>{badge.icon}</span>
          }
        </motion.div>

        {/* Badge name */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, type: 'spring', stiffness: 260, damping: 22 }}
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.025em',
            lineHeight: 1.05,
            marginBottom: 12,
          }}
        >
          {badge.name}
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.46 }}
          style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.58)',
            lineHeight: 1.55,
            maxWidth: 300,
            margin: '0 auto 32px',
          }}
        >
          {badge.desc}
        </motion.div>

        {/* CTA pill */}
        <motion.button
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.56, type: 'spring', stiffness: 300, damping: 20 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={e => { e.stopPropagation(); onDismiss(); }}
          style={{
            padding: '13px 44px',
            borderRadius: 50,
            border: '1px solid rgba(10,132,255,0.5)',
            background: 'rgba(10,132,255,0.18)',
            color: '#4DB8FF',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
            backdropFilter: 'blur(12px)',
          }}
        >
          Keep going →
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 0.85 }}
          style={{ marginTop: 18, fontSize: 12, color: '#fff' }}
        >
          or tap anywhere to continue
        </motion.p>
      </div>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function BadgeToast({ badge, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (badge) {
      setVisible(true);
      const duration = badge.rare ? 10000 : 8000;
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, duration);
      return () => clearTimeout(t);
    }
  }, [badge, onDismiss]);

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }

  return (
    <AnimatePresence>
      {badge && visible && (
        badge.rare
          ? <RareBadgeScreen badge={badge} onDismiss={handleDismiss} />
          : <CommonBadgeScreen badge={badge} onDismiss={handleDismiss} />
      )}
    </AnimatePresence>
  );
}
