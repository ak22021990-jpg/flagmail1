import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EmailCard from './EmailCard.jsx';

function runConfetti(canvas) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const colors = ['#0A84FF', '#34C759', '#FF9500', '#FF3B30', '#30B0C7'];

  const pieces = Array.from({ length: 120 }, () => ({
    x: width * 0.18 + Math.random() * width * 0.64,
    y: -20 - Math.random() * 120,
    vx: (Math.random() - 0.5) * 7,
    vy: 2 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    w: 8 + Math.random() * 8,
    h: 4 + Math.random() * 4,
    rotation: Math.random() * 360,
    rotVel: (Math.random() - 0.5) * 9,
  }));

  let raf = 0;

  function draw() {
    ctx.clearRect(0, 0, width, height);
    let active = false;
    for (const piece of pieces) {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += 0.12;
      piece.vx *= 0.994;
      piece.rotation += piece.rotVel;
      if (piece.y < height + 40) active = true;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, 1 - piece.y / (height * 1.08)));
      ctx.translate(piece.x, piece.y);
      ctx.rotate((piece.rotation * Math.PI) / 180);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      ctx.restore();
    }
    if (active) raf = requestAnimationFrame(draw);
  }

  draw();
  return () => cancelAnimationFrame(raf);
}

function CorrectAnswerOverlay({ points, onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(onDone, 2100);
    return () => clearTimeout(timer);
  }, [onDone]);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    return runConfetti(canvasRef.current);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onDone}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(17,24,39,0.52)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        cursor: 'pointer',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 340, damping: 24 }}
        style={{
          textAlign: 'center',
          color: '#fff',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: '50%',
            margin: '0 auto 18px',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(180deg, rgba(52,199,89,0.28) 0%, rgba(52,199,89,0.16) 100%)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.24)',
            fontSize: 40,
            fontWeight: 800,
          }}
        >
          ✓
        </div>

        <div
          style={{
            fontSize: 52,
            lineHeight: 0.96,
            letterSpacing: '-0.05em',
            fontWeight: 800,
            marginBottom: 10,
          }}
        >
          Correct
        </div>

        <div
          style={{
            display: 'inline-block',
            padding: '8px 20px',
            borderRadius: 999,
            background: 'rgba(52,199,89,0.16)',
            border: '1px solid rgba(52,199,89,0.32)',
            color: '#7CFFAC',
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          +{points} pts
        </div>
      </motion.div>
    </motion.div>
  );
}

const glass = {
  background: 'rgba(255,255,255,0.74)',
  backdropFilter: 'blur(24px) saturate(155%)',
  WebkitBackdropFilter: 'blur(24px) saturate(155%)',
  border: '1px solid rgba(255,255,255,0.82)',
  boxShadow: '0 24px 80px rgba(32, 52, 89, 0.10), 0 8px 24px rgba(32, 52, 89, 0.05)',
};

