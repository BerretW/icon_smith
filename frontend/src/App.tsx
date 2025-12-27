import React, { useState, useEffect } from 'react';
import { AppMode, ColorMode, AuthState } from './types';
// Smazali jsme importy geminiService
import { apiFetch, getStoredUser, getAuthToken, logout } from './services/api'; 
import { Loader } from './components/Loader';
import { GeneratedResult } from './components/GeneratedResult';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { ArrowPathIcon, PhotoIcon, PencilSquareIcon, PaintBrushIcon, SwatchIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  // --- Auth State ---
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = getAuthToken();
    const user = getStoredUser();
    return { isAuthenticated: !!token, token, user };
  });

  // --- App State ---
  const [mode, setMode] = useState<AppMode>(AppMode.GENERATE);
  const [colorMode, setColorMode] = useState<ColorMode>('bw');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Settings (jen pro logout nebo info)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Pokud není uživatel přihlášen, zobrazíme JEN LoginScreen
  if (!auth.isAuthenticated) {
    return (
      <LoginScreen 
        isOpen={true} // Vždy otevřeno
        onClose={() => {}} // Nelze zavřít
        onLogin={async (username) => {
            // Login logika je nyní uvnitř LoginScreen komponenty, 
            // ale musíme aktualizovat stav App, až se to povede.
            // Zde uděláme jen refresh stavu, protože LoginScreen volá api.loginUser
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
      // Voláme náš Python backend místo Google API přímo
      const response = await apiFetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          style: mode === AppMode.GENERATE ? 'inventory' : 'woodcut',
          colorMode
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Chyba při generování');
      }

      const data = await response.json();
      // Předpokládáme, že backend vrátí { image: "base64..." }
      if (data.image) {
          setResultImage(data.image);
      } else {
          throw new Error("Backend nevrátil obrázek (viz konzole serveru)");
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
    link.download = `rdr2-icon-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#e6e2d3] text-stone-900 font-sans pb-20">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/paper.png')` }}></div>

      {/* Settings Modal (Simplified) */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={{ apiKey: 'HIDDEN', modelId: 'SERVER-MANAGED' } as any} // Dummy data
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
                Arthur's Icon Smith
              </h1>
              <p className="text-xs text-[#e6e2d3]/70 font-serif italic mt-1">
                Authorized Access Only • {auth.user?.username}
              </p>
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-stone-900/50 rounded-full hover:bg-stone-900 transition-colors border border-[#f3f0e8]/20"
          >
            <Cog6ToothIcon className="w-6 h-6 text-[#f3f0e8]" />
          </button>
        </div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        {/* Mode Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#dcd8c8] p-1 rounded-sm border-2 border-stone-800 shadow-md flex">
            <button
              onClick={() => setMode(AppMode.GENERATE)}
              className={`flex items-center px-6 py-3 font-serif uppercase tracking-widest text-sm transition-all ${
                mode === AppMode.GENERATE ? 'bg-stone-800 text-[#f3f0e8]' : 'text-stone-600 hover:bg-[#cfcbb8]'
              }`}
            >
              <PencilSquareIcon className="w-5 h-5 mr-2" />
              Nová Ikona
            </button>
            <button
              disabled
              className="flex items-center px-6 py-3 font-serif uppercase tracking-widest text-sm text-stone-400 cursor-not-allowed"
              title="Transformace zatím není dostupná přes backend"
            >
              <PhotoIcon className="w-5 h-5 mr-2" />
              Z obrázku (WIP)
            </button>
          </div>
        </div>

        {/* Input Area */}
        {!resultImage && !loading && (
          <div className="bg-[#f3f0e8] p-8 border border-stone-400 shadow-xl max-w-2xl mx-auto relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-stone-300 opacity-50"></div>
             
             {/* Color Mode */}
             <div className="mb-6 flex justify-center">
                 <div className="flex border border-stone-400 rounded overflow-hidden">
                    <button onClick={() => setColorMode('bw')} className={`px-4 py-2 text-xs uppercase ${colorMode === 'bw' ? 'bg-stone-800 text-white' : 'bg-transparent'}`}>BW</button>
                    <button onClick={() => setColorMode('color')} className={`px-4 py-2 text-xs uppercase ${colorMode === 'color' ? 'bg-[#8a0303] text-white' : 'bg-transparent'}`}>Color</button>
                 </div>
             </div>

             <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Popis ikony (např. Revolver na stole)..."
                className="w-full bg-[#e6e2d3] border-2 border-stone-400 p-4 font-serif text-lg min-h-[120px] focus:border-[#8a0303] outline-none"
             />

             {error && <div className="mt-4 text-red-800 font-serif text-sm bg-red-100 p-2">{error}</div>}

             <button
              onClick={handleSubmit}
              className="mt-6 w-full bg-[#8a0303] text-[#f3f0e8] py-4 font-serif text-xl uppercase tracking-widest hover:bg-[#660000] shadow-md transition-all"
            >
              Generovat
            </button>
          </div>
        )}

        {loading && <Loader />}

        {resultImage && (
          <GeneratedResult 
            imageUrl={resultImage} 
            onDownload={handleDownload} 
            onClear={() => setResultImage(null)} 
          />
        )}
      </main>
    </div>
  );
};

export default App;