
import React from 'react';

export const StinkLines: React.FC = () => {
  return (
    <div className="flex gap-1 h-3 items-end overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i} 
          className="w-[1px] bg-green-900/40 blur-[1px]" 
          style={{ 
            height: '100%',
            animation: `drift ${1.5 + i * 0.5}s infinite ease-in-out`,
            animationDelay: `${i * 0.3}s`
          }} 
        />
      ))}
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translateY(0) scaleY(1); opacity: 0.2; }
          50% { transform: translateY(-10px) scaleY(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};
