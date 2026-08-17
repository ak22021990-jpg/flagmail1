import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { glass, POINTS_PER_EMAIL } from '../styles/tokens.js';
import DifficultyBadge from './DifficultyBadge.jsx';
import ZoneStatCard from './ZoneStatCard.jsx';
import ZoneFeatureCard from './ZoneFeatureCard.jsx';

// ZoneIntroCard uses stronger blur
const localGlass = { ...glass, backdropFilter: 'blur(30px) saturate(165%)', WebkitBackdropFilter: 'blur(30px) saturate(165%)', border: '1px solid rgba(255,255,255,0.84)' };

const ZONES = [
  {
    zone: 1,
    title: 'The Inbox',
    subtitle: 'Section 1 of 4',
    emails: 5,
    difficulty: 'Foundation',
    accent: '#0A84FF',
    endColor: '#0055CC',
    mission: 'Spot the loud red flags fast and build your rhythm.',
    contextCopy: 'Start with the obvious ones and find your footing.',
    signals: [
      {
        title: 'Urgent asks',
        detail: 'Pressure-heavy requests that want a fast reaction before you verify anything.',
      },
      {
        title: 'Mismatched senders',
        detail: 'The name, email address, and story do not line up cleanly.',
      },
      {
        title: 'Low-trust promotions',
        detail: 'Noisy offers, weak credibility, and incentives that feel slightly off.',
      },
    ],
  },
  {
    zone: 2,
    title: 'The Queue',
    subtitle: 'Section 2 of 4',
    emails: 5,
    difficulty: 'Intermediate',
    accent: '#30B0C7',
    endColor: '#1A8FA8',
    mission: 'The copy gets cleaner here. Trust the details, not the polish.',
    contextCopy: 'Polish can hide a lot. Read slower.',
    signals: [
      {
        title: 'Lookalike domains',
        detail: 'Small spelling changes and realistic branding used to borrow trust.',
      },
      {
        title: 'Workflow mismatches',
        detail: 'Messages that sound plausible until you compare them to real process.',
      },
      {
        title: 'Suspicious requests',
        detail: 'Seemingly routine asks that quietly push for risky action.',
      },
    ],
  },
  {
    zone: 3,
    title: 'The Escalation',
    subtitle: 'Section 3 of 4',
    emails: 5,
    difficulty: 'Advanced',
    accent: '#FF7A1A',
    endColor: '#E56A00',
    mission: 'One subtle inconsistency is usually the whole story.',
    contextCopy: 'High stakes. One detail changes everything.',
    signals: [
      {
        title: 'Subtle social engineering',
        detail: 'The message sounds credible because it mirrors real pressure and timing.',
      },
      {
        title: 'Operational realism',
        detail: 'Details are believable enough that only one mismatch stands out.',
      },
      {
        title: 'One decisive clue',
        detail: 'A single overlooked inconsistency usually decides the classification.',
      },
    ],
  },
  {
    zone: 4,
    title: 'SOC Desk',
    subtitle: 'Section 4 of 4',
    emails: 6,
    difficulty: 'Assessment',
    accent: '#7B2D8E',
    endColor: '#5A1D6E',
    mission: 'Classify the threat, write a Splunk SPL query, and explain your reasoning against real log evidence.',
    contextCopy: 'No timer, no clues.',
    signals: [],
  },
];

ZoneIntroCard.propTypes = {
  zone: PropTypes.number.isRequired,
  onStart: PropTypes.func.isRequired,
  earlyUnlocked: PropTypes.bool.isRequired,
};

