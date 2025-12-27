import React, { useState } from 'react';
import { loginUser } from '../services/api'; // Import API služby
import { Loader } from './Loader';

interface LoginScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (username: string) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError("Je nutné vyplnit jméno i heslo.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // 1. Volání Python backendu přes api.ts
      const data = await loginUser({ username, password });
      
      // 2. Pokud backend vrátí úspěch (token se uloží v api.ts),
      // informujeme App.tsx, že uživatel je přihlášen.
      await onLogin(data.user.username);
      
      // Modal se zavře automaticky díky změně stavu v App.tsx
    } catch (err: any) {
      console.error("Login Error:", err);
      // Zobrazíme chybu, kterou vrátil backend (např. "Neplatné údaje")
      setError(err.message || "Přihlášení se nezdařilo. Zkuste to znovu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop - tmavé pozadí */}
      <div className="absolute inset-0 bg-stone-900/95 backdrop-blur-sm"></div>

      {/* Main Card */}
      <div className="relative bg-[#f3f0e8] w-full max-w-lg border-[6px] border-double border-stone-800 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        
        {/* Texture Overlay inside card */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-multiply" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/paper.png')` }}></div>

        {/* Decorative Corners */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-stone-800"></div>
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-stone-800"></div>
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-stone-800"></div>
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-stone-800"></div>

        {/* Header */}
        <div className="bg-[#8a0303] text-[#f3f0e8] p-6 text-center border-b-4 border-stone-900 relative">
          <h2 className="font-serif text-3xl uppercase tracking-[0.2em] font-bold">Identifikace</h2>
          <p className="font-serif italic text-sm text-[#e6e2d3] opacity-80 mt-1">
            Restricted Access • Admin Only
          </p>
        </div>

        {/* Form Content */}
        <div className="p-8 md:p-10 relative z-10">
          
          <div className="mb-8 text-center">
             <p className="font-serif text-stone-700 leading-relaxed">
               Tento systém je chráněn. Pro přístup k generátoru ikon zadejte své přihlašovací údaje.
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="block text-stone-800 font-serif text-xs uppercase font-bold tracking-widest">
                Uživatelské Jméno
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#e6e2d3] border-b-2 border-stone-400 p-3 font-mono text-lg text-stone-900 focus:outline-none focus:border-[#8a0303] focus:bg-[#dcd8c8] transition-colors placeholder-stone-400"
                placeholder="Zadejte jméno..."
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="block text-stone-800 font-serif text-xs uppercase font-bold tracking-widest">
                Heslo
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#e6e2d3] border-b-2 border-stone-400 p-3 font-mono text-lg text-stone-900 focus:outline-none focus:border-[#8a0303] focus:bg-[#dcd8c8] transition-colors placeholder-stone-400"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 border-l-4 border-red-800 text-red-900 text-sm font-serif animate-pulse">
                {error}
              </div>
            )}

            <div className="pt-4">
              {isLoading ? (
                <div className="flex justify-center py-2">
                   {/* Custom loader ve stylu RDR */}
                   <div className="w-8 h-8 border-4 border-stone-300 border-t-[#8a0303] rounded-full animate-spin"></div>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-stone-900 text-[#f3f0e8] py-4 font-serif text-xl uppercase tracking-[0.2em] hover:bg-[#8a0303] transition-all shadow-lg active:scale-[0.98] border border-stone-900"
                >
                  Vstoupit
                </button>
              )}
            </div>
          </form>

          {/* Odkaz "Zrušit" je skrytý, pokud je login povinný, ale můžeme ho tam nechat pro efekt */}
          <div className="mt-6 text-center opacity-50">
             <span className="text-xs font-serif text-stone-500 uppercase">
                Saint Denis • Lemoyne • 1899
             </span>
          </div>
        </div>

        {/* Footer stamp */}
        <div className="absolute bottom-4 right-4 opacity-10 pointer-events-none rotate-[-15deg]">
          <div className="border-4 border-stone-900 p-2 rounded-full">
            <span className="font-serif text-stone-900 font-bold text-xl uppercase">Vyžadováno</span>
          </div>
        </div>

      </div>
    </div>
  );
};