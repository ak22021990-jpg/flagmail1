import PropTypes from 'prop-types';

export default function ZoneFeatureCard({ signal, accent }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        borderRadius: 20,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.8)',
        border: '1px solid rgba(13,26,51,0.06)',
        width: '100%',
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: accent,
          opacity: 0.7,
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <div style={{ display: 'grid', gap: 4 }}>
        <div
          style={{
            fontSize: 16,
            lineHeight: 1.35,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#111827',
          }}
        >
          {signal.title}
        </div>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: 'rgba(17,24,39,0.62)',
          }}
        >
          {signal.detail}
        </div>
      </div>
    </div>
  );
}

ZoneFeatureCard.propTypes = {
  signal: PropTypes.shape({
    title: PropTypes.string.isRequired,
    detail: PropTypes.string.isRequired,
  }).isRequired,
  accent: PropTypes.string.isRequired,
};
