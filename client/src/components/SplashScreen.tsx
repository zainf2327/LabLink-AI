import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  message?: string;
}

const SplashScreen: React.FC<SplashScreenProps> = ({
  message = 'Initializing',
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) { clearInterval(interval); return p; }
        return p + Math.random() * 10;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: '#f8fafc' }}
    >
      {/* Logo mark — single soft breathing ring around brand icon */}
      <div className="relative flex items-center justify-center mb-8" style={{ width: 72, height: 72 }}>
        {/* Outer breathing ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 0,
            border: '1.5px solid #2563eb',
            opacity: 0.2,
            animation: 'breathe 2s ease-in-out infinite',
          }}
        />
        {/* Inner icon container */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #2563eb, #6366f1)',
            boxShadow: '0 4px 20px rgba(37,99,235,0.25)',
          }}
        >
          {/* Simple lab flask / DNA cross mark */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M9 3H15M9 3V10L5.5 16.5C4.5 18.5 5.9 21 8.2 21H15.8C18.1 21 19.5 18.5 18.5 16.5L15 10V3M9 3H15" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9.5" cy="17" r="1" fill="rgba(255,255,255,0.7)"/>
            <circle cx="13" cy="15" r="0.7" fill="rgba(255,255,255,0.5)"/>
          </svg>
        </div>
      </div>

      {/* Wordmark */}
      <div
        className="flex items-baseline gap-1.5 mb-1"
        style={{ animation: 'fadeIn 0.6s ease-out both' }}
      >
        <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
          LabLink
        </span>
        <span style={{ fontSize: 20, fontWeight: 300, color: '#2563eb', letterSpacing: '-0.03em' }}>
          AI
        </span>
      </div>

      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#94a3b8',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 28,
          animation: 'fadeIn 0.6s ease-out 0.15s both',
        }}
      >
        Diagnostic Platform
      </p>

      {/* Slim progress bar */}
      <div
        style={{
          width: 160,
          height: 2,
          borderRadius: 99,
          background: '#e2e8f0',
          marginBottom: 14,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 99,
            background: 'linear-gradient(90deg, #2563eb, #6366f1)',
            width: `${Math.min(progress, 100)}%`,
            transition: 'width 0.15s ease-out',
          }}
        />
      </div>

      {/* Message + bouncing dots */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#94a3b8',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <span>{message}</span>
        <span style={{ display: 'flex', gap: 2 }}>
          {[0, 0.18, 0.36].map((delay, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: '#2563eb',
                animation: `dot 1s ease-in-out infinite ${delay}s`,
              }}
            />
          ))}
        </span>
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1);    opacity: 0.2; }
          50%       { transform: scale(1.18); opacity: 0.08; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.25; }
          40%            { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;

