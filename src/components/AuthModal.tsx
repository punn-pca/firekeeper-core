import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, LogIn, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from '../lib/firebase';
import { trackSignUp, trackLogin, trackLogout, identifyUserInAnalytics } from '../lib/analytics';
import { recordUserSignUp, recordUserLogin } from '../services/usageTracker';
import type { User as FirebaseUser } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        identifyUserInAnalytics(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        trackSignUp('email_password');
        identifyUserInAnalytics(user.uid);
        recordUserSignUp({ uid: user.uid, email: user.email }).catch(() => {});
        setSuccessMessage('สร้างบัญชีผู้ใช้และเข้าสู่ระบบสำเร็จ');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        trackLogin('email_password');
        identifyUserInAnalytics(user.uid);
        recordUserLogin({ uid: user.uid, email: user.email }).catch(() => {});
        setSuccessMessage('เข้าสู่ระบบสำเร็จ');
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์';
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password authentication is not enabled for this Firebase project.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'อีเมลนี้ถูกใช้งานแล้ว';
      } else if (err.code === 'auth/weak-password') {
        msg = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'รูปแบบอีเมลไม่ถูกต้อง';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย กรุณาตรวจสอบอินเทอร์เน็ต';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      trackLogin('google');
      identifyUserInAnalytics(user.uid);
      recordUserLogin({ uid: user.uid, email: user.email }).catch(() => {});
      setSuccessMessage('เข้าสู่ระบบด้วย Google สำเร็จ');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      trackLogout();
      identifyUserInAnalytics(null);
      await signOut(auth);
      setSuccessMessage('ออกจากระบบเรียบร้อยแล้ว');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0F131A] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl overflow-hidden text-[#F5F7FA]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)] bg-[#0A0D14]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF8A00]/20 flex items-center justify-center text-[#FF8A00]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                {currentUser ? 'บัญชีผู้ใช้งานระบบ (User Account)' : isSignUp ? 'สมัครสมาชิก (Sign Up)' : 'เข้าสู่ระบบ (Sign In)'}
              </h3>
              <p className="text-[11px] text-[#9AA5B1]">Fire Keeper Executive Intelligence Auth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9AA5B1] hover:text-[#F5F7FA] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {currentUser ? (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-[#151B24] border border-[rgba(255,255,255,0.06)] space-y-2">
                <div className="text-xs text-[#9AA5B1]">เข้าสู่ระบบในนาม:</div>
                <div className="font-mono text-sm font-bold text-[#FF8A00] truncate">{currentUser.email}</div>
                <div className="text-[11px] text-[#9AA5B1] font-mono">UID: {currentUser.uid}</div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer border border-red-500/30"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ (Sign Out)</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9AA5B1]">อีเมล (Email)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA5B1]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@enterprise.com"
                    className="w-full bg-[#151B24] border border-[rgba(255,255,255,0.08)] rounded-xl px-3.5 py-2.5 pl-10 text-xs text-[#F5F7FA] placeholder-[#9AA5B1]/50 focus:outline-none focus:border-[#FF8A00] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9AA5B1]">รหัสผ่าน (Password)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA5B1]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#151B24] border border-[rgba(255,255,258,0.08)] rounded-xl px-3.5 py-2.5 pl-10 text-xs text-[#F5F7FA] placeholder-[#9AA5B1]/50 focus:outline-none focus:border-[#FF8A00] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FF8A00] hover:bg-[#FF8A00]/90 text-slate-950 font-bold text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#FF8A00]/20 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{isLoading ? 'กำลังดำเนินการ...' : isSignUp ? 'ลงทะเบียน (Sign Up)' : 'เข้าสู่ระบบ (Sign In)'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[rgba(255,255,255,0.08)]"></div>
                <span className="flex-shrink mx-3 text-[11px] text-[#9AA5B1]">หรือ</span>
                <div className="flex-grow border-t border-[rgba(255,255,255,0.08)]"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#151B24] hover:bg-[#1B222D] text-[#F5F7FA] border border-[rgba(255,255,255,0.1)] font-semibold text-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>เข้าสู่ระบบด้วย Google (Google Sign-In)</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs text-[#9AA5B1] hover:text-[#FF8A00] transition-colors cursor-pointer"
                >
                  {isSignUp ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบที่นี่' : 'ยังไม่มีบัญชี? สมัครสมาชิกใหม่'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
