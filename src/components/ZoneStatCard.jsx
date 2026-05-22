import PropTypes from 'prop-types';

export default function ZoneStatCard({ stat, accent }) {
  return (
    <div
      style={{
        borderRadius: 22,
        padding: '16px 16px 15px',
        background: 'rgba(255,255,255,0.82)',
        border: '1px solid rgba(13,26,51,0.06)',
        display: 'grid',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'end',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div
          style={{
            fontSize: 30,
            lineHeight: 1,
            fontWeight: 700,
            letterSpacing: '-0.05em',
            color: '#111827',
          }}
        >
          {stat.value}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: accent,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {stat.helper}
        </div>
      </div>
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          fontWeight: 700,
          color: 'rgba(17,24,39,0.50)',
        }}
      >
        {stat.label}
      </div>
    </div>
  );
}

ZoneStatCard.propTypes = {
  stat: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    helper: PropTypes.string,
    label: PropTypes.string.isRequired,
  }).isRequired,
  accent: PropTypes.string.isRequired,
};
