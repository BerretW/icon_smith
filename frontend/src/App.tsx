import React, { useState } from 'react';
import { AppMode, ColorMode, AuthState } from './types';
import { apiFetch, getStoredUser, getAuthToken, logout } from './services/api'; 
import { Loader } from './components/Loader';
import { GeneratedResult } from './components/GeneratedResult';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { 
  ArrowPathIcon, 
  PhotoIcon, 
  PencilSquareIcon, 
  Cog6ToothIcon, 
  Square2StackIcon, // Pro Ilustraci
  StopIcon          // Pro Ikonu
} from '@heroicons/react/24/outline';

// Definice nového typu pro velikost/styl výstupu
type OutputType = 'icon' | 'illustration';

const App: React.FC = () => {
  // --- Auth State ---
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    return { isAuthenticated: !!token, token, user };
  });

  // --- App State ---
  const [mode, setMode] = useState<AppMode>(AppMode.GENERATE);
  const [outputType, setOutputType] = useState<OutputType>('icon'); // Nový state
  const [colorMode, setColorMode] = useState<ColorMode>('bw');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Login Logic ---
  // Pokud není uživatel přihlášen, vrátíme jen Login obrazovku
  if (!auth.isAuthenticated) {
    return (
      <LoginScreen 
        isOpen={true} 
        onClose={() => {}} 
        onLogin={async (username) => {
            // Po úspěšném loginu (který řeší LoginScreen) si načteme data
            const user = getStoredUser();
            const token = getAuthToken();
            if (token && user) {
                setAuth({ isAuthenticated: true, token, user });
            }
        }}
      />
    );
  }

  // --- Handlers ---

  const handleLogout = () => {
    logout();
    setAuth({ isAuthenticated: false, token: null, user: null });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResultImage(null);

    try {
      // Voláme Python backend
      const response = await apiFetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          style: mode === AppMode.GENERATE ? 'inventory' : 'woodcut', // Legacy parametr
          colorMode,
          outputType // Posíláme 'icon' nebo 'illustration'
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Chyba při generování');
      }

      const data = await response.json();
      
      if (data.image) {
          setResultImage(data.image);
      } else {
          throw new Error("Backend nevrátil obrázek.");
      }

    } catch (err: any) {
      setError(err.message || "Nastala chyba.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    // Dynamický název souboru podle typu
    link.download = `rdr2-${outputType}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setResultImage(null);
    setPrompt('');
  };

  return (
    <div className="min-h-screen bg-[#e6e2d3] text-stone-900 font-sans pb-20">
      
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/paper.png')` }}></div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        // Nastavení je nyní řízeno serverem, posíláme dummy data
        settings={{ apiKey: 'SERVER_MANAGED', modelId: 'SERVER_MANAGED' } as any} 
        onSave={() => setIsSettingsOpen(false)}
        onOpenLogin={() => {}}
        onLogout={handleLogout}
        isAuthenticated={true}
        username={auth.user?.username}
      />

      {/* Header */}
      <header className="bg-[#8a0303] text-[#f3f0e8] py-6 border-b-4 border-stone-900 shadow-lg relative">
        <div className="container mx-auto px-4 flex justify-between items-center relative z-10">
          <div>
              <h1 className="font-serif text-2xl md:text-4xl tracking-[0.2em] uppercase font-bold">
                WestHawen Icon Smith
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-xs text-[#e6e2d3]/70 font-serif italic">
                   System Online • {auth.user?.username}
                </p>
              </div>
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-stone-900/50 rounded-full hover:bg-stone-900 transition-colors border border-[#f3f0e8]/20 group"
          >
            <Cog6ToothIcon className="w-6 h-6 text-[#f3f0e8] group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        {/* Mode Switcher (Generovat / Transformovat) */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#dcd8c8] p-1 rounded-sm border-2 border-stone-800 shadow-md flex">
            <button
              onClick={() => setMode(AppMode.GENERATE)}
              className={`flex items-center px-6 py-3 font-serif uppercase tracking-widest text-sm transition-all ${
                mode === AppMode.GENERATE ? 'bg-stone-800 text-[#f3f0e8]' : 'text-stone-600 hover:bg-[#cfcbb8]'
              }`}
            >
              <PencilSquareIcon className="w-5 h-5 mr-2" />
              Generovat
            </button>
            <button
              disabled
              className="flex items-center px-6 py-3 font-serif uppercase tracking-widest text-sm text-stone-400 cursor-not-allowed border-l border-stone-400/30"
              title="Transformace obrázků zatím není na serveru povolena"
            >
              <PhotoIcon className="w-5 h-5 mr-2" />
              Z obrázku
            </button>
          </div>
        </div>

        {/* Input Area */}
        {!resultImage && !loading && (
          <div className="bg-[#f3f0e8] p-8 border border-stone-400 shadow-xl max-w-2xl mx-auto relative animate-in fade-in duration-500">
             {/* Paper decorative line */}
             <div className="absolute top-0 left-0 w-full h-1 bg-stone-300 opacity-50"></div>
             
             <h2 className="font-serif text-2xl mb-6 text-stone-800 border-b-2 border-stone-300 pb-2 uppercase tracking-wide text-center">
              Specifikace Zakázky
             </h2>

             {/* 1. VÝBĚR TYPU VÝSTUPU (Nový přepínač) */}
             <div className="mb-6">
               <label className="block text-stone-500 font-serif text-xs uppercase mb-3 text-center tracking-widest">Typ výstupu</label>
               <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  {/* Tlačítko IKONA */}
                  <button 
                    onClick={() => setOutputType('icon')}
                    className={`flex items-center justify-center px-6 py-4 border-2 transition-all w-full sm:w-auto min-w-[160px] ${
                      outputType === 'icon' 
                        ? 'border-stone-800 bg-[#dcd8c8] text-stone-900 shadow-inner ring-1 ring-stone-800/20' 
                        : 'border-stone-300 text-stone-500 hover:border-stone-400 hover:bg-[#eae7dc]'
                    }`}
                  >
                    <StopIcon className="w-6 h-6 mr-3 opacity-80" />
                    <div className="text-left">
                      <div className="font-serif text-sm font-bold uppercase tracking-wider">Ikona</div>
                      <div className="text-[10px] font-sans opacity-70">100x100px</div>
                    </div>
                  </button>

                  {/* Tlačítko ILUSTRACE */}
                  <button 
                    onClick={() => setOutputType('illustration')}
                    className={`flex items-center justify-center px-6 py-4 border-2 transition-all w-full sm:w-auto min-w-[160px] ${
                      outputType === 'illustration' 
                        ? 'border-stone-800 bg-[#dcd8c8] text-stone-900 shadow-inner ring-1 ring-stone-800/20' 
                        : 'border-stone-300 text-stone-500 hover:border-stone-400 hover:bg-[#eae7dc]'
                    }`}
                  >
                    <Square2StackIcon className="w-6 h-6 mr-3 opacity-80" />
                    <div className="text-left">
                      <div className="font-serif text-sm font-bold uppercase tracking-wider">Dřevoryt</div>
                      <div className="text-[10px] font-sans opacity-70">500x500px</div>
                    </div>
                  </button>
               </div>
             </div>

             {/* 2. VÝBĚR BARVY */}
             <div className="mb-6 flex justify-center">
                 <div className="flex border border-stone-400 rounded overflow-hidden">
                    <button 
                      onClick={() => setColorMode('bw')} 
                      className={`px-5 py-2 text-xs font-serif uppercase tracking-widest transition-colors ${
                        colorMode === 'bw' ? 'bg-stone-800 text-white' : 'bg-transparent text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Černobílá
                    </button>
                    <button 
                      onClick={() => setColorMode('color')} 
                      className={`px-5 py-2 text-xs font-serif uppercase tracking-widest transition-colors ${
                        colorMode === 'color' ? 'bg-[#8a0303] text-white' : 'bg-transparent text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Barevná
                    </button>
                 </div>
             </div>

             {/* 3. TEXT AREA */}
             <div className="relative">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={outputType === 'icon' 
                      ? "Popis ikony (např. Revolver, Lahev Whiskey, Jablko)..." 
                      : "Popis ilustrace (např. Pohled na hory, Medvěd v lese, Saloon)..."}
                    className="w-full bg-[#e6e2d3] border-2 border-stone-400 p-4 font-serif text-lg min-h-[140px] focus:border-[#8a0303] outline-none placeholder-stone-500/50 resize-none"
                />
                <div className="absolute bottom-2 right-2 text-[10px] text-stone-500 font-serif uppercase">
                  AI Model: Gemini 2.5
                </div>
             </div>

             {error && (
               <div className="mt-4 text-red-900 font-serif text-sm bg-red-100/80 p-3 border-l-4 border-red-800">
                 {error}
               </div>
             )}

             <button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className={`mt-6 w-full py-4 font-serif text-xl uppercase tracking-widest shadow-md transition-all relative group overflow-hidden ${
                !prompt.trim() 
                  ? 'bg-stone-400 text-stone-200 cursor-not-allowed' 
                  : 'bg-[#8a0303] text-[#f3f0e8] hover:bg-[#660000] active:translate-y-1'
              }`}
            >
              <span className="relative z-10 flex items-center justify-center">
                 {outputType === 'icon' ? 'Vyřezat Ikonu' : 'Nakreslit Ilustraci'}
                 <ArrowPathIcon className={`w-5 h-5 ml-2 ${!prompt.trim() ? '' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
              </span>
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && <Loader />}

        {/* Result Area */}
        {resultImage && (
          <GeneratedResult 
            imageUrl={resultImage} 
            onDownload={handleDownload} 
            onClear={handleClear} 
          />
        )}

      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 w-full bg-stone-900 text-[#6b665c] py-2 text-center text-[10px] font-serif uppercase tracking-widest border-t border-[#8a0303] z-50">
        RDR2 Icon Generator • {new Date().getFullYear()} • Powered by Gemini 2.5
      </footer>
    </div>
  );
};

export default App;