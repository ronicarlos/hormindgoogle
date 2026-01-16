
import React from 'react';

interface BodyGuideProps {
    part: string;
    gender: 'Masculino' | 'Feminino';
    className?: string;
}

const BodyGuide: React.FC<BodyGuideProps> = ({ part, gender, className }) => {
    const isMale = gender === 'Masculino';
    
    // Silhuetas simplificadas
    const silhouette = isMale 
        ? "M35,10 C35,5 45,5 45,10 L48,15 L65,18 L62,40 L55,80 L58,140 L50,140 L48,85 L40,85 L38,140 L30,140 L33,80 L26,40 L23,18 L40,15 Z"
        : "M38,10 C38,5 46,5 46,10 L48,15 L60,20 L58,40 L65,55 L60,85 L62,140 L52,140 L50,90 L38,90 L36,140 L26,140 L28,85 L23,55 L30,40 L28,20 L40,15 Z";

    // Guias de medição (linhas vermelhas pontilhadas)
    const guides: Record<string, React.ReactNode> = {
        chest: <line x1="28" y1="32" x2="60" y2="32" stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />,
        arm: <line x1="18" y1="35" x2="28" y2="35" stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />,
        waist: <line x1="30" y1={isMale ? "60" : "50"} x2={isMale ? "58" : "58"} y2={isMale ? "60" : "50"} stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />,
        hips: <line x1="25" y1={isMale ? "75" : "70"} x2={isMale ? "63" : "63"} y2={isMale ? "75" : "70"} stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />,
        thigh: <line x1="50" y1="100" x2="62" y2="100" stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />,
        calf: <line x1="52" y1="125" x2="60" y2="125" stroke="#ef4444" strokeWidth="3" strokeDasharray="3 1" />
    };

    return (
        <svg width="60" height="100" viewBox="0 0 90 150" className={`opacity-90 ${className}`}>
            <path d={silhouette} fill="#374151" stroke="none" opacity="0.3" />
            {guides[part] || null}
        </svg>
    );
};

export default BodyGuide;
