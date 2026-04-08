import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, Loader2, Leaf, AlertCircle } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMode = (login: boolean) => {
    setIsLogin(login);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName });
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email,
          displayName,
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp()
        });
      }
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Email o password non corretti.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Questa email è già registrata. Ti ho spostato nella scheda di accesso.");
        setIsLogin(true);
      } else if (err.code === 'auth/weak-password') {
        setError("La password deve avere almeno 6 caratteri.");
      } else if (err.code === 'auth/invalid-email') {
        setError("L'indirizzo email non è valido.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Errore di rete. Controlla la tua connessione.");
      } else {
        console.error("Auth error:", err);
        setError(`Errore: ${err.message || "Si è verificato un problema. Riprova."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] dark:bg-stone-950 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-900/5 dark:shadow-none border border-stone-100 dark:border-stone-800"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-100 dark:shadow-none mb-4">
            <Leaf className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">BioScan <span className="text-emerald-600">Verde</span></h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2 text-center">Identifica la natura con l'intelligenza artificiale.</p>
        </div>

        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl mb-8">
          <button 
            onClick={() => toggleMode(true)}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${isLogin ? 'bg-white dark:bg-stone-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
          >
            Accedi
          </button>
          <button 
            onClick={() => toggleMode(false)}
            className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isLogin ? 'bg-white dark:bg-stone-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Nome completo"
                  required={!isLogin}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-stone-900 dark:text-white"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={20} />
            <input 
              type="email" 
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-stone-900 dark:text-white"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" size={20} />
            <input 
              type="password" 
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-stone-900 dark:text-white"
            />
          </div>

          {isLogin && (
            <div className="flex justify-end px-2">
              <button 
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError("Inserisci la tua email per recuperare la password.");
                    return;
                  }
                  try {
                    const { sendPasswordResetEmail } = await import('firebase/auth');
                    await sendPasswordResetEmail(auth, email);
                    setError("Email di recupero inviata! Controlla la tua posta.");
                  } catch (err: any) {
                    setError("Errore nell'invio dell'email di recupero.");
                  }
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Password dimenticata?
              </button>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-medium"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 dark:shadow-none hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                {isLogin ? 'Accedi' : 'Crea account'}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
