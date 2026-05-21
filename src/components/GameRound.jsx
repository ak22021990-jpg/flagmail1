import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useTimer } from '../hooks/useTimer.js';
import TimerBar from './TimerBar.jsx';
import EmailCard from './EmailCard.jsx';
import ClueSystem from './ClueSystem.jsx';
import Classifier from './Classifier.jsx';
import RoundHeader from './RoundHeader.jsx';
import ClassifyButton from './ClassifyButton.jsx';
import ScoreDisplay from './ScoreDisplay.jsx';
import { ROUND_DURATION_SECONDS } from '../config/game.js';
import { glass } from '../styles/tokens.js';

// GameRound uses stronger blur
const surface = { ...glass, backdropFilter: 'blur(30px) saturate(165%)', WebkitBackdropFilter: 'blur(30px) saturate(165%)', border: '1px solid rgba(255,255,255,0.84)' };

const sectionLabelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: 'rgba(17,24,39,0.52)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const helperStyle = {
  fontSize: 11,
  color: 'rgba(17,24,39,0.54)',
};

const ZONE_META = {
  1: { name: 'The Inbox', accent: '#0A84FF', tone: 'Clean out the obvious noise.' },
  2: { name: 'The Queue', accent: '#30B0C7', tone: 'Trust the details, not the polish.' },
  3: { name: 'The Escalation', accent: '#FF7A1A', tone: 'The final calls need specialist eyes.' },
};

const ZONE_END_COLOR = { 1: '#0055CC', 2: '#1A8FA8', 3: '#E56A00' };

