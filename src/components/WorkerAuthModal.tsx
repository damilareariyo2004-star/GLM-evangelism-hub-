import React, { useState } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  User
} from 'firebase/auth';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldAlert,
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  UserPlus,
  LogOut,
  User as UserIcon,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { auth } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { verifyAdminAccess, checkIfWorkerRemoved } from '../services/recordService';

interface WorkerAuthModalProps {
  isOpen: boolean;
  currentUser: User | null;
  isGate?: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  onAdminSuccess: (user: User) => void;
}

export const WorkerAuthModal: React.FC<WorkerAuthModalProps> = ({
  isOpen,
  currentUser,
  isGate = false,
  onClose,
  onSuccess,
  onAdminSuccess
}) => {
  const [isAdminView, setIsAdminView] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    'network' | 'popup_blocked' | 'cancelled' | 'unauthorized_domain' | 'operation_not_allowed' | 'other' | null
  >(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const provider = new GoogleAuthProvider();
      // Ensure account selector is always triggered
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);

      // Verify if worker access has been revoked by admin
      const isRemoved = await checkIfWorkerRemoved(result.user.uid);
      if (isRemoved) {
        await signOut(auth);
        setError('Your access has been removed. Please contact your admin.');
        return;
      }

      onSuccess(result.user);
      onClose();
    } catch (err: unknown) {
      console.error('Google Sign-In error:', err);
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('network-request-failed')) {
        setErrorType('network');
        setError(
          'Google authentication network request failed. In preview environments, browser privacy shields (like Brave Shields, uBlock Origin, or Safari cross-site tracking prevention) or iframe sandbox constraints can block authentication network calls.'
        );
      } else if (msg.includes('popup-blocked')) {
        setErrorType('popup_blocked');
        setError(
          'Google Sign-In popup was blocked by your browser. Please allow popups for this site in your address bar.'
        );
      } else if (msg.includes('popup-closed-by-user') || msg.includes('cancelled-popup-request')) {
        setErrorType('cancelled');
        setError('Sign-in was cancelled before completion. Please try again.');
      } else if (msg.includes('unauthorized-domain')) {
        setErrorType('unauthorized_domain');
        setError(
          'This preview domain is not in the Firebase Authorized Domains list. Please add this domain under Firebase Authentication > Settings > Authorized Domains.'
        );
      } else if (msg.includes('operation-not-allowed')) {
        setErrorType('operation_not_allowed');
        setError('Google Sign-In is not enabled in Firebase Console. Please verify provider settings.');
      } else {
        setErrorType('other');
        setError('Sign-in error: ' + msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);

      // Verify admin access by attempting an admin-only read
      const hasAdminRights = await verifyAdminAccess();
      if (!hasAdminRights) {
        await signOut(auth);
        setError('This account is not an admin.');
        return;
      }

      onAdminSuccess(result.user);
      onClose();
    } catch (err: unknown) {
      console.error('Admin Sign-In error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user') || msg.includes('cancelled-popup-request')) {
        setError('Sign-in was cancelled before completion. Please try again.');
      } else if (msg.includes('network-request-failed')) {
        setError('Network request failed. Please check your internet connection.');
      } else {
        setError('Sign-in failed: ' + msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide your email and password.');
      setIsLoading(false);
      return;
    }

    try {
      if (authMode === 'signin') {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        const isRemoved = await checkIfWorkerRemoved(result.user.uid);
        if (isRemoved) {
          await signOut(auth);
          setError('Your access has been removed. Please contact your admin.');
          return;
        }
        onSuccess(result.user);
        onClose();
      } else {
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setIsLoading(false);
          return;
        }
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName.trim()) {
          await updateProfile(result.user, { displayName: displayName.trim() });
        }
        const isRemoved = await checkIfWorkerRemoved(result.user.uid);
        if (isRemoved) {
          await signOut(auth);
          setError('Your access has been removed. Please contact your admin.');
          return;
        }
        onSuccess(result.user);
        onClose();
      }
    } catch (err: unknown) {
      console.error('Email Auth error:', err);
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('operation-not-allowed')) {
        setErrorType('operation_not_allowed');
        setError(
          'Email/Password sign-in is not yet enabled in this Firebase project. You can enable it in Firebase Console under Authentication > Sign-in method > Email/Password, or use Google Sign-In above.'
        );
      } else if (
        msg.includes('user-not-found') ||
        msg.includes('wrong-password') ||
        msg.includes('invalid-credential')
      ) {
        setError('Invalid email or password. Please verify your credentials or create a new worker account.');
      } else if (msg.includes('email-already-in-use')) {
        setError('This email is already registered. Please switch to Sign In.');
      } else if (msg.includes('weak-password')) {
        setError('Password should be at least 6 characters.');
      } else if (msg.includes('network-request-failed')) {
        setErrorType('network');
        setError('Network request failed. Please check your internet connection.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const currentWindowUrl = typeof window !== 'undefined' ? window.location.href : '#';
  const firebaseSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
  const firebaseProvidersUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto min-h-[100dvh] h-[100dvh] ${
        isGate ? 'bg-[#0B1E33]/92 backdrop-blur-sm' : 'bg-slate-950/60 backdrop-blur-xs'
      } animate-in fade-in`}
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 shadow-2xl border border-slate-200 relative space-y-4 sm:space-y-5 my-auto max-h-none overflow-visible">
        {/* Close Button (Hidden when acting as sign-in gate) */}
        {!isGate && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Logo and Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="inline-block p-1 rounded-full bg-white shadow-md border-2 border-[#E02020] mx-auto">
            <img
              src="/assets/aistudio/IMG-20261015-WA0010_bc047986.jpg"
              alt="Gospel Labor Ministry"
              className="w-16 h-16 rounded-full object-contain"
            />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-[#1E5AA8]">
              {isAdminView
                ? 'Admin Sign In'
                : currentUser
                ? 'Worker Profile'
                : 'Church Worker Sign In'}
            </h3>
            <p className="text-xs font-bold text-[#E02020] uppercase tracking-wider mt-0.5">
              Gospel Labor Ministry
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
            {isAdminView
              ? 'Restricted to authorized administrators. View, edit, and delete all church outreach records.'
              : currentUser
              ? 'Your outreach records are securely linked to your unique worker account.'
              : 'Each evangelism worker has a private account to keep outreach contacts and follow-ups confidential.'}
          </p>
        </div>

        {/* Error and Diagnostic Helper */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-slate-800 text-xs space-y-3">
            <div className="flex items-start gap-2 text-[#E02020] font-bold">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#E02020]" />
              <span className="leading-snug">{error}</span>
            </div>

            {/* Quick Action buttons for network or popup errors */}
            {errorType === 'network' && (
              <div className="pt-1 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#1E5AA8] hover:bg-[#15427D] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Retry Google Sign-In</span>
                  </button>

                  <a
                    href={currentWindowUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#1E5AA8]" />
                    <span>Open in Direct Tab</span>
                  </a>
                </div>

                <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-lg border border-red-100 space-y-1">
                  <p className="font-semibold text-slate-800">Why does this happen?</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                    <li>Running inside an embedded iframe preview blocks Google OAuth popup cookies. Opening in a direct browser tab fixes this.</li>
                    <li>Ad-blockers (Brave Shields, uBlock Origin) may block <code>identitytoolkit.googleapis.com</code>.</li>
                  </ul>
                </div>
              </div>
            )}

            {errorType === 'popup_blocked' && (
              <div className="pt-1">
                <a
                  href={currentWindowUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-[#1E5AA8] hover:bg-[#15427D] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open App in Full Tab</span>
                </a>
              </div>
            )}

            {errorType === 'unauthorized_domain' && (
              <div className="pt-1 text-[11px] bg-white p-2.5 rounded-lg border border-red-100 space-y-1">
                <p className="font-semibold text-slate-800">Required Firebase Setup:</p>
                <p className="text-slate-600">
                  Add this domain to Authorized Domains in your Firebase project:
                </p>
                <a
                  href={firebaseSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#1E5AA8] hover:underline font-bold"
                >
                  <span>Open Firebase Auth Settings</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {errorType === 'operation_not_allowed' && (
              <div className="pt-1 text-[11px] bg-white p-2.5 rounded-lg border border-red-100 space-y-1">
                <p className="font-semibold text-slate-800">To enable Email sign-in in Firebase Console:</p>
                <p className="text-slate-600">
                  Go to Authentication &gt; Sign-in method &gt; Enable Email/Password.
                </p>
                <a
                  href={firebaseProvidersUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#1E5AA8] hover:underline font-bold"
                >
                  <span>Open Sign-in Providers</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {currentUser ? (
          /* Already Signed In View */
          <div className="space-y-4 pt-1">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
                <div className="w-10 h-10 rounded-full bg-[#1E5AA8] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                  {currentUser.displayName
                    ? currentUser.displayName[0].toUpperCase()
                    : currentUser.email
                    ? currentUser.email[0].toUpperCase()
                    : 'W'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">
                    {currentUser.displayName || 'Evangelism Worker'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {currentUser.email || 'Authenticated Worker'}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 pt-1">
                <span>Account Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Authenticated
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 pt-0.5">
                <span>Worker UID:</span>
                <span className="font-mono text-[11px] truncate max-w-[160px] text-slate-700">
                  {currentUser.uid}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-[#E02020] text-slate-700 font-bold text-sm transition-colors cursor-pointer border border-slate-200 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        ) : isAdminView ? (
          /* Admin Sign-In Screen */
          <div className="space-y-4 pt-1 animate-in fade-in">
            <button
              type="button"
              onClick={handleAdminGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'Verifying Admin Access...' : 'Continue with Google'}</span>
            </button>

            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsAdminView(false);
                  setError(null);
                  setErrorType(null);
                }}
                className="text-xs text-[#1E5AA8] hover:underline font-semibold cursor-pointer min-h-[36px] inline-flex items-center"
              >
                ← Back to worker sign-in
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Register Tabs & Form */
          <div className="space-y-4">
            {/* Quick Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-xs text-slate-400 font-semibold uppercase whitespace-nowrap">
                or with email
              </span>
              <div className="border-t border-slate-200 w-full"></div>
            </div>

            {/* Tab switch between Sign In and Register */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setError(null);
                  setErrorType(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-white text-[#1E5AA8] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError(null);
                  setErrorType(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-white text-[#E02020] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                New Account
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Worker's Full Name:
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Brother Emmanuel"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#1E5AA8] focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Worker Email:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="worker@gospellabor.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#1E5AA8] focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Password:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#1E5AA8] focus:ring-2 focus:ring-blue-500/20 text-xs sm:text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-[#F7931E] hover:bg-[#E07F0E] text-slate-950 font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer border border-orange-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : authMode === 'signin' ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      <span>Sign In to Evangelism Hub</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-slate-950" />
                      <span>Create Worker Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Subtle help toggle */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                className="text-[11px] text-slate-500 hover:text-[#1E5AA8] font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showTroubleshooting ? 'Hide sign-in tips' : 'Need help signing in?'}</span>
              </button>

              {showTroubleshooting && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-[11px] text-slate-600 space-y-1.5 animate-in fade-in">
                  <p className="font-bold text-slate-800">Troubleshooting Sign-In:</p>
                  <p>
                    1. <strong>Direct Window:</strong> In development preview, opening the hub in a direct tab (via the button above) bypasses iframe sandbox restrictions.
                  </p>
                  <p>
                    2. <strong>Brave / Adblockers:</strong> Disable shields or adblockers for this URL if Google popups fail.
                  </p>
                  <p>
                    3. <strong>Worker Security:</strong> Each signed-in worker can only view and manage their own outreach records.
                  </p>
                </div>
              )}
            </div>

            {/* Link to Admin Access */}
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsAdminView(true);
                  setError(null);
                  setErrorType(null);
                }}
                className="text-xs text-slate-500 hover:text-[#1E5AA8] underline font-medium cursor-pointer min-h-[36px] inline-flex items-center"
              >
                Sign in as admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
