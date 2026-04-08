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
      className="fixed inset-0 z-50 bg-stone-50 dark:bg-stone-950 flex flex-col"
    >
      <div className="p-4 sm:p-6 flex items-center justify-between border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Leaf className="text-emerald-600 flex-shrink-0" size={24} />
          <h2 className="text-lg sm:text-xl font-bold text-stone-800 dark:text-white leading-tight">Analisi BioScan</h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {image && (
            <button
              onClick={handleSaveImage}
              className={cn(
                "p-2 rounded-full transition-all text-emerald-600",
                saving ? "bg-emerald-50 dark:bg-emerald-900/20" : "hover:bg-stone-100 dark:hover:bg-stone-800"
              )}
              title="Salva Immagine"
              disabled={saving}
            >
              <Download size={24} className={saving ? "animate-bounce" : ""} />
            </button>
          )}
          <button
            onClick={handleShare}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-emerald-600 relative"
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
                  <Check size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="share"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Share2 size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors ml-1 text-stone-600 dark:text-stone-400"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10">
        {image && (
          <div className="max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-xl border border-stone-100 dark:border-stone-800">
            <img 
              src={image.startsWith('http') ? image : `data:image/jpeg;base64,${image}`} 
              alt="Identified element" 
              className="w-full h-auto object-cover max-h-[400px]"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <div className="markdown-body w-full max-w-3xl mx-auto">
          <Markdown>{result}</Markdown>
        </div>

        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-semibold mb-2">
              <Info size={18} className="flex-shrink-0" />
              <span className="text-sm sm:text-base">Curiosità</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400 leading-relaxed">
              Questa specie gioca un ruolo fondamentale nell'ecosistema locale, fornendo habitat e nutrimento.
            </p>
          </div>
          
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold mb-2">
              <AlertTriangle size={18} className="flex-shrink-0" />
              <span className="text-sm sm:text-base">Attenzione</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
              Ricorda di non toccare o consumare specie selvatiche se non sei un esperto certificato.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 sticky bottom-0">
        <button
          onClick={onClose}
          className="w-full py-3 sm:py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-colors active:scale-[0.98]"
        >
          Nuova Scansione
        </button>
      </div>
    </motion.div>
  );
};
