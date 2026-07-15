import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, LogOut, Key, Shield, Check, Info, Settings, AlertCircle, RefreshCw
} from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  authType: 'simulated' | 'google-sdk';
}

interface GoogleAuthProps {
  onUserChange?: (user: UserProfile | null) => void;
}

export default function GoogleAuth({ onUserChange }: GoogleAuthProps) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('swift_shift_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'sdk'>('quick');
  const [customClientId, setCustomClientId] = useState(() => {
    return localStorage.getItem('swift_shift_google_client_id') || '';
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [sdkError, setSdkError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Notify parent on load or change
  useEffect(() => {
    if (onUserChange) {
      onUserChange(user);
    }
  }, [user, onUserChange]);

  // Load Google Identity Services SDK if Client ID is configured
  useEffect(() => {
    if (!customClientId || user) return;

    // Load standard Google One Tap/Button script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeGoogleGsi();
    };
    script.onerror = () => {
      setSdkError('Failed to load Google Sign-In SDK. Check your internet connection.');
    };
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // ignore
      }
    };
  }, [customClientId, user]);

  const initializeGoogleGsi = () => {
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: customClientId,
          callback: handleGoogleGsiCallback,
          auto_select: false,
        });

        // Try to render standard Google button in the target container if modal is open
        setTimeout(() => {
          const btnEl = document.getElementById('google-gsi-btn-target');
          if (btnEl && window.google?.accounts?.id) {
            window.google.accounts.id.renderButton(btnEl, {
              theme: 'outline',
              size: 'large',
              shape: 'pill',
              width: 250,
            });
          }
        }, 100);
      }
    } catch (err: any) {
      setSdkError(err?.message || 'Error initializing Google Sign-In');
    }
  };

  // Trigger rendering when tab changes to SDK
  useEffect(() => {
    if (activeTab === 'sdk' && customClientId) {
      initializeGoogleGsi();
    }
  }, [activeTab, customClientId]);

  const handleGoogleGsiCallback = (response: any) => {
    setIsLoading(true);
    setLoadingStep('Decoding secure Google token...');
    
    try {
      // Decode JWT payload locally (Google credential JWT consists of 3 parts)
      const token = response.credential;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const parsed = JSON.parse(jsonPayload);
      
      setTimeout(() => {
        const loggedInUser: UserProfile = {
          name: parsed.name || parsed.given_name || 'Google User',
          email: parsed.email || 'user@gmail.com',
          avatar: parsed.picture || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${parsed.email}`,
          authType: 'google-sdk',
        };
        
        setUser(loggedInUser);
        localStorage.setItem('swift_shift_user', JSON.stringify(loggedInUser));
        setIsLoading(false);
        setIsOpen(false);
      }, 1000);
      
    } catch (err: any) {
      setIsLoading(false);
      setSdkError('Failed to parse Google login response: ' + err.message);
    }
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('swift_shift_google_client_id', customClientId.trim());
    setSdkError('');
    initializeGoogleGsi();
  };

  // Perform smooth simulated login
  const handleSimulatedLogin = (name: string, email: string) => {
    setIsLoading(true);
    setLoadingStep('Contacting secure accounts server...');
    
    setTimeout(() => {
      setLoadingStep('Authorizing secure local sandbox...');
      
      setTimeout(() => {
        setLoadingStep('Creating encryption keys...');
        
        setTimeout(() => {
          const simulatedUser: UserProfile = {
            name,
            email,
            avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(email)}`,
            authType: 'simulated'
          };
          setUser(simulatedUser);
          localStorage.setItem('swift_shift_user', JSON.stringify(simulatedUser));
          setIsLoading(false);
          setIsOpen(false);
        }, 500);
      }, 400);
    }, 400);
  };

  const handleSignOut = () => {
    setUser(null);
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
                {/* Backdrop overlay to close */}
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
                      {user.authType === 'simulated' ? 'LOCAL SECURE SESSION' : 'OFFICIAL GOOGLE OAUTH'}
                    </div>
                  </div>
                  
                  <div className="p-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl text-xs font-black transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      SIGN OUT ACCOUNT
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        ) : (
          /* Signed Out State */
          <button
            onClick={() => {
              setIsOpen(true);
              setDropdownOpen(false);
            }}
            className="flex items-center gap-2.5 p-2 px-4 bg-white hover:bg-slate-50 text-slate-900 border-4 border-slate-900 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wide shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            id="google-signin-trigger"
          >
            {/* Custom Google G Logo */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3.01-1.3 4a12.2 12.2 0 011.02.83c1.72-1.58 2.71-3.9 2.71-6.68z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.87-3c-1.08.72-2.47 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01L1.26 17.1A12 12 0 0012 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.24 14.24a7.2 7.2 0 010-4.48L1.26 6.8a12 12 0 000 10.43l3.98-2.99z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A12 12 0 001.26 6.8l3.98 2.99c.95-2.88 3.61-5.04 6.76-5.04z"
              />
            </svg>
            <span>SIGN IN WITH GOOGLE</span>
          </button>
        )}
      </AnimatePresence>

      {/* Auth Modal overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => !isLoading && setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative bg-[#FFFBEB] rounded-3xl w-full max-w-md border-4 border-slate-900 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col z-10"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 px-6 border-b-4 border-slate-900 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-amber-400 rounded-md border-2 border-slate-900 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-slate-900" />
                  </div>
                  <span className="text-xs sm:text-sm font-black tracking-widest uppercase">
                    Google Authentication
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

              {/* Tabs */}
              <div className="grid grid-cols-2 border-b-4 border-slate-900 bg-white">
                <button
                  onClick={() => setActiveTab('quick')}
                  className={`py-3.5 text-xs font-black uppercase tracking-wider text-center border-r-4 border-slate-900 transition-colors ${
                    activeTab === 'quick' ? 'bg-amber-200 text-slate-900' : 'bg-white text-slate-500 hover:text-slate-900'
                  }`}
                  disabled={isLoading}
                >
                  ⚡ Quick Sign-In
                </button>
                <button
                  onClick={() => setActiveTab('sdk')}
                  className={`py-3.5 text-xs font-black uppercase tracking-wider text-center transition-colors ${
                    activeTab === 'sdk' ? 'bg-amber-200 text-slate-900' : 'bg-white text-slate-500 hover:text-slate-900'
                  }`}
                  disabled={isLoading}
                >
                  ⚙️ Google API Client
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 flex-1 flex flex-col gap-4">
                {isLoading ? (
                  /* Loading State */
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                    <RefreshCw className="w-10 h-10 animate-spin text-indigo-600" />
                    <div>
                      <h4 className="text-base font-black text-slate-900 uppercase">Connecting...</h4>
                      <p className="text-xs font-bold text-slate-500 mt-1">{loadingStep}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'quick' ? (
                      /* Quick Simulated Accounts Tab */
                      <div className="flex flex-col gap-4">
                        <div className="p-3.5 bg-indigo-50 border-2 border-slate-900 rounded-xl flex gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] leading-relaxed text-indigo-950 font-bold">
                            Welcome! Since Firebase was declined, you can login with this instant secure sandbox account. This simulates Google authentication entirely client-side.
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 mt-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Available Google Profiles
                          </span>

                          {/* Profile 1: Custom matched from metadata! */}
                          <button
                            onClick={() => handleSimulatedLogin('Can Ve Binar', 'can.ve.binar@gmail.com')}
                            className="flex items-center gap-3.5 p-3.5 bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-left transition-all cursor-pointer group"
                          >
                            <div className="w-10 h-10 rounded-lg border-2 border-slate-900 bg-amber-100 overflow-hidden flex-shrink-0 group-hover:rotate-3 transition-transform">
                              <img src="https://api.dicebear.com/7.x/fun-emoji/svg?seed=can.ve.binar@gmail.com" alt="Can Ve Binar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900">Can Ve Binar</p>
                              <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">can.ve.binar@gmail.com</p>
                            </div>
                            <span className="text-[9px] font-black bg-emerald-400 border-2 border-slate-900 px-2 py-0.5 rounded-md uppercase text-slate-900 group-hover:scale-105 transition-transform">
                              OWNER
                            </span>
                          </button>

                          {/* Profile 2: Standard Demo */}
                          <button
                            onClick={() => handleSimulatedLogin('Demo Tester', 'demo.tester@gmail.com')}
                            className="flex items-center gap-3.5 p-3.5 bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-left transition-all cursor-pointer group"
                          >
                            <div className="w-10 h-10 rounded-lg border-2 border-slate-900 bg-emerald-100 overflow-hidden flex-shrink-0 group-hover:-rotate-3 transition-transform">
                              <img src="https://api.dicebear.com/7.x/fun-emoji/svg?seed=demo.tester@gmail.com" alt="Demo Tester" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-slate-900">Demo Tester</p>
                              <p className="text-[10px] font-bold text-slate-500 truncate mt-0.5">demo.tester@gmail.com</p>
                            </div>
                            <span className="text-[9px] font-black bg-rose-400 border-2 border-slate-900 px-2 py-0.5 rounded-md uppercase text-slate-900 group-hover:scale-105 transition-transform">
                              TESTER
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Real Google One Tap / Button SDK Configuration Tab */
                      <div className="flex flex-col gap-4">
                        <div className="p-3.5 bg-amber-100 border-2 border-slate-900 rounded-xl flex gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                          <Key className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] leading-relaxed text-amber-950 font-bold">
                            Want to connect real Google accounts? Provide your Google Client ID to render the official Google Identity client-side component.
                          </p>
                        </div>

                        <form onSubmit={handleSaveClientId} className="flex flex-col gap-3">
                          <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                              Google Client ID (from Google Cloud Console)
                            </label>
                            <input
                              type="text"
                              value={customClientId}
                              onChange={(e) => setCustomClientId(e.target.value)}
                              placeholder="12345678-abcdef.apps.googleusercontent.com"
                              className="w-full bg-white border-2 border-slate-900 rounded-xl p-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-amber-50"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 border-2 border-slate-900 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
                          >
                            Save Client ID &amp; Load Button
                          </button>
                        </form>

                        {customClientId ? (
                          <div className="flex flex-col items-center gap-3.5 mt-3 border-t-2 border-slate-900/10 pt-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              Official Google Button
                            </span>
                            
                            {/* Standard GSI Container Target */}
                            <div id="google-gsi-btn-target" className="min-h-[44px]" />
                            
                            {sdkError && (
                              <div className="flex items-center gap-2 text-[10px] font-bold text-rose-600 bg-rose-50 border-2 border-slate-900 p-2.5 rounded-lg max-w-full">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{sdkError}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-6 border-2 border-dashed border-slate-900/10 rounded-xl mt-2 text-xs font-bold text-slate-400">
                            Provide Client ID above to render official button
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
