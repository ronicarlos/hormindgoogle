import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[200] px-3 py-2 text-[10px] font-medium text-white bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl w-max max-w-[220px] leading-relaxed transition-all duration-200 border border-white/10 ${
            position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
            position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
            position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' :
            'right-full top-1/2 -translate-y-1/2 mr-2'
        }`}>
            {content}
            {/* Arrow */}
            <div className={`absolute w-2 h-2 bg-gray-900/95 transform rotate-45 ${
                position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' :
                position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' :
                position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' :
                'right-[-4px] top-1/2 -translate-y-1/2'
            }`} />
        </div>
      )}
    </div>
  );
};