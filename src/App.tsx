import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera as CameraIcon, 
  Leaf, 
  Mountain, 
  TreePine, 
  Wind, 
  Search, 
  History,
  Info,
  Sparkles,
  Loader2,
  LogOut,
  User,
  Sun,
  Moon
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Camera } from './components/Camera';
import { IdentificationResult } from './components/IdentificationResult';
import { LibraryView } from './components/LibraryView';
import { HistoryView, type HistoryItem } from './components/HistoryView';
import { Auth } from './components/Auth';
import { cn } from './lib/utils';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  getDocs,
  doc
} from 'firebase/firestore';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [hasNewResult, setHasNewResult] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firestore history listener
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'history'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: HistoryItem[] = snapshot.docs.map(doc => {
        const data = doc.data();
        let date = new Date();
        if (data.timestamp) {
          if (typeof data.timestamp.toDate === 'function') {
            date = data.timestamp.toDate();
          } else if (typeof data.timestamp === 'string') {
            date = new Date(data.timestamp);
          }
        }
        return {
          id: doc.id,
          image: data.image,
          result: data.result,
          date
        };
      });
      setHistory(items);
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const triggerHaptic = (duration = 10) => {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const saveToHistory = async (resultText: string, image?: string) => {
    if (!user || !resultText) return;
    
    setHasNewResult(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'history'), {
        userId: user.uid,
        image: image || "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=200",
        result: resultText,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Error saving to Firestore:", err);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab !== activeTab) {
      triggerHaptic(15);
      setActiveTab(tab);
    }
  };

  const fetchWithTimeout = async (url: string, options: any = {}, timeout = 60000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      console.error(`Fetch error for ${url}:`, error);
      throw error;
    }
  };

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsAnalyzing(true);
      setCurrentImage("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=200");
      try {
        console.log("Starting search for:", searchQuery);
        const response = await fetchWithTimeout('/api/deepseek/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery })
        });
        const data = await response.json();
        
        if (data.fallback || !data.text) {
          console.log("DeepSeek fallback or empty text, using Gemini...");
          
          if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is missing for fallback!");
            setAnalysisResult("Errore: DeepSeek non disponibile e chiave API Gemini mancante.");
            setIsAnalyzing(false);
            return;
          }

          // Fallback to Gemini if DeepSeek fails
          const geminiResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Sei un esperto naturalista e geologo. Fornisci una scheda tecnica per l'elemento naturale: "${searchQuery}". 
            
            Usa SEMPRE questo formato Markdown pulito:
            # [CLASSE] Oggetto diagnosticato
            
            ### 1. Identificazione
            **Nome comune:** [Nome]
            **Nome scientifico:** *[Nome Scientifico]*
            
            ### 2. Caratteristiche Visive
            [Descrizione dettagliata in paragrafi]
            
            ### 3. Varianti e Stadi Vitali
            [Descrizione]
            
            ### 4. Stato di Salute
            **Diagnosi:** [Stato]
            [Dettagli]
            
            ### 5. Diagnosi Differenziale
            [Dettagli]
            
            ### 6. Cure e Trattamenti
            *   **Biologiche:** [Consigli]
            *   **Chimiche:** [Consigli]
            *   **Meccaniche:** [Consigli]
            *   **Culturali:** [Consigli]
            
            Rispondi in italiano in formato markdown.`
          });
          setAnalysisResult(geminiResponse.text || "Nessun risultato trovato.");
          if (geminiResponse.text) await saveToHistory(geminiResponse.text);
        } else {
          setAnalysisResult(data.text);
          await saveToHistory(data.text);
        }
      } catch (error) {
        console.error("DeepSeek Search error, falling back to Gemini:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Direct Gemini fallback on fetch error
        try {
          if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is missing");
          }
          const geminiResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Sei un esperto naturalista e geologo. Fornisci una scheda tecnica per l'elemento naturale: "${searchQuery}". 
            
            Usa SEMPRE questo formato Markdown pulito:
            # [CLASSE] Oggetto diagnosticato
            
            ### 1. Identificazione
            **Nome comune:** [Nome]
            **Nome scientifico:** *[Nome Scientifico]*
            
            ### 2. Caratteristiche Visive
            [Descrizione dettagliata in paragrafi]
            
            ### 3. Varianti e Stadi Vitali
            [Descrizione]
            
            ### 4. Stato di Salute
            **Diagnosi:** [Stato]
            [Dettagli]
            
            ### 5. Diagnosi Differenziale
            [Dettagli]
            
            ### 6. Cure e Trattamenti
            *   **Biologiche:** [Consigli]
            *   **Chimiche:** [Consigli]
            *   **Meccaniche:** [Consigli]
            *   **Culturali:** [Consigli]
            
            Rispondi in italiano in formato markdown.`
          });
          const geminiResult = geminiResponse.text || "Errore durante la ricerca.";
          setAnalysisResult(geminiResult);
          if (geminiResponse.text) await saveToHistory(geminiResponse.text);
        } catch (geminiError) {
          console.error("Gemini fallback error:", geminiError);
          if (errorMessage.includes('Load failed') || errorMessage.includes('Failed to fetch')) {
            setAnalysisResult("Errore di connessione: Assicurati di essere online e riprova.");
          } else {
            setAnalysisResult("Si è verificato un errore durante la ricerca. Per favore, riprova.");
          }
        }
      } finally {
        setIsAnalyzing(false);
        setSearchQuery('');
      }
    }
  };

  const handleCapture = useCallback(async (base64Image: string) => {
    setIsAnalyzing(true);
    setShowCamera(false);
    setCurrentImage(base64Image);

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing!");
      setAnalysisResult("Errore: Chiave API Gemini mancante. Per favore, configurala nelle impostazioni.");
      setIsAnalyzing(false);
      return;
    }

    try {
      // Step 1: Gemini for Vision (since DeepSeek V3 is text-only)
      console.log("Starting Gemini Vision analysis...");
      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              text: `Sei un esperto naturalista e geologo. Identifica l'elemento in questa immagine.
              
              Rispondi SEMPRE seguendo questo formato Markdown pulito:
              # [CLASSE] Oggetto diagnosticato
              
              ### 1. Identificazione
              **Nome comune:** [Nome]
              **Nome scientifico:** *[Nome Scientifico]*
              
              ### 2. Caratteristiche Visive
              [Descrizione dettagliata in paragrafi]
              
              ### 3. Varianti e Stadi Vitali
              [Descrizione]
              
              ### 4. Stato di Salute
              **Diagnosi:** [Stato]
              [Dettagli]
              
              ### 5. Diagnosi Differenziale
              [Dettagli]
              
              ### 6. Cure e Trattamenti
              *   **Biologiche:** [Consigli]
              *   **Chimiche:** [Consigli]
              *   **Meccaniche:** [Consigli]
              *   **Culturali:** [Consigli]
              
              REGOLE:
              - Se non riconosci la specie -> indica almeno la classe tassonomica.
              - Se salute sconosciuta -> "da verificare con test".
              - Sicurezza: aggiungi un box di avviso > ⚠️ **ATTENZIONE:** se pericoloso.
              - Rispondi in italiano in formato markdown.`
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      });

      const geminiResult = geminiResponse.text || "Spiacente, non sono riuscito a identificare l'elemento.";
      console.log("Gemini Vision success, enhancing with DeepSeek...");
      
      // Step 2: DeepSeek for Deep Enhancement (Reasoning & Detail)
      const deepseekResponse = await fetchWithTimeout('/api/deepseek/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiResult })
      });
      const deepseekData = await deepseekResponse.json();
      
      const resultText = deepseekData.text || geminiResult;
      console.log("Analysis complete.");
      setAnalysisResult(resultText);
      await saveToHistory(resultText, base64Image);
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Load failed') || errorMessage.includes('Failed to fetch')) {
        setAnalysisResult("Errore di connessione: Assicurati di essere online e riprova.");
      } else {
        setAnalysisResult("Si è verificato un errore durante l'analisi. Per favore, riprova.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleClearHistory = async () => {
    if (!user) return;
    triggerHaptic(50);
    try {
      const q = query(collection(db, 'users', user.uid, 'history'));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'users', user.uid, 'history', d.id)));
      await Promise.all(deletePromises);
    } catch (err) {
      console.error("Error clearing history:", err);
    }
  };

  const handleLogout = async () => {
    triggerHaptic(20);
    try {
      await signOut(auth);
      setActiveTab('home');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] dark:bg-stone-950 flex items-center justify-center">
        <Loader2 className="text-emerald-600 animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Auth onSuccess={() => setIsAuthReady(true)} />;
  }

  const navItems = [
    { id: 'home', icon: Leaf, label: 'Home' },
    { id: 'history', icon: History, label: 'Storia' },
    { id: 'info', icon: Info, label: 'Info' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-stone-950 text-stone-800 dark:text-stone-200 font-sans selection:bg-emerald-100 dark:selection:bg-emerald-900/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-30 bg-[#FDFCF8]/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-stone-100 dark:border-stone-900 sm:border-none">
        <div 
          className="flex items-center gap-2 cursor-pointer min-w-0"
          onClick={() => handleTabChange('home')}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 dark:shadow-none flex-shrink-0">
            <Leaf className="text-white" size={20} />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-white leading-none">BioScan <span className="text-emerald-600">Verde</span></h1>
        </div>
        
        {/* History Quick Access Badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button 
            onClick={() => {
              handleTabChange('history');
              setHasNewResult(false);
            }}
            animate={hasNewResult ? { 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
              backgroundColor: ['#F5F5F4', '#10B981', '#F5F5F4']
            } : {}}
            transition={{ 
              duration: 0.8, 
              repeat: hasNewResult ? Infinity : 0,
              repeatDelay: 1.5
            }}
            className={cn(
              "p-2 rounded-full transition-all relative shadow-sm",
              activeTab === 'history' ? "bg-emerald-600 text-white" : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
            )}
          >
            <History size={18} className={cn(hasNewResult && "text-emerald-600")} />
            {hasNewResult && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#FDFCF8] dark:border-stone-950 rounded-full animate-pulse" />
            )}
          </motion.button>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all shadow-sm"
            title={isDarkMode ? "Tema Chiaro" : "Tema Scuro"}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button 
            onClick={handleLogout}
            className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-600 transition-all shadow-sm"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* User Greeting */}
      <div className="fixed top-20 left-0 right-0 px-6 z-20 pointer-events-none">
        <div className="max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-stone-400 dark:text-stone-500 text-xs font-bold uppercase tracking-widest"
          >
            <User size={12} className="text-emerald-600" />
            <span>Ciao, {user.displayName || 'Esploratore'}</span>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' ? (
          <motion.main 
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 pt-24 pb-32 max-w-md mx-auto"
          >
            <div className="relative rounded-3xl overflow-hidden bg-emerald-900 h-80 mb-8 shadow-2xl group">
              <img 
                src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1000" 
                alt="Nature Background"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-emerald-950/80 to-transparent">
                <h2 className="text-4xl font-bold text-white mb-2 leading-tight">Esplora il <br/> Mondo Verde</h2>
                <p className="text-emerald-100 text-sm max-w-xs opacity-90">Usa la fotocamera per identificare specie o la ricerca per consultare l'enciclopedia.</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-12">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={20} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Cerca una pianta o un minerale..."
                className="w-full pl-12 pr-4 py-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-lg text-stone-900 dark:text-white"
              />
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['Lavanda', 'Quarzo', 'Quercia', 'Orchidea'].map(tag => (
                  <button 
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      // Trigger search manually
                      const event = { key: 'Enter', target: { value: tag } } as any;
                      handleSearch(event);
                    }}
                    className="px-4 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 transition-colors whitespace-nowrap"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Stats or Tips */}
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-100 dark:border-stone-800 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-amber-600 dark:text-amber-400" size={20} />
                </div>
                <h3 className="font-bold text-stone-800 dark:text-stone-100">Consiglio del giorno</h3>
              </div>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                Per un'identificazione perfetta, assicurati che l'elemento sia ben illuminato e al centro dell'inquadratura. Evita ombre troppo nette!
              </p>
            </div>
          </motion.main>
        ) : activeTab === 'history' ? (
          <HistoryView 
            key="history"
            history={history}
            onClose={() => setActiveTab('home')}
            onSelectItem={(item) => {
              setAnalysisResult(item.result);
              setCurrentImage(item.image);
            }}
            onClearHistory={handleClearHistory}
          />
        ) : (
          <LibraryView 
            key={activeTab}
            category={activeTab} 
            onClose={() => setActiveTab('home')} 
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation Simplified - Only Camera */}
      <nav className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#FDFCF8] dark:from-stone-950 via-[#FDFCF8]/80 dark:via-stone-950/80 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto flex justify-center pointer-events-auto">
          {/* Main Action Button */}
          <button
            onClick={() => {
              triggerHaptic(30);
              setShowCamera(true);
            }}
            className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 hover:bg-emerald-700 transition-all active:scale-90 relative -top-2 border-8 border-[#FDFCF8] dark:border-stone-950"
          >
            <CameraIcon size={36} />
          </button>
        </div>
      </nav>

      {/* Overlays */}
      <AnimatePresence>
        {showCamera && (
          <Camera 
            onCapture={handleCapture} 
            onClose={() => setShowCamera(false)} 
          />
        )}

        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative">
              <Loader2 className="text-emerald-400 animate-spin mb-6" size={64} />
              <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 opacity-50" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Analisi in corso...</h2>
            <p className="text-emerald-200">Sto interrogando la saggezza della natura per identificare il tuo reperto.</p>
          </motion.div>
        )}

        {analysisResult && (
          <IdentificationResult 
            result={analysisResult} 
            image={currentImage}
            onClose={() => {
              setAnalysisResult(null);
              setCurrentImage(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
