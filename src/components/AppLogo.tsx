import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
  id?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  id = 'app-logo',
}) => {
  const dimensions = {
    sm: 'h-8 sm:h-9 w-auto max-w-[130px] sm:max-w-[150px]',
    md: 'h-9 sm:h-11 w-auto max-w-[140px] sm:max-w-[180px]',
    lg: 'h-14 sm:h-16 w-auto max-w-[200px]',
    xl: 'h-20 sm:h-24 w-auto max-w-[260px]',
  }[size];

  const iconOnlyDimensions = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-8 h-8 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-14 sm:h-14',
    xl: 'w-16 h-16 sm:w-20 sm:h-20',
  }[size];

  return (
    <div id={id} className={`inline-flex items-center select-none shrink-0 ${className}`}>
      <img
        src="/logo.png"
        alt="Caption Generator"
        className={`${showText ? dimensions : `${iconOnlyDimensions} object-cover rounded-xl`} object-contain filter drop-shadow-xs transition-transform duration-200 hover:scale-[1.02]`}
        loading="eager"
      />
    </div>
  );
};

