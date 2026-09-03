import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, LogIn, LogOut, AlertCircle, CheckCircle2, Copy, Check, ExternalLink, HelpCircle, ChevronDown, ChevronUp, Globe } from 'lucide-react';
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
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2500);
    }
  };

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
    console.log('Attempting sign in/up. Auth initialized:', !!auth, 'Email:', email);

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
      console.error('Auth error detail:', err);
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

    if ((auth as any)._isDummy) {
      setError('ไม่สามารถเชื่อมต่อกับระบบตรวจสอบสิทธิ์ได้ (Firebase Auth Initialization Failed)');
      setIsLoading(false);
      return;
    }

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
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User voluntarily closed the popup window or canceled the request - not a system error
        setIsLoading(false);
        return;
      }

      console.error('Google Auth error:', err);
      
      const isUnauthorizedDomain = 
        err.code === 'auth/unauthorized-domain' || 
        err.message?.toLowerCase().includes('unauthorized domain') ||
        err.message?.toLowerCase().includes('unauthorized-domain');

      if (isUnauthorizedDomain) {
        setShowTroubleshoot(true);
        setError(`โดเมนปัจจุบัน (${currentHostname}) ยังไม่ได้ถูกเพิ่มใน Authorized Domains ของ Firebase Console กรุณาดูคำแนะนำวิธีแก้ไขด้านล่างครับ`);
        setIsLoading(false);
        return;
      }

      if (err.code === 'auth/operation-not-allowed') {
        setShowTroubleshoot(true);
        setError('Google Sign-In ยังไม่ได้เปิดใช้งานใน Firebase Console > Authentication > Sign-in method');
        setIsLoading(false);
        return;
      }

      if (err.code === 'auth/popup-blocked') {
        setShowTroubleshoot(true);
        setError('เบราว์เซอร์หรือ Safari บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้ในการตั้งค่าเบราว์เซอร์');
        setIsLoading(false);
        return;
      }

      const isSecurityOrStorageError = 
        err.message?.toLowerCase().includes('insecure') || 
        err.message?.toLowerCase().includes('security') || 
        err.message?.toLowerCase().includes('storage') ||
        err.message?.toLowerCase().includes('blocked') ||
        err.code?.toLowerCase().includes('security') ||
        err.code?.toLowerCase().includes('storage');

      if (isSecurityOrStorageError) {
        setError(
          'การเข้าสู่ระบบถูกจำกัดโดย Sandbox ของเบราว์เซอร์ (Security Sandbox Restriction) กรุณาคลิกเปิดแอปพลิเคชันใน "แท็บใหม่" (Open in New Tab) จากปุ่มมุมขวาบนของ AI Studio เพื่อลงชื่อเข้าใช้งานด้วย Google ได้อย่างปลอดภัย 100% ครับ'
        );
      } else {
        setError(err.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้');
      }
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

          {/* Troubleshooting Help Panel */}
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={() => setShowTroubleshoot(!showTroubleshoot)}
              className="w-full flex items-center justify-between text-[11px] font-medium text-[#9AA5B1] hover:text-[#F5F7FA] transition-colors p-2 rounded-lg hover:bg-white/5 cursor-pointer"
            >
              <div className="flex items-center space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-[#FF8A00]" />
                <span>พบปัญหา "The requested action is invalid" หรือเข้าสู่ระบบไม่ได้?</span>
              </div>
              {showTroubleshoot ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTroubleshoot && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#151B24] border border-[rgba(255,255,255,0.08)] space-y-3 text-xs animate-fadeIn">
                <div className="text-[#9AA5B1] text-[11px] leading-relaxed">
                  ข้อความ <span className="font-mono text-amber-400">"The requested action is invalid."</span> บนแท็บ Firebase เกิดจาก <strong className="text-[#F5F7FA]">โดเมนปัจจุบันยังไม่ได้ถูกลงทะเบียนใน Authorized Domains</strong> ของโครงการ Firebase ครับ
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-[#9AA5B1] flex items-center space-x-1">
                    <Globe className="w-3 h-3 text-[#FF8A00]" />
                    <span>1. โดเมนปัจจุบันที่ต้องนำไปเพิ่ม (Current Domain):</span>
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0A0D14] border border-[rgba(255,255,255,0.06)] font-mono text-[11px]">
                    <span className="text-[#F5F7FA] truncate mr-2">{currentHostname || 'ais-dev-...run.app'}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentHostname)}
                      className="shrink-0 flex items-center space-x-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[#F5F7FA] transition-colors cursor-pointer text-[10px]"
                    >
                      {copiedText === currentHostname ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">คัดลอกแล้ว</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#9AA5B1]" />
                          <span>คัดลอก</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-[#9AA5B1] bg-[#0A0D14]/50 p-2.5 rounded-lg border border-white/5">
                  <div className="font-semibold text-[#F5F7FA] mb-1">2. ขั้นตอนการตั้งค่าใน Firebase Console:</div>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>ไปที่เมนู <strong className="text-white">Authentication</strong> &gt; แท็บ <strong className="text-white">Settings</strong></li>
                    <li>เลื่อนลงไปที่หัวข้อ <strong className="text-white">Authorized domains</strong></li>
                    <li>กดปุ่ม <strong className="text-white">Add domain</strong> แล้ววางโดเมนที่คัดลอกไว้</li>
                    <li>กด <strong className="text-white">Save</strong> แล้วกลับมากดเข้าสู่ระบบใหม่อีกครั้ง</li>
                  </ol>
                  <div className="pt-2">
                    <a
                      href="https://console.firebase.google.com/project/firekeeper-pca/authentication/settings"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-[#FF8A00] hover:underline font-semibold"
                    >
                      <span>เปิด Firebase Console Settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="text-[10px] text-[#9AA5B1]/80 leading-relaxed border-t border-white/5 pt-2">
                  💡 <strong>สำหรับผู้ใช้ Safari บน iPad:</strong> หากเปิดใช้งานผ่านหน้าต่างพรีวิว iFrame แนะนำให้กดปุ่ม "เปิดในแท็บใหม่" (Open in New Tab) ที่มุมขวาบน เพื่อไม่ให้ Safari บล็อกคุกกี้ข้ามเว็บไซต์ (Cross-Site Cookies) ครับ
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
