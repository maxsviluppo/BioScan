import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera as CameraIcon, 
  Leaf, 
  Search, 
  History,
  Info,
  Sparkles,
  Loader2,
  LogOut,
  User,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Camera } from './components/Camera';
import { IdentificationResult } from './components/IdentificationResult';
import { LibraryView } from './components/LibraryView';
import { HistoryView, type HistoryItem } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { Auth } from './components/Auth';
import { cn } from './lib/utils';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
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
  getDoc,
  doc
} from 'firebase/firestore';


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
  const [showSettings, setShowSettings] = useState(false);

  const getAiClient = () => new GoogleGenAI({ 
    apiKey: (typeof window !== 'undefined' ? localStorage.getItem('CUSTOM_GEMINI_KEY') : '') || import.meta.env.VITE_GEMINI_API_KEY || '' 
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists() && userDoc.data().geminiKey) {
            localStorage.setItem('CUSTOM_GEMINI_KEY', userDoc.data().geminiKey);
          }
        } catch (e) {
          console.error("Error loading API key from DB", e);
        }
      }
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
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/history`);
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
    const path = `users/${user.uid}/history`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        image: image || "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=200",
        result: resultText,
        timestamp: serverTimestamp(),
        type: image ? 'identification' : 'search'
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab !== activeTab) {
      triggerHaptic(15);
      setActiveTab(tab);
    }
  };

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && searchQuery.trim()) {
      setIsAnalyzing(true);
      setCurrentImage("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=200");
      try {
        console.log("Starting search with Gemini 2.0 Flash for:", searchQuery);
        
        const currentKey = (typeof window !== 'undefined' ? localStorage.getItem('CUSTOM_GEMINI_KEY') : '') || import.meta.env.VITE_GEMINI_API_KEY;
        if (!currentKey) {
          throw new Error("API Key mancante. Inseriscila nelle impostazioni.");
        }

        const geminiResponse = await getAiClient().models.generateContent({
          model: "gemini-1.5-flash",
          contents: `Sei un esperto naturalista e botanico/geologo. Fornisci una scheda tecnica ESTREMAMENTE DETTAGLIATA, LUNGA E RICCA DI INFORMAZIONI per l'elemento naturale: "${searchQuery}". Sii molto generoso nelle descrizioni, includendo curiosità, contesto ecologico, origini e particolarità. Non essere breve.
          
          Usa SEMPRE questo formato Markdown pulito:
          # [CLASSE] Oggetto diagnosticato
          
          ### 1. Identificazione
          **Nome comune:** [Nome]
          **Nome scientifico:** *[Nome Scientifico]*
          
          ### 2. Caratteristiche Visive
          [Descrizione ampia e generosa in più paragrafi, analizzando ogni dettaglio visivo]
          
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

        const resultText = geminiResponse.text || "Nessun risultato trovato.";
        setAnalysisResult(resultText);
        await saveToHistory(resultText);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Gemini Search error:", error);
        setAnalysisResult(`Si è verificato un errore: ${errorMessage}`);
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

    const currentKey = (typeof window !== 'undefined' ? localStorage.getItem('CUSTOM_GEMINI_KEY') : '') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!currentKey) {
      console.error("API Key mancante!");
      setAnalysisResult("Errore: Chiave API Gemini mancante. Inseriscila nelle impostazioni.");
      setIsAnalyzing(false);
      return;
    }

    try {
      console.log("Starting Gemini 1.5 Flash Vision analysis...");
      const geminiResponse = await getAiClient().models.generateContent({
        model: "gemini-1.5-flash",
        contents: {
          parts: [
            {
              text: `Sei un esperto naturalista, botanico e geologo. Identifica minuziosamente l'elemento in questa immagine. Fornisci una risposta LUNGA, GENEROSA, E MOLTO DETTAGLIATA per ogni singola sezione. Non essere sbrigativo: esplora caratteristiche, curiosità, storia e biologia in modo approfondito.
              
              Rispondi SEMPRE seguendo questo formato Markdown pulito:
              # [CLASSE] Oggetto diagnosticato
              
              ### 1. Identificazione
              **Nome comune:** [Nome]
              **Nome scientifico:** *[Nome Scientifico]*
              
              ### 2. Caratteristiche Visive
              [Descrizione ampia e generosa in più paragrafi, analizzando ogni dettaglio visibile nell'immagine e tipico della specie]
              
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

      const resultText = geminiResponse.text || "Spiacente, non sono riuscito a identificare l'elemento.";
      console.log("Analysis complete.");
      setAnalysisResult(resultText);
      await saveToHistory(resultText, base64Image);
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Load failed') || errorMessage.includes('Failed to fetch')) {
        setAnalysisResult("Errore di connessione: Assicurati di essere online e riprova.");
      } else {
        setAnalysisResult(`Si è verificato un errore: ${errorMessage}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleClearHistory = async () => {
    if (!user) return;
    triggerHaptic(50);
    const path = `users/${user.uid}/history`;
    try {
      const q = query(collection(db, path));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, path, d.id)));
      await Promise.all(deletePromises);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
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
    <div className="min-h-screen text-text-primary font-sans selection:bg-accent/30 selection:dark:bg-accent/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-30 bg-glass/80 backdrop-blur-xl border-b border-white/20 dark:bg-stone-950/80 dark:border-stone-900 sm:border-none">
        <div 
          className="flex items-center gap-3 cursor-pointer min-w-0"
          onClick={() => handleTabChange('home')}
        >
          <div className="w-10 h-10 bg-accent rounded-[14px] flex items-center justify-center shadow-lg shadow-accent/20 dark:shadow-none flex-shrink-0">
            <Leaf className="text-white" size={24} />
          </div>
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary dark:text-white leading-none font-display uppercase tracking-widest text-[14px] sm:text-[18px]">BioScan <span className="text-accent">Verde</span></h1>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-text-secondary dark:text-stone-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.2em]"
            >
              <div className="w-1 h-1 bg-accent rounded-full animate-pulse" />
              <span>Ciao, {user.displayName || 'Esploratore'}</span>
            </motion.div>
          </div>
        </div>
        
        {/* History Quick Access Badge */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <motion.button 
            onClick={() => {
              handleTabChange('history');
              setHasNewResult(false);
            }}
            animate={hasNewResult ? { 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
              backgroundColor: ['#FFFFFF', '#444C2E', '#FFFFFF']
            } : {}}
            transition={{ 
              duration: 0.8, 
              repeat: hasNewResult ? Infinity : 0,
              repeatDelay: 1.5
            }}
            className={cn(
              "p-3 rounded-full transition-all relative border border-white/50 bg-white/20 backdrop-blur-md shadow-soft dark:bg-stone-800 dark:border-stone-700",
              activeTab === 'history' ? "bg-accent text-white border-accent" : "text-text-primary dark:text-stone-400 hover:bg-white/40"
            )}
          >
            <History size={20} strokeWidth={1.5} className={cn(hasNewResult && "text-accent")} />
            {hasNewResult && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent border-2 border-white dark:border-stone-950 rounded-full animate-pulse" />
            )}
          </motion.button>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 bg-white/20 border border-white/50 backdrop-blur-md text-text-primary dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400 rounded-full hover:bg-white/40 transition-all shadow-soft"
            title={isDarkMode ? "Tema Chiaro" : "Tema Scuro"}
          >
            {isDarkMode ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white/20 border border-white/50 backdrop-blur-md text-text-primary dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400 rounded-full hover:bg-white/40 transition-all shadow-soft"
            title="Impostazioni"
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>

          <button 
            onClick={handleLogout}
            className="p-3 bg-white/20 border border-white/50 backdrop-blur-md text-text-primary dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400 rounded-full hover:bg-rose-500/10 hover:text-rose-600 transition-all shadow-soft"
            title="Logout"
          >
            <LogOut size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>



      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' ? (
          <motion.main 
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-6 pt-32 pb-32 max-w-md mx-auto"
          >
            <div className="relative rounded-[48px] overflow-hidden bg-accent/20 h-96 mb-10 shadow-soft group border-[12px] border-white dark:border-stone-800">
              <img 
                src="https://images.unsplash.com/photo-1542332213-31f87348057f?auto=format&fit=crop&q=80&w=1000" 
                alt="Nature Background"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 p-10 flex flex-col justify-end bg-gradient-to-t from-text-primary/90 via-text-primary/10 to-transparent">
                <h2 className="text-5xl font-black text-white mb-3 leading-[0.8] font-display uppercase tracking-tighter">Bio <br/> Scan.</h2>
                <p className="text-white/80 text-[10px] uppercase tracking-[0.3em] font-bold">Nature Identification AI</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-12">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-accent" size={24} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Cerca nella natura..."
                className="w-full pl-16 pr-8 py-6 bg-white/90 dark:bg-stone-900 border border-white/50 dark:border-stone-800 rounded-[40px] shadow-soft focus:outline-none focus:ring-12 focus:ring-accent/10 focus:border-accent transition-all text-lg text-text-primary dark:text-white placeholder:text-text-secondary/50"
              />
            </div>

            {/* Quick Tips */}
            <div className="bg-white/60 backdrop-blur-md dark:bg-stone-900 p-10 rounded-[48px] border border-white/50 dark:border-stone-800 relative overflow-hidden group shadow-soft">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-lg shadow-accent/20">
                  <Sparkles className="text-white" size={24} />
                </div>
                <h3 className="font-bold text-text-primary dark:text-stone-100 font-display uppercase tracking-[0.2em] text-[10px]">Daily Tip</h3>
              </div>
              <p className="text-sm text-text-secondary dark:text-stone-400 leading-relaxed relative z-10 font-medium tracking-[0.02em]">
                Per un'identificazione perfetta, inquadra l'elemento al centro. Evita ombre che potrebbero confondere l'AI!
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
      <nav className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-bg-end/80 dark:from-stone-950 via-bg-end/40 dark:via-stone-950/80 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto flex justify-center pointer-events-auto">
          {/* Main Action Button */}
          <button
            onClick={() => {
              triggerHaptic(30);
              setShowCamera(true);
            }}
            className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-white shadow-soft hover:scale-110 hover:shadow-accent/40 transition-all active:scale-90 relative -top-4 border-[10px] border-white dark:border-stone-950"
          >
            <CameraIcon size={36} strokeWidth={1.5} />
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
            className="fixed inset-0 z-[60] bg-text-primary/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
              <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent" size={32} />
            </div>
            <h2 className="text-3xl font-black text-white mb-3 font-display uppercase tracking-widest">Analisi...</h2>
            <p className="text-accent/80 text-sm uppercase tracking-widest font-bold">Interrogando la natura</p>
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

        {showSettings && (
          <SettingsView 
            user={user}
            onClose={() => setShowSettings(false)} 
          />
        )}

      </AnimatePresence>
    </div>
  );
}
