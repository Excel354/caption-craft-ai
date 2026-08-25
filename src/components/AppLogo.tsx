import React from 'react';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = true,
  theme = 'auto',
  className = '',
}) => {
  const iconDimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }[size];

  const textSizes = {
    sm: { primary: 'text-sm font-bold tracking-tight', secondary: 'text-[10px] font-semibold tracking-wider' },
    md: { primary: 'text-base font-extrabold tracking-tight', secondary: 'text-xs font-bold tracking-wider' },
    lg: { primary: 'text-xl font-extrabold tracking-tight', secondary: 'text-sm font-bold tracking-wider' },
    xl: { primary: 'text-2xl font-black tracking-tight', secondary: 'text-base font-bold tracking-wider' },
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Visual Squircle Badge matching uploaded logo */}
      <div
        className={`${iconDimensions} rounded-xl shadow-md shadow-purple-500/20 bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#2563EB] flex items-center justify-center relative p-1.5 shrink-0 overflow-hidden group`}
      >
        {/* Glow & Sparkle accents */}
        <div className="absolute top-1 left-1.5 text-[8px] leading-none text-[#FACC15] filter drop-shadow">
          ✦
        </div>
        <div className="absolute top-2.5 left-3 text-[5px] leading-none text-[#FDE047] filter drop-shadow">
          ✦
        </div>

        {/* Notepad icon with lines */}
        <div className="w-[70%] h-[60%] bg-white rounded-md shadow-xs flex flex-col justify-center px-1 space-y-0.5 relative z-10">
          <div className="h-[2px] w-[80%] bg-[#7C3AED] rounded-full"></div>
          <div className="h-[2px] w-[60%] bg-[#8B5CF6] rounded-full"></div>
          <div className="h-[2px] w-[40%] bg-[#A78BFA] rounded-full"></div>
        </div>

        {/* Stylized slanted pencil */}
        <div className="absolute bottom-1 right-1 w-2.5 h-4 bg-[#172554] rounded-xs rotate-[32deg] z-20 shadow-xs border-t border-[#EDE9FE]/80 flex flex-col justify-end items-center pb-[1px]">
          <div className="w-1 h-1 bg-[#FACC15] rounded-full"></div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`${textSizes.primary} ${
              theme === 'dark'
                ? 'text-white'
                : theme === 'light'
                ? 'text-[#172554]'
                : 'text-[#172554] dark:text-white'
            }`}
          >
            Caption
          </span>
          <span className={`${textSizes.secondary} text-[#7C3AED] dark:text-[#A78BFA] uppercase font-mono`}>
            Generator
          </span>
        </div>
      )}
    </div>
  );
};
