import PropTypes from 'prop-types';

export default function AuthForm({
  name,
  email,
  error,
  checking,
  blocked,
  focusedField,
  onNameChange,
  onEmailChange,
  onSubmit,
  onFocus,
  onBlur,
  inputStyle,
}) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 8,
            letterSpacing: '0.02em',
          }}
        >
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={onNameChange}
          onFocus={() => onFocus('name')}
          onBlur={onBlur}
          placeholder="Your full name"
          style={inputStyle('name')}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 8,
            letterSpacing: '0.02em',
          }}
        >
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={onEmailChange}
          onFocus={() => onFocus('email')}
          onBlur={onBlur}
          placeholder="you@example.com"
          style={inputStyle('email')}
        />
      </div>

      {blocked && !error && (
        <p
          style={{
            fontSize: 12,
            color: '#FF9500',
            margin: 0,
          }}
        >
          You have already completed this assessment on this device.
        </p>
      )}

      {error && (
        <p
          style={{
            fontSize: 12,
            color: '#FF3B30',
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {checking && (
        <div
          style={{
            width: '100%',
            height: 4,
            borderRadius: 999,
            overflow: 'hidden',
            background: 'rgba(10,132,255,0.12)',
          }}
        >
          <div
            style={{
              width: '40%',
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #0A84FF 0%, #30B0C7 100%)',
              animation: 'loadingSlide 1s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes loadingSlide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(350%); }
            }
          `}</style>
        </div>
      )}

      <button
        type="submit"
        disabled={checking || blocked}
        style={{
          width: '100%',
          marginTop: 4,
          padding: '15px 18px',
          borderRadius: 18,
          border: '1px solid rgba(10,132,255,0.32)',
          background: (checking || blocked)
            ? 'rgba(10,132,255,0.5)'
            : 'linear-gradient(135deg, #0A84FF 0%, #0066CC 100%)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '0.01em',
          boxShadow: '0 18px 32px rgba(10,132,255,0.22)',
          cursor: (checking || blocked) ? 'not-allowed' : 'pointer',
        }}
      >
        {blocked ? 'Assessment Already Taken' : checking ? 'Verifying eligibility\u2026' : 'Start Assessment'}
      </button>
    </form>
  );
}

AuthForm.propTypes = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  error: PropTypes.string,
  checking: PropTypes.bool,
  blocked: PropTypes.bool,
  focusedField: PropTypes.string,
  onNameChange: PropTypes.func.isRequired,
  onEmailChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  inputStyle: PropTypes.func.isRequired,
};
