import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Info, AlertTriangle, X, Share2, Check, Download } from 'lucide-react';
import { cn } from '../lib/utils';

interface IdentificationResultProps {
  result: string;
  image: string | null;
  onClose: () => void;
}

export const IdentificationResult: React.FC<IdentificationResultProps> = ({ result, image, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveImage = () => {
    if (!image) return;
    setSaving(true);
    try {
      const link = document.createElement('a');
      link.href = image.startsWith('http') ? image : `data:image/jpeg;base64,${image}`;
      link.download = `bioscan-${new Date().getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error saving image:", err);
    } finally {
      setTimeout(() => setSaving(false), 1000);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'BioScan Verde - Analisi',
      text: result.replace(/[#*]/g, ''),
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(135deg, var(--color-bg-start) 0%, var(--color-bg-end) 100%)' }}
    >
      <div className="p-4 sm:p-6 flex items-center justify-between border-b border-white/20 bg-white/40 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/20">
            <Leaf className="text-white" size={24} />
          </div>
          <h2 className="text-xl font-black text-text-primary dark:text-white leading-tight font-display uppercase italic tracking-[0.05em]">Analisi<span className="text-accent">.</span></h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {image && (
            <button
              onClick={handleSaveImage}
              className={cn(
                "p-3 rounded-full transition-all text-text-primary bg-white/50 border border-white lg:hover:bg-accent hover:text-white",
                saving && "animate-pulse"
              )}
              title="Salva Immagine"
              disabled={saving}
            >
              <Download size={20} className={saving ? "animate-bounce" : ""} />
            </button>
          )}
          <button
            onClick={handleShare}
            className="p-3 bg-white/50 border border-white rounded-full transition-all text-text-primary relative lg:hover:bg-accent hover:text-white"
            title="Condividi"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Check size={20} />
                </motion.div>
              ) : (
                <motion.div
                  key="share"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Share2 size={20} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={onClose}
            className="p-3 bg-white/50 border border-white rounded-full transition-all ml-1 text-text-primary lg:hover:bg-rose-500 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-12 no-scrollbar">
        {image && (
          <div className="max-w-3xl mx-auto rounded-[48px] overflow-hidden shadow-soft border-[12px] border-white dark:border-stone-800">
            <img 
              src={image.startsWith('http') ? image : `data:image/jpeg;base64,${image}`} 
              alt="Identified element" 
              className="w-full h-auto object-cover max-h-[500px]"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="markdown-body w-full max-w-3xl mx-auto p-12 bg-white/60 backdrop-blur-md rounded-[56px] shadow-soft border border-white">
          <Markdown>{result}</Markdown>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12 mb-16 px-4 sm:px-0">
          <div className="p-10 bg-accent/5 backdrop-blur rounded-[48px] border border-accent/20 relative group overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="flex items-center gap-3 text-accent font-black font-display uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-5 relative z-10">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                <Info size={16} className="text-accent" />
              </div>
              <span>Curiosità</span>
            </div>
            <p className="text-sm text-text-secondary dark:text-stone-400 leading-relaxed font-bold tracking-tight relative z-10">
              Questa specie gioca un ruolo fondamentale nell'ecosistema locale, fornendo habitat e nutrimento. Sapevi che molte piante comunicano tra loro?
            </p>
          </div>
          
          <div className="p-10 bg-rose-500/5 backdrop-blur rounded-[48px] border border-rose-500/20 relative group overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="flex items-center gap-3 text-rose-500 font-black font-display uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-5 relative z-10">
              <div className="w-8 h-8 bg-rose-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle size={16} className="text-rose-500" />
              </div>
              <span>Attenzione</span>
            </div>
            <p className="text-sm text-rose-500/80 dark:text-rose-400/80 leading-relaxed font-bold tracking-tight relative z-10">
              Ricorda di non toccare o consumare specie selvatiche se non sei un esperto certificato. La sicurezza viene prima di tutto.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-10 bg-white/40 backdrop-blur-2xl border-t border-white/20 sticky bottom-0">
        <button
          onClick={onClose}
          className="w-full py-6 bg-accent text-white rounded-full font-black uppercase tracking-[0.3em] text-xs shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Nuova Scansione
        </button>
      </div>
    </motion.div>
  );
};
