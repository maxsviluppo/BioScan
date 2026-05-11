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
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-soft border border-white">
              <History className="text-accent" size={28} />
            </div>
            <h2 className="text-4xl font-black text-text-primary dark:text-white font-display uppercase tracking-widest italic">Storia<span className="text-accent">.</span></h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-text-secondary font-black uppercase tracking-widest text-[10px] px-6 py-3 bg-white/50 border border-white rounded-full hover:bg-accent hover:text-white transition-all shadow-sm"
          >
            Chiudi
          </button>
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
                  <div className="w-24 h-24 rounded-[32px] overflow-hidden flex-shrink-0 bg-bg-start dark:bg-stone-800 border-[6px] border-white dark:border-stone-800 shadow-sm">
                    <img 
                      src={item.image.startsWith('http') ? item.image : `data:image/jpeg;base64,${item.image}`} 
                      alt="Scan preview" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="flex-1 py-1 min-w-0">
                    <div className="flex items-center gap-2 text-accent mb-2">
                      <Calendar size={14} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        {item.date.toLocaleDateString('it-IT', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-text-primary dark:text-stone-100 truncate pr-6 font-display text-lg uppercase tracking-tight">
                      {item.result.split('\n')[0].replace(/#/g, '').trim() || 'Identificazione'}
                    </h3>
                    <p className="text-xs text-text-secondary dark:text-stone-400 line-clamp-1 font-bold italic">
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
