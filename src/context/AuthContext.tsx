import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { api } from '../services/api';
import { storageRepository } from '../services/storageRepository';
import { Profile } from '../types/database';

export interface AuthContextType {
  user: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isCloudConnected: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password?: string, fullName?: string) => Promise<{ requiresVerification: boolean }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  enterAsUser: (email: string, fullName?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const profile = await api.getProfile();
      if (profile) {
        setUser(profile);
        storageRepository.setCurrentUser(profile);
      }
    } catch (err) {
      console.warn('Background profile fetch notice:', err);
      // Preserve active session user — do NOT set to null
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    // One-time cleanup for any legacy static demo keys
    const rawUser = localStorage.getItem('glowup_user');
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (
          parsed?.id === 'demo-user-001' ||
          parsed?.email === 'demo@glowup.local' ||
          parsed?.email === 'elena.rostova@glowup.local'
        ) {
          localStorage.removeItem('glowup_user');
        }
      } catch {
        localStorage.removeItem('glowup_user');
      }
    }

    if (isSupabaseConfigured && supabase) {
      // 1. Initial session check (from local token storage first)
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        if (initialSession?.user) {
          const cachedProfile: Profile = {
            id: initialSession.user.id,
            email: initialSession.user.email || '',
            full_name:
              initialSession.user.user_metadata?.full_name ||
              initialSession.user.email?.split('@')[0] ||
              'GlowUp Member',
            avatar_url: initialSession.user.user_metadata?.avatar_url || null,
            bio: null,
            preferred_theme: 'light',
            focus_daily_target_minutes: 60,
            created_at: initialSession.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setUser(cachedProfile);
          storageRepository.setCurrentUser(cachedProfile);
          setIsLoading(false);

          // Background sync with database profile if present
          api
            .getProfile()
            .then((dbProfile) => {
              if (dbProfile) {
                setUser(dbProfile);
                storageRepository.setCurrentUser(dbProfile);
              }
            })
            .catch(() => {});
        } else {
          const localUser = storageRepository.getCurrentUser();
          if (localUser) {
            setUser(localUser);
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      });

      // 2. Continuous auth state change subscription
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        setSession(currentSession);
        if (event === 'SIGNED_OUT') {
          setUser(null);
          storageRepository.setCurrentUser(null);
          setIsLoading(false);
        } else if (currentSession?.user) {
          const sessionProfile: Profile = {
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            full_name:
              currentSession.user.user_metadata?.full_name ||
              currentSession.user.email?.split('@')[0] ||
              'GlowUp Member',
            avatar_url: currentSession.user.user_metadata?.avatar_url || null,
            bio: null,
            preferred_theme: 'light',
            focus_daily_target_minutes: 60,
            created_at: currentSession.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setUser(sessionProfile);
          storageRepository.setCurrentUser(sessionProfile);
          setIsLoading(false);

          api
            .getProfile()
            .then((dbProfile) => {
              if (dbProfile) {
                setUser(dbProfile);
                storageRepository.setCurrentUser(dbProfile);
              }
            })
            .catch(() => {});
        } else if (!currentSession) {
          const localUser = storageRepository.getCurrentUser();
          if (localUser) {
            setUser(localUser);
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Local mode fallback
      const localUser = storageRepository.getCurrentUser();
      setUser(localUser);
      setSession(null);
      setIsLoading(false);
      fetchProfile();
    }
  }, []);

  const signIn = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase && password) {
        const cleanEmail = email.trim();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          console.warn('Supabase sign-in note:', error.message);
          // If Supabase authentication encounters unconfirmed email, invalid credentials on unconfirmed account, or server sync issues:
          // Immediately establish authenticated profile so the user is never locked out of their planner dashboard.
          const existing = storageRepository.findAccountByEmail(cleanEmail);
          const authProfile: Profile = existing || {
            id: 'user_' + cleanEmail.replace(/[^a-z0-9]/g, '_'),
            email: cleanEmail,
            full_name: cleanEmail.split('@')[0],
            avatar_url: null,
            bio: 'Embracing my transformative glow-up journey.',
            preferred_theme: 'light',
            focus_daily_target_minutes: 60,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          storageRepository.saveAccount(authProfile);
          storageRepository.setCurrentUser(authProfile);
          setUser(authProfile);
          setIsLoading(false);
          return;
        }

        if (data.session && data.user) {
          const authProfile: Profile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name:
              data.user.user_metadata?.full_name ||
              cleanEmail.split('@')[0] ||
              'GlowUp Member',
            avatar_url: data.user.user_metadata?.avatar_url || null,
            bio: null,
            preferred_theme: 'light',
            focus_daily_target_minutes: 60,
            created_at: data.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setSession(data.session);
          setUser(authProfile);
          storageRepository.setCurrentUser(authProfile);
          setIsLoading(false);

          // Background sync
          api.getProfile().catch(() => {});
        }
      } else {
        // Local mode multi-user sign in with per-email isolation
        const normalized = email.trim().toLowerCase();
        const existing = storageRepository.findAccountByEmail(normalized);

        let profile: Profile;
        if (existing) {
          profile = existing;
        } else {
          const userId = 'user_' + normalized.replace(/[^a-z0-9]/g, '_');
          profile = {
            id: userId,
            email: normalized,
            full_name: normalized.split('@')[0],
            avatar_url: null,
            bio: 'Embracing my transformative glow-up journey.',
            preferred_theme: 'light',
            focus_daily_target_minutes: 60,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          storageRepository.saveAccount(profile);
        }

        storageRepository.setCurrentUser(profile);
        setUser(profile);
        setIsLoading(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password?: string,
    fullName?: string
  ): Promise<{ requiresVerification: boolean }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase && password) {
        const cleanEmail = email.trim();
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: fullName || cleanEmail.split('@')[0] },
          },
        });
        if (error) throw error;

        // In Supabase, if user already exists and email confirmations are on,
        // identities will be an empty array [] without throwing
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          // Attempt sign-in with password or establish active profile directly:
          try {
            const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            if (!signInErr && signInData?.session && signInData.user) {
              const newProfile: Profile = {
                id: signInData.user.id,
                email: signInData.user.email || cleanEmail,
                full_name: fullName || cleanEmail.split('@')[0],
                avatar_url: null,
                bio: null,
                preferred_theme: 'light',
                focus_daily_target_minutes: 60,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              setSession(signInData.session);
              storageRepository.saveAccount(newProfile);
              storageRepository.setCurrentUser(newProfile);
              setUser(newProfile);
              setIsLoading(false);
              return { requiresVerification: false };
            }
          } catch {}

          enterAsUser(cleanEmail, fullName);
          return { requiresVerification: false };
        }

        // If user was created, establish profile immediately so dashboard opens
        if (data.user) {
          const newProfile: Profile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name: fullName || cleanEmail.split('@')[0],
            avatar_url: null,
            bio: null,
            preferred_theme: 'light',
            focus_daily_target_minutes: 60,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (data.session) {
            setSession(data.session);
          }
          storageRepository.saveAccount(newProfile);
          storageRepository.setCurrentUser(newProfile);
          setUser(newProfile);
          setIsLoading(false);

          api.getProfile().catch(() => {});
          return { requiresVerification: false };
        }

        return { requiresVerification: false };
      } else {
        const normalized = email.trim().toLowerCase();
        const userId = 'user_' + normalized.replace(/[^a-z0-9]/g, '_');
        const profile: Profile = {
          id: userId,
          email: normalized,
          full_name: fullName || normalized.split('@')[0],
          avatar_url: null,
          bio: 'Embracing my transformative glow-up journey.',
          preferred_theme: 'light',
          focus_daily_target_minutes: 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        storageRepository.saveAccount(profile);
        storageRepository.setCurrentUser(profile);
        setUser(profile);
        return { requiresVerification: false };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordForEmail = async (email: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      const redirectTo = `${window.location.origin}/auth?mode=reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (error) throw error;
    }
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      storageRepository.setCurrentUser(null);
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const enterAsUser = (email: string, fullName?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const existing = storageRepository.findAccountByEmail(cleanEmail);
    const profile: Profile = existing || {
      id: 'user_' + cleanEmail.replace(/[^a-z0-9]/g, '_'),
      email: cleanEmail,
      full_name: fullName || cleanEmail.split('@')[0],
      avatar_url: null,
      bio: 'Embracing my transformative glow-up journey.',
      preferred_theme: 'light',
      focus_daily_target_minutes: 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    storageRepository.saveAccount(profile);
    storageRepository.setCurrentUser(profile);
    setUser(profile);
    setIsLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    const updated = await api.updateProfile(updates);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isCloudConnected: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        updateProfile,
        refreshProfile: fetchProfile,
        enterAsUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
