import React from 'react';

export const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-stone-800 border-t-red-800 rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-2 border-stone-400 border-b-red-800 rounded-full animate-spin reverse-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
      </div>
      <p className="text-stone-800 font-serif tracking-widest text-sm uppercase animate-pulse">
        Vyřezávání ikony...
      </p>
    </div>
  );
};