export default function ExplanationCard({ email, record, totalScore, onNext }) {
  const [showOverlay, setShowOverlay] = useState(record.l1Correct);
  const [showDelta, setShowDelta] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowDelta(true), 260);
    return () => clearTimeout(timer);
  }, []);

  const { l1Correct, timedOut, points, l1Points, l2Points, clueDeduction } = record;

  const verdict = timedOut && !l1Correct
    ? { label: 'Timed out', accent: '#FF9500', tone: 'The round expired before the correct classification landed.' }
    : l1Correct
      ? { label: 'Strong call', accent: '#34C759', tone: 'You identified the right category and can review why it was correct.' }
      : { label: 'Missed it', accent: '#FF3B30', tone: 'The explanation below shows which detail changed the classification.' };

  const scoreLines = [];
  if (l1Points > 0) scoreLines.push(`+${l1Points} for L1`);
  if (l2Points > 0) scoreLines.push(`+${l2Points} for L2`);
  if (clueDeduction > 0) scoreLines.push(`-${clueDeduction} from hints`);
  if (scoreLines.length === 0) scoreLines.push('0 points this round');

  return (
    <>
      <AnimatePresence>
        {showOverlay && (
          <CorrectAnswerOverlay points={points} onDone={() => setShowOverlay(false)} />
        )}
      </AnimatePresence>

      <div
        style={{
          minHeight: '100dvh',
          padding: '20px 16px 28px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          position: 'relative',
        }}
      >
        <style>{`
          @media (max-width: 980px) {
            .explanation-summary-grid {
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
              `radial-gradient(circle at 16% 14%, ${verdict.accent}14, transparent 26%)`,
              'radial-gradient(circle at 84% 10%, rgba(255,255,255,0.72), transparent 20%)',
              'radial-gradient(circle at 50% 84%, rgba(17,24,39,0.05), transparent 26%)',
            ].join(','),
          }}
        />

        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1, display: 'grid', gap: 14 }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{
              ...glass,
              borderRadius: 30,
              padding: '20px 22px',
              overflow: 'hidden',
            }}
          >
            <div
              className="explanation-summary-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)',
                gap: 16,
                alignItems: 'start',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(17,24,39,0.48)',
                    marginBottom: 8,
                  }}
                >
                  Round Review
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      background: `${verdict.accent}12`,
                      border: `1px solid ${verdict.accent}24`,
                      color: verdict.accent,
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {verdict.label}
                  </div>
                  <div
                    style={{
                      fontSize: 30,
                      lineHeight: 1,
                      fontWeight: 800,
                      letterSpacing: '-0.05em',
                      color: '#111827',
                    }}
                  >
                    {points > 0 ? `+${points}` : '0'} pts
                  </div>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: 'rgba(17,24,39,0.64)',
                    maxWidth: 620,
                  }}
                >
                  {verdict.tone}
                </p>
              </div>

              <div
                style={{
                  position: 'relative',
                  borderRadius: 24,
                  padding: '16px',
                  background: 'rgba(249,250,252,0.84)',
                  border: '1px solid rgba(13,26,51,0.06)',
                  display: 'grid',
                  gap: 10,
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
                        color: verdict.accent,
                      }}
                    >
                      {points > 0 ? `+${points}` : '0'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.08fr) minmax(320px, 0.92fr)', gap: 14, alignItems: 'start' }}>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06, duration: 0.28, ease: 'easeOut' }}
            >
              <EmailCard email={email} giveawayHighlight />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.28, ease: 'easeOut' }}
              style={{
                ...glass,
                borderRadius: 28,
                padding: 18,
                display: 'grid',
                gap: 14,
                position: 'sticky',
                top: 20,
              }}
            >
              <div
                style={{
                  borderRadius: 22,
                  padding: '16px',
                  background: `linear-gradient(180deg, ${verdict.accent}10 0%, rgba(255,255,255,0.90) 100%)`,
                  border: `1px solid ${verdict.accent}20`,
                  display: 'grid',
                  gap: 10,
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
                  Analysis
                </div>
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: '#1C1C1E',
                  }}
                >
                  {email.explanation}
                </div>
              </div>

              <div
                style={{
                  borderRadius: 22,
                  padding: '16px',
                  background: 'rgba(249,250,252,0.84)',
                  border: '1px solid rgba(13,26,51,0.06)',
                  display: 'grid',
                  gap: 10,
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
                  Classification Review
                </div>

                {(!record.l1Correct && (record.selectedL1 || record.timedOut)) && (
                  <div
                    style={{
                      borderRadius: 18,
                      overflow: 'hidden',
                      border: '1px solid rgba(255,59,48,0.22)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        background: 'rgba(255,59,48,0.08)',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(17,24,39,0.50)' }}>
                        Category
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#FF3B30' }}>
                        {record.timedOut && !record.selectedL1 ? 'Timed out' : 'Missed'}
                      </span>
                    </div>
                    <div style={{ padding: '12px', display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 12, color: 'rgba(17,24,39,0.46)' }}>You selected</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#FF3B30' }}>{record.selectedL1 || 'No answer'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 12, color: 'rgba(17,24,39,0.46)' }}>Correct answer</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#34C759' }}>{record.correctL1}</span>
                      </div>
                    </div>
                  </div>
                )}

                {(record.l1Correct && (record.timedOut || (record.selectedL2 && !record.l2Correct))) && (
                  <div
                    style={{
                      borderRadius: 18,
                      overflow: 'hidden',
                      border: '1px solid rgba(255,149,0,0.20)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        background: 'rgba(255,149,0,0.08)',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(17,24,39,0.50)' }}>
                        Subcategory
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#FF9500' }}>
                        {record.timedOut && !record.selectedL2 ? 'Timed out' : 'Needs refinement'}
                      </span>
                    </div>
                    <div style={{ padding: '12px', display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 12, color: 'rgba(17,24,39,0.46)' }}>You selected</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#FF9500' }}>{record.selectedL2 || 'No answer'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <span style={{ fontSize: 12, color: 'rgba(17,24,39,0.46)' }}>Correct answer</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#34C759' }}>{record.correctL2}</span>
                      </div>
                    </div>
                  </div>
                )}

                {record.l1Correct && (record.l2Correct || !record.correctL2) && (
                  <div
                    style={{
                      borderRadius: 18,
                      padding: '14px 16px',
                      background: 'rgba(52,199,89,0.08)',
                      border: '1px solid rgba(52,199,89,0.16)',
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: 'rgba(17,24,39,0.68)',
                    }}
                  >
                    The classification matched the intended answer. Review the highlighted clue and continue to the next message.
                  </div>
                )}
              </div>

              <div
                style={{
                  borderRadius: 20,
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.82)',
                  border: '1px solid rgba(13,26,51,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, color: 'rgba(17,24,39,0.54)' }}>Score so far</span>
                <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em', color: '#111827' }}>{totalScore} pts</span>
              </div>

              <motion.button
                onClick={onNext}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  borderRadius: 18,
                  border: '1px solid rgba(10,132,255,0.24)',
                  background: 'linear-gradient(135deg, #0A84FF 0%, #0066CC 100%)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  boxShadow: '0 18px 30px rgba(10,132,255,0.24)',
                }}
              >
                Next email
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
