export default function TimerBar({ timeLeft, phase, progress }) {
  const color = phase === 'green' ? '#34C759' : phase === 'amber' ? '#FF9500' : '#FF3B30';

  return (
    <div style={{
      width: '100%',
      height: 5,
      background: 'rgba(0,0,0,0.08)',
      borderRadius: 3,
      overflow: 'hidden',
      position: 'relative',
    }} role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div style={{
        height: '100%',
        width: `${progress * 100}%`,
        background: color,
        borderRadius: 3,
        transition: 'width 1s linear, background 0.5s ease',
      }}
        className={phase === 'red' ? 'anim-timerPulse' : ''}
      />
    </div>
  );
}
