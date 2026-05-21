import PropTypes from 'prop-types';

export default function ScoreDisplay({ totalScore, scoreRef }) {
  return (
    <div
      style={{
        justifySelf: 'stretch',
        padding: '14px 16px',
        borderRadius: 22,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(246,249,253,0.96) 100%)',
        border: '1px solid rgba(13,26,51,0.06)',
        display: 'grid',
        gap: 6,
        alignContent: 'center',
      }}
    >
      <div style={{ fontSize: 11, color: 'rgba(17,24,39,0.46)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        Score
      </div>
      <div
        ref={scoreRef}
        style={{
          fontSize: 34,
          lineHeight: 1,
          fontWeight: 700,
          letterSpacing: '-0.05em',
          color: '#111827',
        }}
      >
        {totalScore}
      </div>
    </div>
  );
}

ScoreDisplay.propTypes = {
  totalScore: PropTypes.number.isRequired,
  scoreRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
};
