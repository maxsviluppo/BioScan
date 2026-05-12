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
      className="fixed inset-0 z-40 pt-32 px-6 pb-32 overflow-y-auto"
      style={{ background: 'linear-gradient(135deg, var(--color-bg-start) 0%, var(--color-bg-end) 100%)' }}
    >
      <div className="max-w-md mx-auto">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 sm:top-8 sm:right-8 p-2.5 sm:p-3 bg-white/50 backdrop-blur-md border border-white rounded-full transition-all text-text-primary lg:hover:bg-rose-500 hover:text-white z-50 shadow-sm"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
            <History className="text-white w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-primary dark:text-white font-display uppercase tracking-widest leading-none">Cronologia</h2>
            <p className="text-text-secondary dark:text-stone-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Le tue scoperte</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 bg-white/60 backdrop-blur-md dark:bg-stone-900 rounded-[48px] border border-white shadow-soft px-10">
            <div className="w-24 h-24 bg-bg-start dark:bg-stone-800 rounded-full flex items-center justify-center text-accent/30">
              <History size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-text-primary dark:text-stone-200 font-display uppercase tracking-widest leading-none mb-3">Silent Garden</h3>
              <p className="text-text-secondary dark:text-stone-500 font-bold text-xs uppercase tracking-widest">Le tue scoperte appariranno qui.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {history.map((item) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onSelectItem(item)}
                  className="bg-white/70 backdrop-blur-md dark:bg-stone-900 p-5 rounded-[40px] border border-white dark:border-stone-800 shadow-soft flex gap-5 group cursor-pointer lg:hover:scale-[1.02] transition-all active:scale-[0.98] relative overflow-hidden"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] sm:rounded-[32px] overflow-hidden flex-shrink-0 bg-bg-start dark:bg-stone-800 border-[4px] sm:border-[6px] border-white dark:border-stone-800 shadow-sm">
                    <img 
                      src={item.image.startsWith('http') ? item.image : `data:image/jpeg;base64,${item.image}`} 
                      alt="Scan preview" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="flex-1 py-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-accent mb-1.5">
                      <Calendar size={12} />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">
                        {item.date.toLocaleDateString('it-IT', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-text-primary dark:text-stone-100 truncate pr-4 font-display text-sm sm:text-base uppercase tracking-tight mb-0.5">
                      {item.result.split('\n')[0].replace(/#/g, '').trim() || 'Identificazione'}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-text-secondary dark:text-stone-400 line-clamp-2 font-medium leading-relaxed">
                      {item.result.split('\n').slice(1).join(' ').replace(/[*#]/g, '').trim()}
                    </p>
                  </div>
                  <div className="flex items-center px-1">
                    <ChevronRight size={24} className="text-accent/30 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>

            <button 
              onClick={onClearHistory}
              className="w-full mt-16 py-6 flex items-center justify-center gap-3 text-rose-500 font-black uppercase tracking-[0.3em] text-[10px] bg-rose-500/5 hover:bg-rose-500 hover:text-white rounded-full border border-rose-500/20 transition-all shadow-sm"
            >
              <Trash2 size={16} />
              Svuota Cronologia
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};
