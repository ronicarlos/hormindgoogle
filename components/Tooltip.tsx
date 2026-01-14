
import React, { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode; 
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
      onClick={() => setIsVisible(!isVisible)} // Mobile tap support
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[999] px-3 py-2.5 text-[11px] font-medium text-white bg-gray-900 shadow-2xl rounded-xl w-48 whitespace-normal leading-relaxed transition-all duration-200 border border-gray-700 flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 ${
            position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
            position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
            position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' :
            'right-full top-1/2 -translate-y-1/2 mr-2'
        }`}>
            {/* Mobile Viewport Guard: Ensure it doesn't overflow horizontally on small screens */}
            <div className="w-full flex flex-col items-center">
                {content}
            </div>
            
            {/* Arrow */}
            <div className={`absolute w-2.5 h-2.5 bg-gray-900 transform rotate-45 border-gray-700 ${
                position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r' :
                position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l' :
                position === 'right' ? 'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l' :
                'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r'
            }`} />
        </div>
      )}
    </div>
  );
};
