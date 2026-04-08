import React from 'react';
import { motion } from 'motion/react';
import { History, X, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface HistoryItem {
  id: string;
  image: string;
  result: string;
  date: Date;
}

interface HistoryViewProps {
  history: HistoryItem[];
  onClose: () => void;
  onSelectItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  history, 
  onClose, 
  onSelectItem,
  onClearHistory 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 z-40 bg-[#FDFCF8] dark:bg-stone-950 pt-24 px-6 pb-32 overflow-y-auto"
    >
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <History className="text-emerald-600" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-stone-900 dark:text-white">Cronologia</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-emerald-600 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-3 py-1 rounded-lg transition-colors"
          >
            Chiudi
          </button>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-stone-100 dark:bg-stone-900 rounded-full flex items-center justify-center text-stone-300 dark:text-stone-700">
              <History size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-800 dark:text-stone-200">Nessuna scansione</h3>
              <p className="text-stone-500 dark:text-stone-500">Le tue identificazioni appariranno qui.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {history.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onSelectItem(item)}
                  className="bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm flex gap-4 group cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-stone-100 dark:bg-stone-800">
                    <img 
                      src={item.image.startsWith('http') ? item.image : `data:image/jpeg;base64,${item.image}`} 
                      alt="Scan preview" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="flex-1 py-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500 mb-1">
                      <Calendar size={12} />
                      <span className="text-[10px] font-medium uppercase tracking-wider">
                        {item.date.toLocaleDateString('it-IT', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <h3 className="font-bold text-stone-800 dark:text-stone-100 truncate pr-4">
                      {item.result.split('\n')[0].replace(/#/g, '').trim() || 'Identificazione'}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-1">
                      {item.result.split('\n').slice(1).join(' ').replace(/[*#]/g, '').trim()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <ChevronRight size={20} className="text-stone-300 dark:text-stone-700 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </motion.div>
              ))}
            </div>

            <button 
              onClick={onClearHistory}
              className="w-full mt-8 py-4 flex items-center justify-center gap-2 text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-colors"
            >
              <Trash2 size={18} />
              Svuota Cronologia
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};
