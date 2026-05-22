import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { BADGES } from '../hooks/useBadges.js';

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

export default function BadgeCollection({ earned }) {
  const all = Object.values(BADGES);
  const common = all.filter(b => !b.rare);
  const rare = all.filter(b => b.rare);

  function BadgeChip({ badge, index }) {
    const isEarned = earned.includes(badge.id);
    const anim = LOTTIE_MAP[badge.id];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 8 }}
        animate={{ opacity: isEarned ? 1 : 0.38, scale: 1, y: 0 }}
        transition={{ delay: index * 0.06, type: 'spring', stiffness: 280, damping: 22 }}
        whileHover={isEarned ? { scale: 1.06, y: -2 } : {}}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '14px 10px',
          borderRadius: 16,
          background: isEarned
            ? badge.rare ? 'rgba(255,214,10,0.10)' : 'rgba(10,132,255,0.07)'
            : 'rgba(0,0,0,0.04)',
          border: isEarned
            ? badge.rare ? '1.5px solid rgba(255,214,10,0.45)' : '1.5px solid rgba(10,132,255,0.28)'
            : '1.5px solid rgba(0,0,0,0.06)',
          cursor: isEarned ? 'default' : 'not-allowed',
          transition: 'background 0.3s ease, border-color 0.3s ease',
          minWidth: 80,
          flex: '1 1 80px',
          position: 'relative',
        }}
      >
        {/* Lottie / fallback icon */}
        <div style={{
          width: 48,
          height: 48,
          filter: isEarned ? 'none' : 'grayscale(1) opacity(0.5)',
        }}>
          {anim
            ? <Lottie animationData={anim} loop={isEarned} autoplay={isEarned} />
            : <span style={{ fontSize: 28, lineHeight: '48px', display: 'block', textAlign: 'center' }}>
                {badge.icon}
              </span>
          }
        </div>

        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: isEarned ? (badge.rare ? '#B8860B' : '#0A84FF') : '#AEAEB2',
          textAlign: 'center',
          lineHeight: 1.3,
        }}>
          {badge.name}
        </span>

        {badge.rare && isEarned && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: '#B8860B',
              letterSpacing: '0.08em',
              background: 'rgba(255,214,10,0.2)',
              padding: '1px 6px',
              borderRadius: 6,
            }}
          >
            RARE
          </motion.span>
        )}

        {/* Lock icon for unearned */}
        {!isEarned && (
          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 10,
            opacity: 0.4,
          }}>
            🔒
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#636366', letterSpacing: '0.08em', marginBottom: 12 }}>
        BADGES EARNED ({earned.length}/{all.length})
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#AEAEB2', marginBottom: 8 }}>Common</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {common.map((b, i) => <BadgeChip key={b.id} badge={b} index={i} />)}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#AEAEB2', marginBottom: 8 }}>Rare</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {rare.map((b, i) => <BadgeChip key={b.id} badge={b} index={i + common.length} />)}
        </div>
      </div>
    </div>
  );
}

BadgeCollection.propTypes = {
  earned: PropTypes.arrayOf(PropTypes.string).isRequired,
};
