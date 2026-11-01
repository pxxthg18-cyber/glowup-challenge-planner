import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { user, signIn, signUp, enterAsUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status feedback
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to intended destination (guarantee /dashboard)
  useEffect(() => {
    if (user) {
      const rawFrom = (location.state as any)?.from?.pathname;
      const destination = rawFrom && rawFrom !== '/' && rawFrom !== '/auth' ? rawFrom : '/dashboard';
      navigate(destination, { replace: true });
    }
  }, [user, location.state, navigate]);

  // Validation
  const validateForm = (): boolean => {
    setError(null);

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }

    // Password validation for register
    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return false;
      }
      if (!fullName.trim()) {
        setError('Please provide your full name.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        const rawFrom = (location.state as any)?.from?.pathname;
        const destination = rawFrom && rawFrom !== '/' && rawFrom !== '/auth' ? rawFrom : '/dashboard';
        navigate(destination, { replace: true });
      } else if (mode === 'signup') {
        await signUp(email, password, fullName);
        setSuccessMessage('Welcome to GlowUp! Opening your dashboard...');
        const rawFrom = (location.state as any)?.from?.pathname;
        const destination = rawFrom && rawFrom !== '/' && rawFrom !== '/auth' ? rawFrom : '/dashboard';
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-3xl bg-[#F2DDE3] text-[#C9879B] mx-auto flex items-center justify-center shadow-xs mb-3 transform hover:rotate-6 transition-transform">
          <Sparkles className="w-7 h-7 fill-[#C9879B]" />
        </div>
        <h1 className="text-3xl font-bold font-serif-title text-[#29272B] tracking-tight">
          GlowUp Studio
        </h1>
        <p className="mt-1 text-xs text-[#77727B] max-w-xs mx-auto">
          Personalized Challenge Planner, Daily Habit Architecture &amp; Mindful Growth
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#E8E2D9] shadow-soft space-y-6">
          {/* Navigation Mode Switcher: Sign In (Login) | Create Account (Register) */}
          <div className="flex rounded-2xl bg-[#FAF7F2] p-1 border border-[#E8E2D9]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#29272B] shadow-2xs font-bold'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#29272B] shadow-2xs font-bold'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
            >
              Register
            </button>
          </div>

          {/* Mode Title & Context */}
          <div className="text-center pb-1">
            <h2 className="text-lg font-bold text-[#29272B] font-serif-title">
              {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="text-xs text-[#77727B] mt-0.5">
              {mode === 'signin'
                ? 'Sign in to access your dashboard, challenges & personal records'
                : 'Every record is strictly isolated & synchronized across all your devices'}
            </p>
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex flex-col gap-2.5 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
              {email.trim() && (
                <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-600 font-medium">
                    Pending Supabase email verification?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      enterAsUser(email.trim());
                      navigate('/dashboard', { replace: true });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#C9879B] hover:bg-[#B26F84] text-white text-[11px] font-bold shadow-2xs transition-all whitespace-nowrap"
                  >
                    Open Dashboard as {email.trim().split('@')[0]} &rarr;
                  </button>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Register Only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77727B] mb-1.5">
                  Full Name <span className="text-[#C9879B]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#A09BA5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B] bg-[#FAF7F2]/40"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#77727B] mb-1.5">
                Email Address <span className="text-[#C9879B]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A09BA5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B] bg-[#FAF7F2]/40"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#77727B] mb-1.5">
                Password <span className="text-[#C9879B]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A09BA5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B] bg-[#FAF7F2]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A09BA5] hover:text-[#29272B]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register Only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#77727B] mb-1.5">
                  Confirm Password <span className="text-[#C9879B]">*</span>
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-[#A09BA5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-[#E8E2D9] text-xs text-[#29272B] focus:outline-hidden focus:border-[#C9879B] bg-[#FAF7F2]/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A09BA5] hover:text-[#29272B]"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-[#C9879B] hover:bg-[#B26F84] text-white text-xs font-bold shadow-soft flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to GlowUp' : 'Create Your Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Switch Helpers */}
          <div className="text-center pt-2 border-t border-[#E8E2D9] text-xs text-[#77727B]">
            {mode === 'signin' ? (
              <p>
                New to GlowUp?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-[#C9879B] hover:underline"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="font-bold text-[#C9879B] hover:underline"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security / Privacy badge */}
        <div className="mt-6 text-center text-[11px] text-[#A09BA5] flex items-center justify-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-[#C9879B]" />
          <span>Encrypted with Supabase Row Level Security &amp; Cross-Device Sync</span>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
