import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MembershipTier, SubscriptionInfo } from '../types';
import { APP_CONFIG } from '../config/env';
import { apiFetch } from '../config/api';

export const DEFAULT_MEMBERSHIP_TIERS: Record<MembershipTier, { name: string; thbPrice: number; tokenQuota: number }> = {
  free: { name: 'Free Trial Tier', thbPrice: 0, tokenQuota: 150000 },
  starter: { name: 'Solo Analyst Tier', thbPrice: 199, tokenQuota: 300000 },
  pro: { name: 'Pro Analyst Tier', thbPrice: 490, tokenQuota: 1000000 },
  academic: { name: 'Academic & Peer-Audit Tier', thbPrice: 990, tokenQuota: 3000000 },
  enterprise: { name: 'Enterprise Sovereign Governance Tier', thbPrice: 2490, tokenQuota: 10000000 },
};

export const createDefaultSubscription = (tier: MembershipTier = 'free'): SubscriptionInfo => {
  const config = DEFAULT_MEMBERSHIP_TIERS[tier];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  return {
    tier,
    tierName: config.name,
    priceMonthlyThb: config.thbPrice,
    tokenQuotaMonthly: config.tokenQuota,
    tokensUsedThisMonth: 12450, // default initial sample usage
    resetDate: nextMonth.toISOString().split('T')[0],
    status: 'active',
    billingCycle: 'monthly',
  };
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updateSubscriptionTier: (tier: MembershipTier, billingCycle?: 'monthly' | 'yearly', paymentMethodLast4?: string) => Promise<void>;
  trackTokenUsage: (tokensCount: number) => void;
  resetTokenQuota: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  isProfileModalOpen: boolean;
  openPricingModal: () => void;
  closePricingModal: () => void;
  isPricingModalOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check local stored session
    const savedToken = localStorage.getItem(APP_CONFIG.TOKEN_KEY);
    const savedUser = localStorage.getItem(APP_CONFIG.USER_KEY);

    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed === 'object') {
          // Ensure membership exists
          if (!parsed.membership) {
            parsed.membership = createDefaultSubscription(parsed.isGuest ? 'free' : 'pro');
          }
          setUser(parsed);
        } else {
          initGuestUser();
        }
      } catch (e) {
        console.error('Failed to parse cached user', e);
        initGuestUser();
      }
    } else {
      initGuestUser();
    }
    setIsLoading(false);
  }, []);

  const saveUserSession = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(APP_CONFIG.USER_KEY, JSON.stringify(updatedUser));
    if (updatedUser.token) {
      localStorage.setItem(APP_CONFIG.TOKEN_KEY, updatedUser.token);
    }
  };

  const initGuestUser = () => {
    const guestUser: User = {
      id: 'guest-' + Math.random().toString(36).substring(2, 9),
      name: 'Guest Analyst',
      email: 'guest@firekeeper.local',
      role: 'Guest Inspector',
      organization: 'PCA Sandbox',
      isGuest: true,
      token: 'guest-token-' + Date.now(),
      created_at: new Date().toISOString(),
      membership: createDefaultSubscription('free'),
    };
    saveUserSession(guestUser);
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      let resUser: User;
      let resToken: string;

      try {
        const res = await apiFetch<{ user: User; token: string }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password: pass }),
        });
        resUser = res.user;
        resToken = res.token;
      } catch (apiErr) {
        // Fallback for client preview/mock users
        resUser = {
          id: 'usr-' + Math.random().toString(36).substring(2, 9),
          name: email.split('@')[0].toUpperCase(),
          email,
          role: 'Senior Executive Analyst',
          organization: 'FireKeeper Enterprise',
          isGuest: false,
          token: 'auth-jwt-' + Date.now(),
          created_at: new Date().toISOString(),
          membership: createDefaultSubscription('pro'),
        };
        resToken = resUser.token!;
      }

      if (!resUser.membership) {
        resUser.membership = createDefaultSubscription('pro');
      }

      saveUserSession(resUser);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      let resUser: User;
      let resToken: string;

      try {
        const res = await apiFetch<{ user: User; token: string }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password: pass }),
        });
        resUser = res.user;
        resToken = res.token;
      } catch (apiErr) {
        resUser = {
          id: 'usr-' + Math.random().toString(36).substring(2, 9),
          name,
          email,
          role: 'Strategic Risk Auditor',
          organization: 'PUNN Cognitive OS',
          isGuest: false,
          token: 'auth-jwt-' + Date.now(),
          created_at: new Date().toISOString(),
          membership: createDefaultSubscription('pro'),
        };
        resToken = resUser.token!;
      }

      if (!resUser.membership) {
        resUser.membership = createDefaultSubscription('pro');
      }

      saveUserSession(resUser);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Register error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = async () => {
    initGuestUser();
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem(APP_CONFIG.USER_KEY);
    localStorage.removeItem(APP_CONFIG.TOKEN_KEY);
    initGuestUser();
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const updatedUser: User = {
        ...user,
        ...updates,
        preferences: {
          ...user.preferences,
          ...updates.preferences,
        },
      };

      // Try sending to server endpoint
      try {
        await apiFetch('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      } catch (err) {
        // Fallback local update
      }

      saveUserSession(updatedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscriptionTier = async (
    tier: MembershipTier,
    billingCycle: 'monthly' | 'yearly' = 'monthly',
    paymentMethodLast4: string = '8892'
  ) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const tierConfig = DEFAULT_MEMBERSHIP_TIERS[tier];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const newMembership: SubscriptionInfo = {
        tier,
        tierName: tierConfig.name,
        priceMonthlyThb: billingCycle === 'yearly' ? Math.round(tierConfig.thbPrice * 0.8) : tierConfig.thbPrice,
        tokenQuotaMonthly: tierConfig.tokenQuota,
        tokensUsedThisMonth: user.membership?.tokensUsedThisMonth || 0,
        resetDate: nextMonth.toISOString().split('T')[0],
        status: 'active',
        billingCycle,
        paymentMethodLast4,
        lastPaymentDate: new Date().toISOString().split('T')[0],
      };

      const updatedUser: User = {
        ...user,
        membership: newMembership,
      };

      try {
        await apiFetch('/auth/subscribe', {
          method: 'POST',
          body: JSON.stringify(newMembership),
        });
      } catch (err) {
        // fallback
      }

      saveUserSession(updatedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const trackTokenUsage = (tokensCount: number) => {
    if (!user) return;
    const currentMembership = user.membership || createDefaultSubscription(user.isGuest ? 'free' : 'pro');
    const updatedTokensUsed = (currentMembership.tokensUsedThisMonth || 0) + tokensCount;

    const updatedUser: User = {
      ...user,
      membership: {
        ...currentMembership,
        tokensUsedThisMonth: updatedTokensUsed,
      },
    };

    saveUserSession(updatedUser);
  };

  const resetTokenQuota = () => {
    if (!user || !user.membership) return;
    const updatedUser: User = {
      ...user,
      membership: {
        ...user.membership,
        tokensUsedThisMonth: 0,
      },
    };
    saveUserSession(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !user.isGuest,
        isLoading,
        login,
        register,
        loginAsGuest,
        logout,
        updateProfile,
        updateSubscriptionTier,
        trackTokenUsage,
        resetTokenQuota,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        isAuthModalOpen,
        openProfileModal: () => setIsProfileModalOpen(true),
        closeProfileModal: () => setIsProfileModalOpen(false),
        isProfileModalOpen,
        openPricingModal: () => setIsPricingModalOpen(true),
        closePricingModal: () => setIsPricingModalOpen(false),
        isPricingModalOpen,
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
