import PropTypes from 'prop-types';

export default function DifficultyBadge({ difficulty, accent }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 999,
        background: `${accent}10`,
        color: accent,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {difficulty}
    </div>
  );
}

DifficultyBadge.propTypes = {
  difficulty: PropTypes.string.isRequired,
  accent: PropTypes.string.isRequired,
};
