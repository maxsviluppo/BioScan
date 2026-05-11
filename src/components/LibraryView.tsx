import React from 'react';
import { motion } from 'motion/react';
import { Leaf, Mountain, TreePine, Info, ChevronRight } from 'lucide-react';

interface LibraryItem {
  id: string;
  name: string;
  scientificName?: string;
  description: string;
  image: string;
}

const LIBRARIES: Record<string, LibraryItem[]> = {
  plants: [],
  rocks: [],
  trees: [],
};

interface LibraryViewProps {
  category: string;
  onClose: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ category, onClose }) => {
  const items = LIBRARIES[category] || [];
  
  if (category === 'info') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed inset-0 z-40 pt-32 px-6 pb-32 overflow-y-auto"
        style={{ background: 'linear-gradient(135deg, var(--color-bg-start) 0%, var(--color-bg-end) 100%)' }}
      >
        <div className="max-w-md mx-auto space-y-10">
          <div className="text-center">
            <div className="w-24 h-24 bg-accent rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-soft">
              <Leaf className="text-white" size={48} />
            </div>
            <h2 className="text-4xl font-black text-text-primary dark:text-white font-display tracking-tight uppercase italic">Bio<span className="text-accent">Scan.</span></h2>
            <p className="text-text-secondary dark:text-stone-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">Versione 1.0.0 • AI Powered</p>
          </div>
          
          <div className="space-y-6 bg-white/60 backdrop-blur-md p-10 rounded-[48px] border border-white shadow-soft">
            <h3 className="text-2xl font-black text-text-primary dark:text-stone-100 font-display uppercase tracking-tight">Cos'è BioScan?</h3>
            <p className="text-text-secondary dark:text-stone-400 leading-relaxed font-bold italic text-sm">
              BioScan Verde è il tuo compagno digitale per l'esplorazione della natura. 
              Grazie all'intelligenza artificiale avanzata, puoi identificare istantaneamente 
              piante, rocce, alberi e molto altro semplicemente scattando una foto.
            </p>
          </div>

          <div className="p-10 bg-accent rounded-[48px] shadow-lg shadow-accent/20 border border-white">
            <h4 className="font-black text-white mb-6 font-display uppercase tracking-widest text-xs">Come funziona?</h4>
            <ul className="space-y-6 text-sm text-white/90 font-bold uppercase tracking-tight">
              <li className="flex gap-4 items-center">
                <span className="w-8 h-8 bg-white text-accent rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-black">1</span>
                <span>Premi il pulsante fotocamera</span>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-8 h-8 bg-white text-accent rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-black">2</span>
                <span>Inquadra l'elemento naturale</span>
              </li>
              <li className="flex gap-4 items-center">
                <span className="w-8 h-8 bg-white text-accent rounded-full flex items-center justify-center text-[10px] flex-shrink-0 font-black">3</span>
                <span>Attendi il responso dell'AI</span>
              </li>
            </ul>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-6 bg-white/50 backdrop-blur-md text-text-primary border border-white rounded-full font-black uppercase tracking-[0.3em] text-[10px] hover:bg-accent hover:text-white transition-all shadow-soft active:scale-95"
          >
            Torna alla Home
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 z-40 pt-32 px-6 pb-32 overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, var(--color-bg-start) 0%, var(--color-bg-end) 100%)' }}
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl font-black text-text-primary dark:text-white capitalize font-display uppercase tracking-tight italic">
            {category === 'plants' ? 'Flora' : category === 'rocks' ? 'Geologia' : 'Alberi'}<span className="text-accent">.</span>
          </h2>
          <button onClick={onClose} className="text-text-secondary font-black uppercase tracking-[0.2em] text-[10px] px-6 py-3 bg-white/50 border border-white rounded-full hover:bg-accent hover:text-white transition-all shadow-sm">Chiudi</button>
        </div>

        <div className="space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-24 px-10 bg-white/60 backdrop-blur-md dark:bg-stone-900 rounded-[48px] border border-white shadow-soft">
                <div className="w-20 h-20 bg-bg-start dark:bg-stone-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Leaf className="text-accent/30" size={40} />
                </div>
                <h3 className="font-black text-text-primary dark:text-white mb-2 font-display uppercase tracking-widest text-lg">In Arrivo</h3>
                <p className="text-text-secondary dark:text-stone-400 text-[10px] uppercase tracking-widest font-black">Enciclopedia in fase di aggiornamento.</p>
            </div>
          ) : items.map((item) => (
            <div key={item.id} className="bg-white/70 backdrop-blur-md dark:bg-stone-900 p-5 rounded-[40px] border border-white dark:border-stone-800 shadow-soft flex gap-5 group cursor-pointer hover:scale-[1.02] transition-all">
              <div className="w-24 h-24 rounded-[32px] overflow-hidden flex-shrink-0 border-[6px] border-white dark:border-stone-800">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 py-1">
                <h3 className="font-black text-text-primary dark:text-stone-100 font-display uppercase tracking-tight text-lg">{item.name}</h3>
                {item.scientificName && <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-2">{item.scientificName}</p>}
                <p className="text-xs text-text-secondary dark:text-stone-400 line-clamp-2 font-bold italic">{item.description}</p>
              </div>
              <div className="flex items-center">
                <ChevronRight size={24} className="text-accent/30 group-hover:text-accent group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
