import React from 'react';
import { motion } from 'motion/react';
import { X, Settings, ExternalLink, Key, AlertCircle } from 'lucide-react';

interface SettingsViewProps {
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-text-primary/10 backdrop-blur-md overflow-y-auto touch-pan-y"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-white/80 dark:bg-stone-900 shadow-soft backdrop-blur-2xl p-8 sm:p-10 rounded-[48px] border border-white dark:border-stone-800 relative my-auto"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-white/50 border border-white rounded-full transition-all text-text-primary lg:hover:bg-rose-500 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
            <Settings className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-primary dark:text-white font-display uppercase tracking-widest leading-none">Settings</h2>
            <p className="text-text-secondary dark:text-stone-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Configurazione AI</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white/50 dark:bg-stone-800 p-8 rounded-[32px] border border-white dark:border-stone-700 shadow-sm">
            <div className="flex items-center gap-3 text-accent font-black font-display uppercase tracking-[0.1em] text-xs mb-4">
              <Key size={16} />
              <span>Gemini API Key</span>
            </div>
            
            <p className="text-sm text-text-secondary dark:text-stone-400 leading-relaxed font-medium mb-6">
              L'applicazione utilizza il modello Gemini di Google per l'identificazione. Per configurare o aggiornare la tua chiave:
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-black text-accent">1</span>
                </div>
                <p className="text-xs text-text-primary dark:text-stone-300 font-bold">
                  Apri il menu <span className="text-accent italic">Settings</span> di AI Studio Build.
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-black text-accent">2</span>
                </div>
                <p className="text-xs text-text-primary dark:text-stone-300 font-bold">
                  Aggiungi una variabile chiamata <code className="bg-accent/10 px-1.5 py-0.5 rounded text-accent">GEMINI_API_KEY</code>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-black text-accent">3</span>
                </div>
                <p className="text-xs text-text-primary dark:text-stone-300 font-bold">
                  Incolla la tua chiave API ottenuta da Google AI Studio.
                </p>
              </div>
            </div>

            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all"
            >
              Ottieni API Key
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="flex items-center gap-4 p-6 bg-rose-500/5 border border-rose-500/10 rounded-[28px]">
            <AlertCircle size={24} className="text-rose-500 flex-shrink-0" />
            <p className="text-[10px] text-rose-500/80 font-bold uppercase tracking-tight leading-relaxed">
              Attenzione: senza una configurazione corretta, le analisi AI potrebbero fallire.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-10 py-5 bg-text-primary text-white rounded-full font-black uppercase tracking-[0.3em] text-[10px] hover:bg-stone-800 transition-all shadow-lg"
        >
          Chiudi Impostazioni
        </button>
        </motion.div>
    </motion.div>
  );
};
