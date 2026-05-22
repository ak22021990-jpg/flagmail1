import PropTypes from 'prop-types';

export default function FeatureHighlight({ card }) {
  return (
    <div
      key={card.zone}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        padding: '16px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(244,247,252,0.94) 100%)',
        border: '1px solid rgba(13,26,51,0.06)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 4,
          background: card.accent,
          opacity: 0.7,
          borderRadius: '4px 0 0 4px',
        }}
      />
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: card.accent,
          marginBottom: 10,
        }}
      >
        {card.zone}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: '#111827',
          marginBottom: 6,
        }}
      >
        {card.title}
      </div>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.45,
          color: 'rgba(17,24,39,0.62)',
        }}
      >
        {card.detail}
      </div>
    </div>
  );
}

FeatureHighlight.propTypes = {
  card: PropTypes.shape({
    zone: PropTypes.string.isRequired,
    accent: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    detail: PropTypes.string.isRequired,
  }).isRequired,
};
