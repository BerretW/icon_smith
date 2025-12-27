import React from 'react';
import { ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';

interface GeneratedResultProps {
  imageUrl: string;
  onDownload: () => void;
  onClear: () => void;
}

export const GeneratedResult: React.FC<GeneratedResultProps> = ({ imageUrl, onDownload, onClear }) => {
  
  // Styl pro šachovnicové pozadí (kontrola průhlednosti)
  const checkerboardStyle = {
    backgroundColor: '#f3f0e8',
    backgroundImage: `
      linear-gradient(45deg, #e5e5e5 25%, transparent 25%),
      linear-gradient(-45deg, #e5e5e5 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #e5e5e5 75%),
      linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)
    `,
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
  };

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 pb-12">
      
      {/* Presentation Box - Katalogový styl */}
      <div className="bg-[#f3f0e8] p-1 border-4 border-double border-stone-800 shadow-2xl relative max-w-lg w-full">
        
        {/* Vnitřní ohraničení */}
        <div className="border border-stone-400 p-6">
            
            {/* Corner Ornaments */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-stone-800"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-stone-800"></div>
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-stone-800"></div>
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-stone-800"></div>

            <h3 className="text-center font-serif text-stone-900 text-xl mb-6 border-b border-stone-300 pb-2 uppercase tracking-widest">
            Hotová Zakázka
            </h3>

            {/* --- MAIN PREVIEW (Checkerboard) --- */}
            <div className="flex justify-center mb-8">
            <div className="relative group p-1 border border-stone-300 shadow-inner" style={checkerboardStyle}>
                <div className="absolute top-0 left-0 bg-stone-200 text-[10px] px-1 text-stone-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    Transparent Check
                </div>
                <img 
                src={imageUrl} 
                alt="Generated Result" 
                className="w-full max-w-[350px] h-auto object-contain min-h-[200px]"
                />
            </div>
            </div>

            {/* --- CONTEXT PREVIEWS (Small) --- */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {/* 1. Inventory Style (Dark) */}
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-serif text-stone-500 mb-1 uppercase tracking-wider">Inventář (Dark)</span>
                    <div className="w-24 h-24 bg-stone-900 rounded border border-stone-600 flex items-center justify-center overflow-hidden relative shadow-md">
                        {/* Radial gradient pro efekt inventáře */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-800 to-stone-950"></div>
                        <img src={imageUrl} alt="Dark Preview" className="w-20 h-20 object-contain relative z-10 opacity-90" />
                    </div>
                </div>

                {/* 2. Journal Style (Paper) */}
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-serif text-stone-500 mb-1 uppercase tracking-wider">Deník (Paper)</span>
                    <div className="w-24 h-24 bg-[#e6e2d3] rounded border border-stone-400 flex items-center justify-center overflow-hidden relative shadow-md">
                        <img src={imageUrl} alt="Paper Preview" className="w-20 h-20 object-contain mix-blend-multiply opacity-80" />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-stone-300">
            <button 
                onClick={onDownload}
                className="flex-1 flex items-center justify-center bg-[#8a0303] text-[#f3f0e8] font-serif py-3 px-4 hover:bg-[#660000] transition-all uppercase tracking-wider text-sm shadow-md group"
            >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Stáhnout
            </button>
            <button 
                onClick={onClear}
                className="flex-none flex items-center justify-center border border-stone-400 text-stone-600 font-serif py-3 px-4 hover:bg-stone-200 hover:text-red-900 transition-colors uppercase tracking-wider text-sm"
                title="Zahodit a začít znovu"
            >
                <TrashIcon className="w-5 h-5" />
            </button>
            </div>
        </div>
      </div>

      <div className="mt-4 text-stone-500 text-xs font-serif italic opacity-60">
        * Obrázek je vygenerován ve formátu PNG s průhledností.
      </div>
    </div>
  );
};