export default function ZoneIntroCard({ zone, onStart, earlyUnlocked }) {
  const meta = ZONES.find((item) => item.zone === zone);
  const statCards = [
    { label: 'Emails', value: meta.emails, helper: 'Short burst' },
    { label: 'Max points', value: meta.emails * POINTS_PER_EMAIL, helper: `${POINTS_PER_EMAIL} each` },
    { label: 'Time each', value: '120s', helper: 'Timed read' },
  ];

  return (
    <div
      style={{
        minHeight: '100dvh',
        padding: 'clamp(18px, 3vw, 30px)',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        .zone-intro-shell {
          min-height: calc(100dvh - (2 * clamp(18px, 3vw, 30px)));
        }

        @media (max-width: 900px) {
          .zone-intro-shell {
            grid-template-columns: 1fr !important;
            height: auto !important;
            min-height: auto !important;
          }

          .zone-intro-main,
          .zone-intro-side {
            overflow: visible !important;
          }
        }

        @media (max-width: 640px) {
          .zone-intro-main,
          .zone-intro-side {
            padding: 22px !important;
          }

          .zone-intro-hero,
          .zone-intro-bottom,
          .zone-intro-side-grid,
          .zone-intro-action-row {
            grid-template-columns: 1fr !important;
          }

          .zone-intro-stats {
            grid-template-columns: 1fr !important;
          }

          .zone-intro-signals {
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
            `radial-gradient(circle at 14% 18%, ${meta.accent}18, transparent 24%)`,
            'radial-gradient(circle at 85% 14%, rgba(255,255,255,0.65), transparent 20%)',
            'radial-gradient(circle at 50% 82%, rgba(17,24,39,0.06), transparent 28%)',
          ].join(','),
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="zone-intro-shell"
        style={{
          width: '100%',
          maxWidth: 1240,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.12fr) minmax(360px, 0.88fr)',
          gap: 20,
          alignItems: 'stretch',
          position: 'relative',
        }}
      >
        <motion.div
          className="zone-intro-main"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          style={{
            ...localGlass,
            borderRadius: 34,
            padding: 'clamp(24px, 3vw, 34px)',
            display: 'grid',
            gap: 24,
            minWidth: 0,
          }}
        >
          <div
            className="zone-intro-hero"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(250px, 0.8fr)',
              gap: 16,
              alignItems: 'stretch',
              minWidth: 0,
            }}
          >
            <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: `${meta.accent}12`,
                  border: `1px solid ${meta.accent}24`,
                  justifySelf: 'start',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: meta.accent,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  Zone {meta.zone}
                </span>
                <span
                  style={{
                    width: 1,
                    height: 14,
                    background: `${meta.accent}35`,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'rgba(17,24,39,0.56)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {meta.subtitle}
                </span>
              </div>

              <div style={{ display: 'grid', gap: 12, maxWidth: 660 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 'clamp(44px, 6vw, 80px)',
                    lineHeight: 0.92,
                    letterSpacing: '-0.06em',
                    color: '#111827',
                    fontWeight: 700,
                  }}
                >
                  {meta.title}
                </h1>

                <p
                  style={{
                    margin: 0,
                    fontSize: 'clamp(16px, 1.75vw, 19px)',
                    lineHeight: 1.55,
                    color: 'rgba(17,24,39,0.66)',
                    maxWidth: 560,
                  }}
                >
                  {meta.mission}
                </p>
              </div>
            </div>

            <div
              style={{
                borderRadius: 28,
                padding: '18px',
                background: `linear-gradient(160deg, ${meta.accent}16 0%, rgba(255,255,255,0.88) 55%, rgba(255,255,255,0.68) 100%)`,
                border: `1px solid ${meta.accent}18`,
                display: 'grid',
                gap: 12,
                alignContent: 'start',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: meta.accent,
                }}
              >
                Focus for this zone
              </div>
              <div
                style={{
                  fontSize: 24,
                  lineHeight: 1,
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  color: '#111827',
                }}
              >
                {meta.difficulty}
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: 'rgba(17,24,39,0.66)',
                }}
              >
                {meta.contextCopy}
              </div>
              <div style={{ height: 1, background: `${meta.accent}18`, borderRadius: 1 }} />
            </div>
          </div>

          <div
            className="zone-intro-stats"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            {statCards.map((stat) => (
              <ZoneStatCard key={stat.label} stat={stat} accent={meta.accent} />
            ))}
          </div>

          <div
            className="zone-intro-bottom"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 16,
              minHeight: 0,
              minWidth: 0,
            }}
          >
            <div style={{ display: 'grid', gap: 12, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'rgba(17,24,39,0.50)',
                }}
              >
                What to watch for
              </div>

              <div
                className="zone-intro-signals"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 12,
                  alignItems: 'stretch',
                  minWidth: 0,
                }}
              >
                {meta.signals.map((signal) => (
                  <ZoneFeatureCard key={signal.title} signal={signal} accent={meta.accent} />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="zone-intro-side"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, type: 'spring', stiffness: 190, damping: 24 }}
          style={{
            ...localGlass,
            borderRadius: 32,
            padding: 'clamp(24px, 3vw, 30px)',
            display: 'grid',
            gap: 18,
            alignContent: 'start',
            minHeight: '100%',
          }}
        >
          <div
            className="zone-intro-side-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
              gap: 14,
            }}
          >
            <div
              style={{
                borderRadius: 26,
                padding: '18px',
                background: `linear-gradient(180deg, ${meta.accent}14 0%, rgba(255,255,255,0.88) 100%)`,
                border: `1px solid ${meta.accent}22`,
                display: 'grid',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px minmax(0, 1fr)',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: `${meta.accent}14`,
                    border: `1px solid ${meta.accent}30`,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 20,
                    fontWeight: 800,
                    color: meta.accent,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {meta.zone}
                </div>

                <div style={{ display: 'grid', gap: 4 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'rgba(17,24,39,0.48)',
                    }}
                  >
                    Mission note
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      lineHeight: 1.05,
                      letterSpacing: '-0.04em',
                      fontWeight: 700,
                      color: '#111827',
                    }}
                  >
                    Find the pattern fast.
                  </div>
                </div>
              </div>

              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'rgba(17,24,39,0.66)',
                }}
              >
                {meta.mission}
              </p>
            </div>

            <div
              style={{
                borderRadius: 24,
                padding: '16px',
                background: 'rgba(255,255,255,0.82)',
                border: '1px solid rgba(13,26,51,0.06)',
                display: 'grid',
                gap: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      color: 'rgba(17,24,39,0.48)',
                    }}
                  >
                    Zone sequence
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      color: '#111827',
                    }}
                  >
                    Step {meta.zone} of 4
                  </div>
                </div>
                <DifficultyBadge difficulty={meta.difficulty} accent={meta.accent} />
              </div>

              {ZONES.map((item, index) => (
                <div
                  key={item.zone}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px minmax(0, 1fr)',
                    gap: 10,
                    alignItems: 'center',
                    padding: '8px 0',
                    borderTop: index === 0 ? 'none' : '1px solid rgba(13,26,51,0.06)',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      background: item.zone === meta.zone ? `${item.accent}12` : 'rgba(17,24,39,0.05)',
                      color: item.zone === meta.zone ? item.accent : 'rgba(17,24,39,0.42)',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {item.zone}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: item.zone === meta.zone ? '#111827' : 'rgba(17,24,39,0.58)',
                        fontWeight: item.zone === meta.zone ? 700 : 600,
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'rgba(17,24,39,0.42)',
                      }}
                    >
                      {item.difficulty}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {earlyUnlocked && zone > 1 && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                background: 'rgba(255,184,0,0.12)',
                border: '1px solid rgba(255,184,0,0.24)',
                color: '#A16207',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                justifySelf: 'start',
              }}
            >
              Early unlock earned
            </div>
          )}

          <div
            className="zone-intro-action-row"
            style={{
              marginTop: 'auto',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
              gap: 12,
            }}
          >
            <div
              style={{
                borderRadius: 22,
                padding: '14px 16px',
                background: 'rgba(249,250,252,0.82)',
                border: '1px solid rgba(13,26,51,0.06)',
                display: 'grid',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: 'rgba(17,24,39,0.48)',
                }}
              >
                Before you begin
              </div>
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: 'rgba(17,24,39,0.64)',
                }}
              >
                Read the sender, the request, and the pressure tactics before you commit.
              </div>
            </div>

            <motion.button
              onClick={onStart}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              style={{
                width: '100%',
                padding: '16px 18px',
                borderRadius: 18,
                border: '1px solid rgba(255,255,255,0.5)',
                background: `linear-gradient(135deg, ${meta.accent} 0%, ${meta.endColor} 100%)`,
                boxShadow: `0 18px 32px ${meta.accent}2E`,
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: '0.01em',
              }}
            >
              Start {meta.difficulty} Zone
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
