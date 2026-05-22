import { useState } from 'react';
import PropTypes from 'prop-types';

const AUTH_COLOR = { Pass: '#34C759', Fail: '#FF9500', None: '#AEAEB2' };

export default function EmailHeaderPanel({ email }) {
  const [open, setOpen] = useState(false);

  const { fromName, sender, replyTo, subject, auth = {}, originIp } = email;

  const rows = [
    { label: 'From', value: fromName || '-', mono: false },
    { label: 'Sender', value: sender || email.from || '-', mono: true },
    { label: 'Reply-To', value: replyTo || sender || '-', mono: true },
    { label: 'Subject', value: subject || '-', mono: false },
    { label: 'Origin IP', value: originIp || '-', mono: true },
  ];

  return (
    <div
      style={{
        borderBottom: '1px solid rgba(10,132,255,0.16)',
        background: 'rgba(10,132,255,0.06)',
      }}
    >
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        style={{
          width: '100%',
          padding: '8px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '1.5px solid rgba(10,132,255,0.78)',
            color: '#0A84FF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 800,
            lineHeight: 1,
            background: 'rgba(255,255,255,0.82)',
            boxShadow: '0 1px 2px rgba(10,132,255,0.10)',
            flexShrink: 0,
          }}
        >
          i
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#0A84FF', letterSpacing: '0.04em' }}>
          Email Headers
        </span>
        <span
          aria-hidden="true"
          style={{
            marginLeft: 'auto',
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '1px solid rgba(10,132,255,0.22)',
            background: 'rgba(255,255,255,0.78)',
            color: '#0A84FF',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M2 3.5L5 6.5L8 3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {rows.map(({ label, value, mono }) => (
              <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span
                  style={{
                    fontSize: 11,
                    color: 'rgba(10,132,255,0.72)',
                    fontWeight: 600,
                    width: 64,
                    flexShrink: 0,
                  }}
                >
                  {label}:
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: '#1F2937',
                    fontFamily: mono ? 'ui-monospace, "SF Mono", monospace' : 'inherit',
                    wordBreak: 'break-all',
                  }}
                >
                  {value}
                </span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(10,132,255,0.72)',
                  fontWeight: 600,
                  width: 64,
                  flexShrink: 0,
                }}
              >
                Auth:
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['spf', 'dkim', 'dmarc'].map((key) => (
                  <span key={key} style={{ fontSize: 11 }}>
                    <span style={{ color: 'rgba(10,132,255,0.72)', textTransform: 'uppercase' }}>{key}: </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: AUTH_COLOR[auth[key]] || AUTH_COLOR.None,
                      }}
                    >
                      {auth[key] || 'None'}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

EmailHeaderPanel.propTypes = {
  email: PropTypes.shape({
    fromName: PropTypes.string,
    sender: PropTypes.string,
    replyTo: PropTypes.string,
    subject: PropTypes.string,
    auth: PropTypes.shape({
      spf: PropTypes.string,
      dkim: PropTypes.string,
      dmarc: PropTypes.string,
    }),
    originIp: PropTypes.string,
    from: PropTypes.string,
  }).isRequired,
};
