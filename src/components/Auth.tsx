import React, { useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, create it if not
      const path = `users/${user.uid}`;
      const userRef = doc(db, path);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        try {
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      }
      onSuccess();
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Il popup per l'accesso è stato bloccato dal browser.");
      } else {
        setError(`Errore Google Auth: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
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
        const path = `users/${user.uid}`;
        try {
          await setDoc(doc(db, path), {
            email,
            displayName,
            createdAt: serverTimestamp(), // Use serverTimestamp for consistency
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px]" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/90 dark:bg-stone-900 shadow-soft backdrop-blur-xl p-10 rounded-[48px] border border-white dark:border-stone-800 relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center shadow-lg shadow-accent/20 dark:shadow-none mb-6">
            <Leaf className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-text-primary dark:text-white tracking-tighter font-display uppercase italic">Bio<span className="text-accent">Scan.</span></h1>
          <p className="text-text-secondary dark:text-stone-400 mt-3 text-center font-bold text-[10px] uppercase tracking-[0.3em]">AI Nature identification</p>
        </div>

        <div className="flex bg-bg-start/50 dark:bg-stone-800 p-1.5 rounded-full mb-10 border border-white/50">
          <button 
            onClick={() => toggleMode(true)}
            className={`flex-1 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${isLogin ? 'bg-white dark:bg-stone-700 text-stone-900 shadow-sm' : 'text-text-secondary hover:text-text-primary dark:hover:text-stone-200'}`}
          >
            Accedi
          </button>
          <button 
            onClick={() => toggleMode(false)}
            className={`flex-1 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${!isLogin ? 'bg-white dark:bg-stone-700 text-stone-900 shadow-sm' : 'text-text-secondary hover:text-text-primary dark:hover:text-stone-200'}`}
          >
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-accent" size={20} />
                <input 
                  type="text" 
                  placeholder="Nome completo"
                  required={!isLogin}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/50 dark:bg-stone-800 border border-white dark:border-stone-700 rounded-[28px] focus:outline-none focus:ring-12 focus:ring-accent/10 focus:border-accent transition-all text-text-primary dark:text-white font-semibold placeholder:text-text-secondary/50 shadow-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-accent" size={20} />
            <input 
              type="email" 
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white/50 dark:bg-stone-800 border border-white dark:border-stone-700 rounded-[28px] focus:outline-none focus:ring-12 focus:ring-accent/10 focus:border-accent transition-all text-text-primary dark:text-white font-semibold placeholder:text-text-secondary/50 shadow-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-accent" size={20} />
            <input 
              type="password" 
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white/50 dark:bg-stone-800 border border-white dark:border-stone-700 rounded-[28px] focus:outline-none focus:ring-12 focus:ring-accent/10 focus:border-accent transition-all text-text-primary dark:text-white font-semibold placeholder:text-text-secondary/50 shadow-sm"
            />
          </div>

          {isLogin && (
            <div className="flex justify-end px-4">
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
                className="text-[10px] uppercase tracking-widest font-black text-accent hover:text-accent/80 transition-colors"
              >
                Password dimenticata?
              </button>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-3xl text-xs font-bold border border-rose-500/20"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-accent text-white rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 mt-4"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                {isLogin ? 'Inizia l\'esplorazione' : 'Crea il tuo profilo'}
                <ArrowRight size={20} strokeWidth={3} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10">
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-text-secondary/10 dark:border-stone-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black text-text-secondary/50">
              <span className="bg-white/50 backdrop-blur rounded-full px-6 py-1">Soscial Sign-in</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-5 bg-white dark:bg-stone-800 border border-white dark:border-stone-700 text-text-primary dark:text-stone-200 rounded-full font-black text-xs uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-bg-start transition-all active:scale-[0.98] disabled:opacity-70 shadow-sm"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Accedi con Google
          </button>
        </div>
      </motion.div>
    </div>
  );
};
