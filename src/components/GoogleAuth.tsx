import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, LogOut, Shield, AlertCircle, RefreshCw, Mail
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  authType: 'manual-email';
}

interface GoogleAuthProps {
  onUserChange?: (user: UserProfile | null) => void;
}

export default function GoogleAuth({ onUserChange }: GoogleAuthProps) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('document_converter_user') || localStorage.getItem('swift_shift_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Notify parent on change
  useEffect(() => {
    if (onUserChange) {
      onUserChange(user);
    }
  }, [user, onUserChange]);

  // Manual email sign-in logic
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const name = inputName.trim();
    const email = inputEmail.trim();

    if (!name || !email) {
      setFormError('Please fill in both fields / Lütfen tüm alanları doldurun.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email / Lütfen geçerli bir e-posta girin.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('Creating your local user session / Yerel kullanıcı oturumu açılıyor...');

    setTimeout(() => {
      const manualUser: UserProfile = {
        name,
        email,
        avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(email)}`,
        authType: 'manual-email',
      };
      setUser(manualUser);
      localStorage.setItem('document_converter_user', JSON.stringify(manualUser));
      localStorage.setItem('swift_shift_user', JSON.stringify(manualUser));
      setIsLoading(false);
      setIsOpen(false);
      setInputName('');
      setInputEmail('');
    }, 1000);
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('document_converter_user');
    localStorage.removeItem('swift_shift_user');
    setDropdownOpen(false);
  };

  return (
    <div className="relative" id="google-auth-root">
      <AnimatePresence>
        {user ? (
          /* Logged In State */
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-4 bg-white border-4 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
              id="user-profile-button"
            >
              <div className="w-8 h-8 rounded-xl border-2 border-slate-900 overflow-hidden bg-amber-200 flex-shrink-0">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-slate-900 truncate max-w-[120px] leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] font-bold text-indigo-600 truncate max-w-[120px] leading-none mt-0.5">
                  {user.email}
                </p>
              </div>
            </button>

            {dropdownOpen && (
              <>
                {/* Backdrop overlay */}
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-64 bg-white border-4 border-slate-900 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] z-20 overflow-hidden font-sans p-2"
                >
                  <div className="p-3 border-b-2 border-slate-900">
                    <p className="text-sm font-black text-slate-900">{user.name}</p>
                    <p className="text-xs font-bold text-slate-500 truncate mt-0.5">{user.email}</p>
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 border-2 border-indigo-600/30 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-wider">
                      <Shield className="w-2.5 h-2.5" /> 
                      SECURE SESSION
                    </div>
                  </div>
                  
                  <div className="p-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl text-xs font-black transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      SIGN OUT / ÇIKIŞ YAP
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        ) : (
          /* Signed Out State - Styled with Hollow Shadow */
          <div className="relative group/auth">
            {/* Hollow shadow */}
            <div className="absolute inset-0 border-4 border-slate-900 rounded-full translate-x-1 translate-y-1 -z-10 bg-transparent" />
            <button
              onClick={() => {
                setIsOpen(true);
                setDropdownOpen(false);
                setFormError('');
              }}
              className="flex items-center gap-2.5 p-1.5 px-4 bg-white hover:bg-slate-50 text-slate-900 border-4 border-slate-900 rounded-full font-black text-xs uppercase tracking-wide transition-all cursor-pointer shadow-none"
              id="signin-trigger"
            >
              <User className="w-4 h-4 text-slate-900 flex-shrink-0" />
              <span>SIGN IN / GİRİŞ YAP</span>
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Authentication Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={() => !isLoading && setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative bg-[#FFFBEB] rounded-3xl w-full max-w-md border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col z-10 font-sans"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 px-6 border-b-4 border-slate-900 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-amber-400 rounded-md border-2 border-slate-900 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-slate-900" />
                  </div>
                  <span className="text-xs sm:text-sm font-black tracking-widest uppercase">
                    SIGN IN / OTURUM AÇ
                  </span>
                </div>
                {!isLoading && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800 border-2 border-slate-700 hover:border-white rounded-lg transition-colors cursor-pointer text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                {isLoading ? (
                  /* Loading State */
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                    <RefreshCw className="w-10 h-10 animate-spin text-indigo-600" />
                    <div>
                      <h4 className="text-base font-black text-slate-900 uppercase">Processing...</h4>
                      <p className="text-xs font-bold text-slate-500 mt-1">{loadingStep}</p>
                    </div>
                  </div>
                ) : (
                  /* Manual Sign-In Form */
                  <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                    <div className="p-4 bg-amber-50 border-2 border-slate-900 rounded-2xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex gap-3.5">
                      <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-amber-950 mb-1">
                          Direct Email Sign-In / Doğrudan E-posta Girişi
                        </p>
                        <p className="text-[11px] leading-relaxed text-amber-900 font-bold">
                          Kendi e-posta adresinizle oturum açmak için aşağıdaki formu doldurabilirsiniz. Her kullanıcı kendi bağımsız e-postasıyla giriş yapabilir!
                        </p>
                      </div>
                    </div>

                    {formError && (
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 border-2 border-slate-900 p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                          Your Name / Adınız Soyadınız
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <User className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-white border-2 border-slate-900 rounded-xl p-3 pl-10 text-xs font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-amber-50"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">
                          Your Email / E-posta Adresiniz
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Mail className="w-4 h-4" />
                          </span>
                          <input
                            type="email"
                            value={inputEmail}
                            onChange={(e) => setInputEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            className="w-full bg-white border-2 border-slate-900 rounded-xl p-3 pl-10 text-xs font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-amber-50"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="mt-2 w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 border-2 border-slate-900 rounded-xl text-slate-950 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
                    >
                      Start Session / Oturumu Başlat
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
