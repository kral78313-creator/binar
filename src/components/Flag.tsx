import React from 'react';

interface FlagProps {
  lang: 'en' | 'tr' | 'fr' | 'de' | 'ar';
  className?: string;
}

export const Flag: React.FC<FlagProps> = ({ lang, className = "w-6 h-6" }) => {
  const containerClass = `${className} inline-flex items-center justify-center overflow-hidden border border-slate-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] rounded-sm select-none shrink-0`;

  switch (lang) {
    case 'en':
      // England flag (St George's Cross) as per user requested image
      return (
        <span className={containerClass}>
          <svg viewBox="0 0 3 2" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="3" height="2" fill="#ffffff" />
            <rect y="0.8" width="3" height="0.4" fill="#cf142b" />
            <rect x="1.3" width="0.4" height="2" fill="#cf142b" />
          </svg>
        </span>
      );
    case 'de':
      // Germany flag
      return (
        <span className={containerClass}>
          <svg viewBox="0 0 5 3" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="5" height="1" fill="#000000" />
            <rect y="1" width="5" height="1" fill="#dd0000" />
            <rect y="2" width="5" height="1" fill="#ffce00" />
          </svg>
        </span>
      );
    case 'fr':
      // France flag
      return (
        <span className={containerClass}>
          <svg viewBox="0 0 3 2" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="1" height="2" fill="#00209f" />
            <rect x="1" width="1" height="2" fill="#ffffff" />
            <rect x="2" width="1" height="2" fill="#f42c3e" />
          </svg>
        </span>
      );
    case 'tr':
      // Turkish flag (Red background, white crescent and star)
      return (
        <span className={`${containerClass} rounded-md`}>
          <svg viewBox="0 0 150 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="150" height="100" fill="#e30a17" />
            <circle cx="50" cy="50" r="25" fill="#ffffff" />
            <circle cx="56.25" cy="50" r="20" fill="#e30a17" />
            <polygon 
              points="76.25,40 79.19,46.06 85.88,47.03 81.06,51.73 82.2,58.39 76.25,55.24 70.3,58.39 71.44,51.73 66.62,47.03 73.31,46.06" 
              fill="#ffffff" 
              transform="rotate(-18 76.25 50)"
            />
          </svg>
        </span>
      );
    case 'ar':
      // Saudi Arabia flag (Arabic language)
      return (
        <span className={containerClass}>
          <svg viewBox="0 0 3 2" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Green background */}
            <rect width="3" height="2" fill="#006C35" />
            
            {/* Highly stylized Shahada calligraphy for premium look */}
            <g fill="#ffffff" transform="translate(0.5, 0.3) scale(0.0085)">
              {/* Left group of script */}
              <path d="M20,40 Q25,10 32,10 T40,40 Q35,55 28,55 T20,40 Z" opacity="0.9" />
              <path d="M48,25 Q52,15 58,15 T64,25 Q60,35 54,35 T48,25 Z" opacity="0.9" />
              <path d="M72,10 L76,10 L72,50 L68,50 Z M82,15 L86,15 L82,45 L78,45 Z" />
              
              {/* Middle complex group of script */}
              <path d="M100,30 C105,15 115,10 120,10 C125,10 128,15 125,25 C120,38 112,45 105,45 C100,45 98,38 100,30 Z" />
              <path d="M135,20 Q142,5 150,5 T158,20 Q152,35 145,35 T135,20 Z" opacity="0.95" />
              <path d="M165,15 L169,15 L165,48 L161,48 Z M175,10 L179,10 L175,52 L171,52 Z" />
              
              {/* Right group of script */}
              <path d="M190,35 Q195,15 202,15 T210,35 Q205,50 198,50 T190,35 Z" opacity="0.9" />
              <path d="M218,20 Q225,8 232,8 T240,20 Q235,32 228,32 T218,20 Z" />
            </g>
            
            {/* White Sword (pointing left, handled right as on SA flag) */}
            <g fill="#ffffff" transform="translate(0.7, 1.35) scale(0.8)">
              {/* Sword blade, guard, hilt and pommel */}
              {/* Blade */}
              <path d="M 0.05 0.10 L 1.70 0.10 Q 1.73 0.10 1.75 0.12 L 1.75 0.14 Q 1.73 0.16 1.70 0.16 L 0.05 0.16 C 0.01 0.16 -0.02 0.14 -0.05 0.13 Z" />
              {/* Crossguard */}
              <path d="M 1.68 0.01 L 1.73 0.01 C 1.75 0.01 1.76 0.02 1.76 0.04 L 1.76 0.22 C 1.76 0.24 1.75 0.25 1.73 0.25 L 1.68 0.25 C 1.66 0.25 1.65 0.24 1.65 0.22 L 1.65 0.04 C 1.65 0.02 1.66 0.01 1.68 0.01 Z" />
              {/* Handle / Grip */}
              <rect x="1.76" y="0.09" width="0.14" height="0.08" rx="0.02" />
              {/* Pommel (curved handguard tail on handle) */}
              <path d="M 1.90 0.06 C 1.94 0.06 1.96 0.09 1.96 0.13 C 1.96 0.17 1.93 0.20 1.88 0.20 L 1.84 0.20 C 1.84 0.16 1.87 0.13 1.87 0.11" />
            </g>
          </svg>
        </span>
      );
    default:
      return null;
  }
};
