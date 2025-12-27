import React, { useState, useRef, useEffect } from 'react';
import { AppMode, IconStyle, ColorMode, AppSettings, AuthState } from './types';
import { generateIcon, transformImageToIcon } from './services/geminiService';
import { loginUser, getAuthToken, logout } from './services/api';
import { Loader } from './components/Loader';
import { GeneratedResult } from './components/GeneratedResult';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { ArrowPathIcon, PhotoIcon, PencilSquareIcon, PaintBrushIcon, SwatchIcon, Cog6ToothIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  // --- State: Application ---
  const [mode, setMode] = useState<AppMode>(AppMode.GENERATE);
  const [colorMode, setColorMode] = useState<ColorMode>('bw');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  // --- State: Settings & Auth ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    // Load settings from localStorage or defaults
    const savedKey = localStorage.getItem('rdr2_api_key') || process.env.API_KEY || '';
    const savedModel = localStorage.getItem('rdr2_model') as any || 'gemini-2.5-flash-image';
    return { apiKey: savedKey, modelId: savedModel };
  });

  const [auth, setAuth] = useState<AuthState>(() => {
    const token = getAuthToken();
    const userStr = localStorage.getItem('user_data');
    return {
      isAuthenticated: !!token,
      token: token,
      user: userStr ? JSON.parse(userStr) : null
    };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to save settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('rdr2_api_key', newSettings.apiKey);
    localStorage.setItem('rdr2_model', newSettings.modelId);
  };

  // Helper login action (called from LoginScreen)
  const handleLogin = async (username: string) => {
    try {
      // Pass a dummy password for the mock
      const data = await loginUser({ username, password: 'password' }) as any;
      setAuth({
        isAuthenticated: true,
        token: data.token,
        user: data.user
      });
    } catch (e) {
      console.error("Login failed", e);
      throw e;
    }
  };

  const handleLogout = () => {
    logout();
    setAuth({ isAuthenticated: false, token: null, user: null });
  };

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data:image/png;base64, prefix for API
          const base64Data = reader.result.split(',')[1];
          resolve(base64Data);
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // Helper to remove white background from base64 image
  const removeWhiteBackground = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Image);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Iterate through every pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Heuristic: If pixel is very close to white, make it transparent
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // Alpha to 0
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = base64Image;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!settings.apiKey) {
      setError("Pro pokračování je nutné zadat API klíč v nastavení (ikona ozubeného kola).");
      setIsSettingsOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResultImage(null);

    try {
      let rawImageUrl = '';
      
      if (mode === AppMode.GENERATE) {
        if (!prompt.trim()) {
          throw new Error("Zadejte prosím popis ikony.");
        }
        rawImageUrl = await generateIcon(
          prompt, 
          'inventory', 
          colorMode, 
          settings.apiKey, 
          settings.modelId
        );
      } else {
        if (!selectedFile) {
          throw new Error("Nahrajte prosím obrázek.");
        }
        const base64Data = await fileToBase64(selectedFile);
        rawImageUrl = await transformImageToIcon(
          base64Data, 
          selectedFile.type, 
          prompt, 
          colorMode,
          settings.apiKey,
          settings.modelId
        );
      }

      // Process transparency
      const transparentImageUrl = await removeWhiteBackground(rawImageUrl);
      setResultImage(transparentImageUrl);
    } catch (err: any) {
      setError(err.message || "Nastala neznámá chyba.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `rdr2-icon-${colorMode}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setResultImage(null);
    setPrompt('');
    setSelectedFile(null);
    setPreviewFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#e6e2d3] text-stone-900 font-sans selection:bg-red-900 selection:text-white pb-20">
      
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/paper.png')` }}></div>

      {/* Overlays */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        isAuthenticated={auth.isAuthenticated}
        username={auth.user?.username}
      />

      <LoginScreen 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />

      {/* Header */}
      <header className="bg-[#8a0303] text-[#f3f0e8] py-8 shadow-lg border-b-4 border-stone-900 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h1 className="font-serif text-3xl md:text-5xl tracking-[0.2em] uppercase font-bold drop-shadow-md">
              Arthur's Icon Smith
            </h1>
            <p className="mt-2 text-[#e6e2d3] opacity-80 font-serif italic text-lg">
              Generátor dřevorytů a inventárních ikon
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Login Button in Header (Visible if not authenticated) */}
            {!auth.isAuthenticated && (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center bg-stone-900 text-[#f3f0e8] px-4 py-2 rounded-sm border border-[#e6e2d3]/50 hover:bg-stone-800 transition-colors font-serif uppercase text-xs tracking-wider"
              >
                <UserCircleIcon className="w-5 h-5 mr-2" />
                Přihlásit
              </button>
            )}

            {/* Settings Button */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="group flex items-center bg-stone-900/50 hover:bg-stone-900 p-3 rounded-full border-2 border-[#e6e2d3]/20 transition-all backdrop-blur-sm"
              title="Nastavení"
            >
              <Cog6ToothIcon className="w-6 h-6 text-[#f3f0e8] group-hover:rotate-90 transition-transform duration-500" />
              {(!settings.apiKey) && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-yellow-500 rounded-full animate-pulse border-2 border-stone-900"></span>
              )}
            </button>
          </div>
        </div>
        {/* Grunge effect overlay on header */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        
        {/* Mode Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#dcd8c8] p-1 rounded-sm border-2 border-stone-800 shadow-md flex">
            <button
              onClick={() => setMode(AppMode.GENERATE)}
              className={`flex items-center px-6 py-3 font-serif uppercase tracking-widest text-sm transition-all ${
                mode === AppMode.GENERATE 
                  ? 'bg-stone-800 text-[#f3f0e8] shadow-inner' 
                  : 'text-stone-600 hover:bg-[#cfcbb8]'
              }`}
            >
              <PencilSquareIcon className="w-5 h-5 mr-2" />
              Nová Ikona
            </button>
            <button
              onClick={() => setMode(AppMode.TRANSFORM)}
              className={`flex items-center px-6 py-3 font-serif uppercase tracking-widest text-sm transition-all ${
                mode === AppMode.TRANSFORM 
                  ? 'bg-stone-800 text-[#f3f0e8] shadow-inner' 
                  : 'text-stone-600 hover:bg-[#cfcbb8]'
              }`}
            >
              <PhotoIcon className="w-5 h-5 mr-2" />
              Z obrázku
            </button>
          </div>
        </div>

        {/* Input Area */}
        {!resultImage && !loading && (
          <div className="bg-[#f3f0e8] p-8 border border-stone-400 shadow-xl max-w-2xl mx-auto relative">
            {/* Old Paper Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-stone-300 opacity-50"></div>
            
            <h2 className="font-serif text-2xl mb-6 text-stone-800 border-b-2 border-stone-300 pb-2 uppercase tracking-wide">
              {mode === AppMode.GENERATE ? 'Zadání Zakázky' : 'Překreslení Předlohy'}
            </h2>

            {/* Color Mode Selection */}
            <div className="mb-6 bg-[#e6e2d3] p-3 border border-stone-300 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <span className="font-serif text-stone-700 uppercase text-sm tracking-wider mb-2 sm:mb-0">Styl Ilustrace:</span>
              <div className="flex space-x-2 w-full sm:w-auto">
                 <button 
                  onClick={() => setColorMode('bw')}
                  className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 text-xs uppercase tracking-widest border transition-all ${
                    colorMode === 'bw' 
                      ? 'bg-stone-800 text-[#f3f0e8] border-stone-800' 
                      : 'bg-transparent text-stone-600 border-stone-400 hover:bg-[#dcd8c8]'
                  }`}
                 >
                   <SwatchIcon className="w-4 h-4 mr-2" />
                   Černobílá
                 </button>
                 <button 
                  onClick={() => setColorMode('color')}
                  className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 text-xs uppercase tracking-widest border transition-all ${
                    colorMode === 'color' 
                      ? 'bg-[#8a0303] text-[#f3f0e8] border-[#8a0303]' 
                      : 'bg-transparent text-stone-600 border-stone-400 hover:bg-[#dcd8c8]'
                  }`}
                 >
                   <PaintBrushIcon className="w-4 h-4 mr-2" />
                   Barevná
                 </button>
              </div>
            </div>

            {mode === AppMode.GENERATE ? (
              <div className="space-y-4">
                <label className="block text-stone-600 font-serif text-sm uppercase">Popis předmětu (Bez Textu)</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Např.: Revolver položený na stole, lahev whiskey, mrtvý jelen..."
                  className="w-full bg-[#e6e2d3] border-2 border-stone-400 p-4 font-serif text-lg focus:outline-none focus:border-[#8a0303] focus:ring-1 focus:ring-[#8a0303] transition-colors min-h-[120px] placeholder-stone-500/50"
                />
              </div>
            ) : (
              <div className="space-y-6">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="border-2 border-dashed border-stone-400 bg-[#e6e2d3] p-8 text-center cursor-pointer hover:bg-[#dcd8c8] transition-colors group"
                 >
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     onChange={handleFileChange} 
                     className="hidden" 
                     accept="image/*"
                   />
                   {previewFile ? (
                     <div className="flex flex-col items-center">
                       <img src={previewFile} alt="Preview" className="h-32 object-contain mb-4 mix-blend-multiply opacity-80" />
                       <span className="text-stone-600 font-serif text-sm uppercase group-hover:text-[#8a0303]">Klikněte pro změnu</span>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center">
                        <PhotoIcon className="w-12 h-12 text-stone-400 mb-2 group-hover:text-[#8a0303] transition-colors" />
                        <span className="text-stone-500 font-serif uppercase tracking-wider">Nahrajte obrázek</span>
                     </div>
                   )}
                 </div>

                 <div>
                   <label className="block text-stone-600 font-serif text-sm uppercase mb-2">Dodatečné instrukce (Volitelné)</label>
                   <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Např.: Udělej to více poškrábané, přidej klobouk..."
                    className="w-full bg-[#e6e2d3] border-b-2 border-stone-400 p-2 font-serif focus:outline-none focus:border-[#8a0303] transition-colors"
                   />
                 </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-800 text-red-900 text-sm font-serif">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="mt-8 w-full bg-[#8a0303] text-[#f3f0e8] py-4 font-serif text-xl uppercase tracking-[0.2em] hover:bg-[#660000] transition-all shadow-md active:translate-y-1 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center">
                 {mode === AppMode.GENERATE ? 'Generovat Ikonu' : 'Překreslit'}
                 <ArrowPathIcon className="w-5 h-5 ml-2 group-hover:rotate-180 transition-transform duration-700" />
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

      {/* Footer Decoration */}
      <footer className="fixed bottom-0 left-0 w-full bg-stone-900 text-[#6b665c] py-2 text-center text-xs font-serif uppercase tracking-widest border-t border-[#8a0303]">
        RDR2 Icon Generator © 1899 - Powered by Gemini 2.5
      </footer>
    </div>
  );
};

export default App;