function formatClock(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function GameRound({
  email,
  zone,
  emailInZone,
  emailsInZone,
  totalScore,
  round,
  onRevealClue,
  onSelectL1,
  onSelectL2,
  onSubmit,
}) {
  const roundRef = useRef(round);
  const scoreDisplayRef = useRef(null);
  const prevScoreRef = useRef(totalScore);
  const meta = ZONE_META[zone] || ZONE_META[1];

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  useEffect(() => {
    if (!scoreDisplayRef.current) return;
    const from = prevScoreRef.current;
    const to = totalScore;
    if (from === to) return;

    const scoreProxy = { val: from };

    const tween1 = gsap.fromTo(
      scoreProxy,
      { val: from },
      {
        val: to,
        duration: 0.45,
        ease: 'power2.out',
        onUpdate() {
          if (scoreDisplayRef.current) {
            scoreDisplayRef.current.textContent = Math.round(scoreProxy.val);
          }
        },
      }
    );

    const tween2 = gsap.fromTo(
      scoreDisplayRef.current,
      { scale: 1.15, color: meta.accent },
      { scale: 1, color: '#111827', duration: 0.35, ease: 'back.out(2)' }
    );

    prevScoreRef.current = to;

    return () => {
      tween1.kill();
      tween2.kill();
    };
  }, [meta.accent, totalScore]);

  function handleTimeout() {
    onSubmit(0, true);
  }

  const { timeLeft, phase, progress, start, stop } = useTimer(ROUND_DURATION_SECONDS, handleTimeout);

  useEffect(() => {
    start();
    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email?.id]);

  const canSubmit = !!round.selectedL1 && !round.submitted;

  function handleSubmit() {
    if (!canSubmit) return;
    stop();
    onSubmit(timeLeft, false);
  }

  const phaseColor = phase === 'green' ? '#34C759' : phase === 'amber' ? '#FF9500' : '#FF3B30';
  const clueCount = Array.isArray(email?.clues) ? email.clues.length : 0;
  const cluesSeen = Array.isArray(round.cluesRevealed) ? round.cluesRevealed.length : 0;

  return (
    <div
      style={{
        minHeight: '100dvh',
        padding: '18px clamp(12px, 2.5vw, 24px)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @media (max-width: 1200px) {
          .game-round-main {
            grid-template-columns: minmax(0, 1fr) 380px !important;
          }
        }

        @media (max-width: 980px) {
          .game-round-shell {
            gap: 12px !important;
          }

          .game-round-topbar {
            grid-template-columns: 1fr !important;
          }

          .game-round-main {
            grid-template-columns: 1fr !important;
            min-height: auto !important;
          }

          .game-round-email-wrap,
          .game-round-side {
            min-height: auto !important;
            max-height: none !important;
          }
        }

        @media (max-width: 720px) {
          .game-round-screen {
            padding-inline: 12px !important;
            padding-block: 12px !important;
          }

          .game-round-topbar-card,
          .game-round-email-wrap,
          .game-round-side {
            border-radius: 24px !important;
          }

          .game-round-side {
            padding: 16px !important;
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: [
            `radial-gradient(circle at 14% 18%, ${meta.accent}16, transparent 24%)`,
            'radial-gradient(circle at 82% 12%, rgba(255,255,255,0.62), transparent 20%)',
            'radial-gradient(circle at 48% 84%, rgba(17,24,39,0.06), transparent 28%)',
          ].join(','),
        }}
      />

      <div
        className="game-round-screen"
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          position: 'relative',
          minHeight: '100%',
        }}
      >
        <div
          className="game-round-shell"
          style={{
            display: 'grid',
            gap: 14,
          }}
        >
          <RoundHeader
            zone={zone}
            meta={meta}
            emailInZone={emailInZone}
            emailsInZone={emailsInZone}
            phaseColor={phaseColor}
            timeLeft={timeLeft}
            phase={phase}
            progress={progress}
            scoreRef={scoreDisplayRef}
            totalScore={totalScore}
          />

          <div
            className="game-round-main"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.08fr) minmax(360px, 0.92fr)',
              gap: 14,
              alignItems: 'start',
              minHeight: 'calc(100dvh - 146px)',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                className="game-round-email-wrap"
                key={email?.id}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                style={{
                  ...surface,
                  borderRadius: 30,
                  padding: 16,
                  minHeight: 0,
                  maxHeight: 'calc(100dvh - 160px)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.72)',
                }}
              >
                <div style={{ minHeight: 0, overflow: 'auto', paddingRight: 4 }}>
                  <EmailCard email={email} giveawayHighlight={false} />
                </div>
              </motion.div>
            </AnimatePresence>

            <div
              className="game-round-side"
              style={{
                ...surface,
                borderRadius: 28,
                padding: 18,
                display: 'grid',
                gap: 18,
                alignContent: 'start',
                minHeight: 0,
                maxHeight: 'calc(100dvh - 160px)',
                overflow: 'auto',
              }}
            >
              <div style={{ display: 'grid', gap: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={sectionLabelStyle}>Decision</div>
                  <div style={helperStyle}>Choose the strongest category, then refine if needed.</div>
                </div>

                <div
                  style={{
                    borderRadius: 22,
                    padding: 14,
                    background: `linear-gradient(180deg, ${meta.accent}10 0%, rgba(255,255,255,0.94) 100%)`,
                    border: `1px solid ${meta.accent}18`,
                    display: 'grid',
                    gap: 18,
                  }}
                >
                  <Classifier
                    selectedL1={round.selectedL1}
                    selectedL2={round.selectedL2}
                    onSelectL1={onSelectL1}
                    onSelectL2={onSelectL2}
                    disabled={round.submitted}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={sectionLabelStyle}>Clues</div>
                  <div
                    style={{
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: 'rgba(255,184,0,0.12)',
                      color: '#A16207',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {cluesSeen}/{clueCount}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: 20,
                    background: 'rgba(249,250,252,0.88)',
                    border: '1px solid rgba(13,26,51,0.06)',
                    padding: '12px 12px 8px',
                    overflow: 'auto',
                  }}
                >
                  <ClueSystem
                    clues={email?.clues || []}
                    revealed={round.cluesRevealed}
                    onReveal={onRevealClue}
                    disabled={round.submitted}
                  />
                </div>

                <div style={{ fontSize: 11, color: 'rgba(17,24,39,0.48)' }}>
                  Each revealed clue costs one point, so use them when the evidence is genuinely unclear.
                </div>
              </div>

              <div
                style={{
                  borderRadius: 20,
                  background: `linear-gradient(180deg, ${meta.accent}0D 0%, rgba(255,255,255,0.82) 100%)`,
                  border: `1px solid ${meta.accent}1F`,
                  padding: 16,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(17,24,39,0.46)' }}>
                    Ready to submit
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(17,24,39,0.60)' }}>
                    {round.selectedL1
                      ? 'Add a secondary diagnosis for a bonus point.'
                      : 'Pick a primary category to unlock submission.'}
                  </div>
                </div>

                <ClassifyButton
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  accent={meta.accent}
                  endColor={ZONE_END_COLOR[zone]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

GameRound.propTypes = {
  email: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    clues: PropTypes.arrayOf(PropTypes.string),
    body: PropTypes.string,
    subject: PropTypes.string,
  }),
  zone: PropTypes.number.isRequired,
  emailInZone: PropTypes.number.isRequired,
  emailsInZone: PropTypes.number.isRequired,
  totalScore: PropTypes.number.isRequired,
  round: PropTypes.shape({
    selectedL1: PropTypes.string,
    selectedL2: PropTypes.string,
    submitted: PropTypes.bool,
    cluesRevealed: PropTypes.arrayOf(PropTypes.number),
  }).isRequired,
  onRevealClue: PropTypes.func.isRequired,
  onSelectL1: PropTypes.func.isRequired,
  onSelectL2: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
