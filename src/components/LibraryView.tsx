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
        className="fixed inset-0 z-40 bg-[#FDFCF8] dark:bg-stone-950 pt-24 px-6 pb-32 overflow-y-auto"
      >
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-100 dark:shadow-none">
              <Leaf className="text-white" size={40} />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 dark:text-white">BioScan Verde</h2>
            <p className="text-stone-500 dark:text-stone-400">Versione 1.0.0</p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-stone-800 dark:text-stone-100">Cos'è BioScan?</h3>
            <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
              BioScan Verde è il tuo compagno digitale per l'esplorazione della natura. 
              Grazie all'intelligenza artificiale avanzata, puoi identificare istantaneamente 
              piante, rocce, alberi e molto altro semplicemente scattando una foto.
            </p>
          </div>

          <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
            <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2">Come funziona?</h4>
            <ul className="space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
              <li className="flex gap-2"><span>1.</span> Premi il pulsante centrale</li>
              <li className="flex gap-2"><span>2.</span> Inquadra l'elemento naturale</li>
              <li className="flex gap-2"><span>3.</span> Scatta e attendi l'analisi</li>
            </ul>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-2xl font-bold hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
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
      className="fixed inset-0 z-40 bg-[#FDFCF8] dark:bg-stone-950 pt-24 px-6 pb-32 overflow-y-auto"
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-stone-900 dark:text-white capitalize">
            {category === 'plants' ? 'Flora' : category === 'rocks' ? 'Geologia' : 'Alberi'}
          </h2>
          <button onClick={onClose} className="text-emerald-600 dark:text-emerald-400 font-semibold">Chiudi</button>
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm flex gap-4 group cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 py-1">
                <h3 className="font-bold text-stone-800 dark:text-stone-100">{item.name}</h3>
                {item.scientificName && <p className="text-xs italic text-emerald-600 dark:text-emerald-400 mb-1">{item.scientificName}</p>}
                <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">{item.description}</p>
              </div>
              <div className="flex items-center">
                <ChevronRight size={20} className="text-stone-300 dark:text-stone-600" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
