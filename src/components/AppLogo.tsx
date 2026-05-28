import React from 'react';

export const AppLogo: React.FC<{
  size?: number;
  className?: string;
  rounded?: string;
}> = ({ size = 48, className = '', rounded = '28%' }) => {
  return (
    <div
      className={`relative overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background:
          'radial-gradient(circle at 50% 40%, rgba(197,120,255,0.18) 0%, rgba(170,70,255,0.28) 22%, rgba(120,120,120,0.18) 48%, rgba(120,120,120,0.55) 78%, rgba(122,122,122,0.72) 100%)',
        boxShadow:
          'inset 0 0 30px rgba(255,255,255,0.08), 0 0 18px rgba(179, 76, 255, 0.25)',
      }}
      aria-label="Sonus Music logo"
    >
      <div
        className="absolute inset-0 flex items-center justify-center font-black select-none"
        style={{
          color: '#c15cff',
          fontSize: size * 0.68,
          lineHeight: 1,
          textShadow:
            '0 0 6px rgba(193,92,255,0.55), 0 0 18px rgba(193,92,255,0.45), 0 0 40px rgba(193,92,255,0.22)',
          transform: 'translateY(1%)',
        }}
      >
        S
      </div>
    </div>
  );
};

export default AppLogo;
