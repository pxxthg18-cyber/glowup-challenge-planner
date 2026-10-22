import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
      // After sign-in/sign-up, go to Challenge Template Gallery
      navigate('/templates');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#F2DDE3] text-[#C9879B] mx-auto flex items-center justify-center shadow-xs mb-3">
          <Sparkles className="w-6 h-6 fill-[#C9879B]" />
        </div>
        <h1 className="text-3xl font-bold font-serif-title text-[#29272B] tracking-tight">
          GlowUp
        </h1>
        <p className="mt-1 text-xs text-[#77727B]">
          Personalized Glow-Up Challenge Planner &amp; Notion-Style Life Architecture
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#E8E2D9] shadow-medium space-y-6">
          {/* Mode Switcher */}
          <div className="flex rounded-2xl bg-[#FAF7F2] p-1 border border-[#E8E2D9]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#29272B] shadow-xs'
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
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#29272B] shadow-xs'
                  : 'text-[#77727B] hover:text-[#29272B]'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#29272B] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#77727B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#29272B] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#77727B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#29272B] mb-1">
                Password {!import.meta.env.VITE_SUPABASE_URL && <span className="text-[#77727B] font-normal">(any password works in local mode)</span>}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#77727B] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-[#C9879B]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#29272B] hover:bg-[#3E3B40] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>{loading ? 'Please wait…' : mode === 'signin' ? 'Sign In to GlowUp' : 'Create Your Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
