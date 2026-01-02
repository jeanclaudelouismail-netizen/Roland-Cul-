
import React from 'react';

export const StinkLines: React.FC = () => {
  return (
    <div className="absolute top-0 right-0 p-4 pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className="stink-line" 
          style={{ 
            left: `${i * 15}px`, 
            animationDelay: `${i * 0.5}s`,
            opacity: 0.2
          }} 
        />
      ))}
    </div>
  );
};
