import React from 'react';

interface GeneratedResultProps {
  imageUrl: string;
  onDownload: () => void;
  onClear: () => void;
}

export const GeneratedResult: React.FC<GeneratedResultProps> = ({ imageUrl, onDownload, onClear }) => {
  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
      
      {/* Presentation Box - Resembles a catalogue entry */}
      <div className="bg-[#f3f0e8] p-6 border-4 border-double border-stone-800 shadow-2xl relative max-w-sm w-full">
        {/* Corner Ornaments */}
        <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-stone-800"></div>
        <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-stone-800"></div>
        <div className="absolute bottom-1 left-1 w-4 h-4 border-b-2 border-l-2 border-stone-800"></div>
        <div className="absolute bottom-1 right-1 w-4 h-4 border-b-2 border-r-2 border-stone-800"></div>

        <h3 className="text-center font-serif text-stone-900 text-xl mb-4 border-b border-stone-400 pb-2 uppercase tracking-widest">
          Výsledek
        </h3>

        <div className="flex justify-center mb-6">
          {/* Main Image Display - No blending, to show transparency */}
          <div className="relative group">
            <img 
              src={imageUrl} 
              alt="Generated Icon" 
              className="w-64 h-64 object-contain filter contrast-125 sepia-[.1]"
            />
            <div className="absolute -bottom-6 left-0 right-0 text-center text-xs font-serif text-stone-500 italic">
              Náhled (Full Size)
            </div>
          </div>
        </div>

        {/* 100x100 Preview */}
        <div className="flex flex-col items-center mb-6 bg-stone-200 p-4 border border-stone-400 inset-shadow">
          <span className="text-xs font-serif text-stone-600 mb-2 uppercase">100x100 Náhled ve hře</span>
          <img 
            src={imageUrl} 
            alt="Icon Small" 
            width={100}
            height={100}
            className="w-[100px] h-[100px] object-contain border border-stone-400 bg-[#f3f0e8]"
          />
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={onDownload}
            className="flex-1 bg-stone-900 text-[#f3f0e8] font-serif py-2 px-4 hover:bg-red-900 transition-colors uppercase tracking-wider text-sm shadow-md"
          >
            Stáhnout
          </button>
          <button 
            onClick={onClear}
            className="flex-1 border border-stone-900 text-stone-900 font-serif py-2 px-4 hover:bg-stone-300 transition-colors uppercase tracking-wider text-sm"
          >
            Zahodit
          </button>
        </div>
      </div>
    </div>
  );
};
