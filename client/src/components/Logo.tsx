import React from 'react';
import { Activity } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'md-lg' | 'lg';
  className?: string;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '', animate = true }) => {
  let containerSize = '';
  let iconSize = 18;
  let roundedClass = '';
  let shadowClass = '';

  switch (size) {
    case 'sm':
      containerSize = 'w-8 h-8';
      iconSize = 16;
      roundedClass = 'rounded-lg';
      shadowClass = 'shadow-sm';
      break;
    case 'md':
      containerSize = 'w-9 h-9 md:w-10 md:h-10';
      iconSize = 18;
      roundedClass = 'rounded-xl';
      shadowClass = 'shadow-md shadow-brand-500/15';
      break;
    case 'md-lg':
      containerSize = 'w-12 h-12';
      iconSize = 22;
      roundedClass = 'rounded-2xl';
      shadowClass = 'shadow-lg shadow-brand-500/25';
      break;
    case 'lg':
      containerSize = 'w-14 h-14';
      iconSize = 28;
      roundedClass = 'rounded-2xl';
      shadowClass = 'shadow-lg shadow-brand-500/25';
      break;
  }

  const pulseClass = animate ? 'animate-heartbeat' : '';

  return (
    <div
      className={`bg-gradient-to-br from-brand-500 to-accent-400 flex items-center justify-center text-white shrink-0 transition-transform duration-300 ${containerSize} ${roundedClass} ${shadowClass} ${className}`}
    >
      <Activity size={iconSize} className={pulseClass} />
    </div>
  );
};

export default Logo;
