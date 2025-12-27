import React, { useState } from 'react';
import { AppSettings, GeminiModelId } from '../types';
import { XMarkIcon, KeyIcon, CpuChipIcon, UserIcon } from '@heroicons/react/24/outline';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onOpenLogin: () => void; // Changed from onLoginMock to onOpenLogin
  onLogout: () => void;
  isAuthenticated: boolean;
  username?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, settings, onSave, onOpenLogin, onLogout, isAuthenticated, username 
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-[#f3f0e8] w-full max-w-md border-4 border-double border-stone-800 shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#8a0303] text-[#f3f0e8] p-4 flex justify-between items-center border-b-2 border-stone-900">
          <h2 className="font-serif text-xl uppercase tracking-widest">Nastavení</h2>
          <button onClick={onClose} className="hover:text-stone-300 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Auth Section */}
          <div className="border border-stone-400 p-4 bg-[#e6e2d3] relative">
            <span className="absolute -top-3 left-3 bg-[#e6e2d3] px-2 text-xs font-serif text-stone-600 uppercase">Účet (JWT)</span>
            {isAuthenticated ? (
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center text-stone-800 font-serif">
                     <UserIcon className="w-5 h-5 mr-2" />
                     <span className="font-bold">{username}</span>
                   </div>
                   <span className="text-green-700 text-xs font-bold uppercase border border-green-700 px-2 py-0.5">Aktivní</span>
                 </div>
                 <button 
                  onClick={onLogout}
                  className="w-full text-xs text-red-800 hover:text-red-900 hover:underline text-left font-serif"
                 >
                   Odhlásit se
                 </button>
               </div>
            ) : (
               <div className="flex flex-col space-y-2">
                 <p className="text-xs text-stone-600 font-serif italic mb-2">Přihlaste se pro synchronizaci historie a nastavení.</p>
                 <button 
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="w-full bg-stone-800 text-[#f3f0e8] py-2 font-serif uppercase text-sm hover:bg-stone-700 transition-colors"
                 >
                   Přihlásit se
                 </button>
               </div>
            )}
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="flex items-center text-stone-800 font-serif text-sm uppercase font-bold">
              <KeyIcon className="w-4 h-4 mr-2" />
              Gemini API Klíč
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={localSettings.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                placeholder="Vložte svůj API klíč..."
                className="w-full bg-[#e6e2d3] border-2 border-stone-400 p-3 font-mono text-sm focus:outline-none focus:border-[#8a0303] transition-colors"
              />
              <button 
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-xs text-stone-500 uppercase font-serif hover:text-[#8a0303]"
              >
                {showKey ? 'Skrýt' : 'Zobrazit'}
              </button>
            </div>
            <p className="text-[10px] text-stone-500 font-serif leading-tight">
              Klíč je uložen pouze ve vašem prohlížeči (LocalStorage).
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="flex items-center text-stone-800 font-serif text-sm uppercase font-bold">
              <CpuChipIcon className="w-4 h-4 mr-2" />
              Model AI
            </label>
            <select
              value={localSettings.modelId}
              onChange={(e) => handleChange('modelId', e.target.value)}
              className="w-full bg-[#e6e2d3] border-2 border-stone-400 p-3 font-serif text-sm focus:outline-none focus:border-[#8a0303] transition-colors appearance-none"
            >
              <option value="gemini-2.5-flash-image">Gemini 2.5 Flash (Rychlý, Levný)</option>
              <option value="gemini-3-pro-image-preview">Gemini 3 Pro (Vysoká kvalita)</option>
            </select>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-[#e6e2d3] p-4 flex justify-end space-x-3 border-t border-stone-300">
           <button 
            onClick={onClose}
            className="px-4 py-2 text-stone-600 font-serif uppercase text-sm hover:text-stone-900"
           >
             Zrušit
           </button>
           <button 
            onClick={handleSave}
            className="bg-[#8a0303] text-[#f3f0e8] px-6 py-2 font-serif uppercase tracking-wider text-sm shadow-md hover:bg-[#660000] transition-colors"
           >
             Uložit
           </button>
        </div>
      </div>
    </div>
  );
};
