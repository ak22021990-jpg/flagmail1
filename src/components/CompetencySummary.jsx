import PropTypes from 'prop-types';
import { generateCompetency } from '../utils/competency.js';

export default function CompetencySummary({ categoryCorrect }) {
  const safeCategoryCorrect = categoryCorrect ?? {};
  const summary = generateCompetency(safeCategoryCorrect);

  const categories = Object.entries(safeCategoryCorrect)
    .filter(([, value]) => value.total > 0)
    .map(([category, value]) => ({
      category,
      accuracy: value.total > 0 ? Math.round((value.correct / value.total) * 100) : 0,
      correct: value.correct,
      total: value.total,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(17,24,39,0.46)',
            marginBottom: 8,
          }}
        >
          Competency Summary
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.65,
            color: '#111827',
          }}
        >
          {summary}
        </p>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {categories.map(({ category, accuracy, correct, total }) => {
          const barColor = accuracy >= 70 ? '#34C759' : accuracy >= 50 ? '#FF9500' : '#FF3B30';
          return (
            <div key={category} style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{category}</span>
                <span style={{ fontSize: 13, color: 'rgba(17,24,39,0.56)' }}>
                  {correct}/{total} correct · {accuracy}%
                </span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(17,24,39,0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${accuracy}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

CompetencySummary.propTypes = {
  categoryCorrect: PropTypes.object,
};
