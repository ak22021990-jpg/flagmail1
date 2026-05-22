import PropTypes from 'prop-types';
import EmailHeaderPanel from './EmailHeaderPanel.jsx';

function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function avatarColor(str) {
  const colors = ['#0A84FF', '#30B0C7', '#FF7A1A', '#34C759', '#F25F4C', '#5AC8FA'];
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatAppleTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function EmailCard({ email, giveawayHighlight = false }) {
  if (!email) return null;

  function renderBody(body, phrase, highlight) {
    if (!highlight || !phrase) return body;
    const idx = body.toLowerCase().indexOf(phrase.toLowerCase());
    if (idx === -1) return body;

    return (
      <>
        {body.slice(0, idx)}
        <mark
          className="anim-glowPulse"
          style={{
            background: 'rgba(255,214,10,0.28)',
            borderRadius: 6,
            padding: '1px 3px',
            color: '#7A5F00',
            fontWeight: 600,
          }}
        >
          {body.slice(idx, idx + phrase.length)}
        </mark>
        {body.slice(idx + phrase.length)}
      </>
    );
  }

  const displayName = email.fromName || email.from;
  const displayEmail = email.sender || email.from;
  const initials = getInitials(displayName);
  const color = avatarColor(displayName);

  return (
    <div
      className="anim-envelopeOpen"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,251,253,0.98) 100%)',
        border: '1px solid rgba(13,26,51,0.08)',
        borderRadius: 26,
        boxShadow: '0 18px 44px rgba(18, 28, 45, 0.08), 0 4px 12px rgba(18, 28, 45, 0.04)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: '20px 22px 18px',
        background: 'linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(244,247,250,0.88) 100%)',
        borderBottom: '1px solid rgba(13,26,51,0.07)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center',
          marginBottom: 14,
          flexWrap: 'wrap',
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(17,24,39,0.48)',
          }}>
            Incoming message
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.82)',
            border: '1px solid rgba(13,26,51,0.06)',
            color: 'rgba(17,24,39,0.56)',
            fontSize: 12,
            fontWeight: 600,
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 0 4px ${color}20`,
            }} />
            Today at {formatAppleTime()}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gap: 14, alignItems: 'start' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            boxShadow: `0 10px 24px ${color}35`,
            flexShrink: 0,
          }}>
            {initials}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 28,
              lineHeight: 1.08,
              letterSpacing: '-0.045em',
              fontWeight: 700,
              color: '#111827',
              marginBottom: 14,
              maxWidth: 760,
            }}>
              {email.subject}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
            }}>
              <div style={{
                padding: '12px 14px',
                borderRadius: 18,
                background: 'rgba(255,255,255,0.86)',
                border: '1px solid rgba(13,26,51,0.06)',
              }}>
                <div style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.10em',
                  fontWeight: 700,
                  color: 'rgba(17,24,39,0.46)',
                  marginBottom: 6,
                }}>
                  From
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: 3,
                }}>
                  {displayName}
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(17,24,39,0.56)',
                  fontFamily: 'ui-monospace, "SF Mono", monospace',
                  wordBreak: 'break-all',
                }}>
                  {displayEmail}
                </div>
              </div>

              <div style={{
                padding: '12px 14px',
                borderRadius: 18,
                background: 'rgba(255,255,255,0.86)',
                border: '1px solid rgba(13,26,51,0.06)',
              }}>
                <div style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.10em',
                  fontWeight: 700,
                  color: 'rgba(17,24,39,0.46)',
                  marginBottom: 6,
                }}>
                  To
                </div>
                <div style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: 3,
                }}>
                  Security Analyst
                </div>
                <div style={{
                  fontSize: 12,
                  color: 'rgba(17,24,39,0.56)',
                }}>
                  Your review queue
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmailHeaderPanel email={email} />

      {email.userContext && (
        <div style={{
          padding: '12px 20px',
          background: 'linear-gradient(90deg, rgba(10,132,255,0.08) 0%, rgba(255,255,255,0.92) 50%)',
          borderBottom: '1px solid rgba(13,26,51,0.06)',
          display: 'grid',
          gridTemplateColumns: '18px minmax(0, 1fr)',
          gap: 10,
          alignItems: 'start',
        }}>
          <span style={{
            fontSize: 13,
            color: '#0A84FF',
            lineHeight: 1.3,
          }}>
            i
          </span>
          <span style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: 'rgba(17,24,39,0.66)',
          }}>
            {email.userContext}
          </span>
        </div>
      )}

      <div style={{
        padding: '26px 22px 28px',
        background: '#FFFFFF',
      }}>
        <div style={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          fontWeight: 700,
          color: 'rgba(17,24,39,0.46)',
          marginBottom: 14,
        }}>
          Message body
        </div>

        <div style={{
          fontSize: 15,
          color: '#273142',
          lineHeight: 1.72,
          whiteSpace: 'pre-wrap',
          fontWeight: 400,
        }}>
          {renderBody(email.body, email.giveawayPhrase, giveawayHighlight)}
        </div>
      </div>
    </div>
  );
}

EmailCard.propTypes = {
  email: PropTypes.shape({
    fromName: PropTypes.string,
    sender: PropTypes.string,
    replyTo: PropTypes.string,
    subject: PropTypes.string,
    from: PropTypes.string,
    body: PropTypes.string.isRequired,
    giveawayPhrase: PropTypes.string,
    userContext: PropTypes.string,
    clues: PropTypes.arrayOf(PropTypes.string),
    explanation: PropTypes.string,
  }),
  giveawayHighlight: PropTypes.bool,
};
