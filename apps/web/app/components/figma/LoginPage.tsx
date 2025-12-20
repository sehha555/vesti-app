import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ForgotPasswordPage } from './ForgotPasswordPage';

interface LoginPageProps {
  onLogin: () => void;
  onBack?: () => void;
}

// Google Logo SVG Component
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
  </svg>
);

// Apple Logo SVG Component
const AppleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 814 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" fill="black"/>
  </svg>
);

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Mock 已存在的用戶名（實際應該從後端 API 檢查）
  const existingUsernames = ['test', 'admin', 'user', 'vesti'];

  // 密碼驗證規則
  const passwordValidation = {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const isPasswordValid = !isLogin && password ? 
    Object.values(passwordValidation).every(v => v) : true;

  // 檢查用戶名是否已被使用
  const checkUsername = (username: string) => {
    if (!username) {
      setUsernameError('');
      return;
    }

    setIsCheckingUsername(true);
    // 模擬 API 延遲
    setTimeout(() => {
      if (existingUsernames.includes(username.toLowerCase())) {
        setUsernameError('此用戶名已被使用');
      } else {
        setUsernameError('');
      }
      setIsCheckingUsername(false);
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin) {
      // 註冊驗證
      if (usernameError) {
        toast.error('請選擇其他用戶名');
        return;
      }
      if (!isPasswordValid) {
        toast.error('請確保密碼符合所有要求');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('密碼與確認密碼不符');
        return;
      }
    }

    if (isLogin) {
        // Mock login
        toast.success('登入成功！');
        onLogin();
    } else {
        // Mock signup
        toast.success('註冊成功！歡迎加入 VESTI');
        onLogin();
    }
  };

  // Show forgot password page
  if (showForgotPassword) {
    return <ForgotPasswordPage onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--vesti-background)] flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[var(--vesti-primary)]/5 blur-3xl" />
       <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[var(--vesti-secondary)]/10 blur-3xl" />

       {/* Header/Logo */}
       <motion.div 
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         className="mb-8 text-center z-10"
       >
         <h1 className="text-4xl font-black italic tracking-tighter text-[var(--vesti-primary)] mb-2">
           VESTI
         </h1>
         <p className="text-[var(--vesti-gray-mid)]">
            {isLogin ? '歡迎回來，請登入您的帳號' : '加入我們，開啟您的時尚旅程'}
         </p>
       </motion.div>

       {/* Card */}
       <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-md border border-[var(--vesti-gray-light)] shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[32px] p-8 z-10"
       >
          <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--vesti-dark)] ml-1">姓名</label>
                    <div className="relative">
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            checkUsername(e.target.value);
                          }}
                          onBlur={() => checkUsername(name)}
                          className={`w-full bg-transparent border rounded-2xl px-4 py-3 text-[var(--vesti-dark)] outline-none transition-all placeholder:text-[var(--vesti-gray-mid)]/50 ${
                            usernameError 
                              ? 'border-red-400 focus:border-red-500' 
                              : name && !isCheckingUsername 
                                ? 'border-green-400 focus:border-green-500' 
                                : 'border-[var(--vesti-gray-light)] focus:border-[var(--vesti-primary)]'
                          }`}
                          placeholder="您的暱稱"
                        />
                        {isCheckingUsername && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 border-2 border-[var(--vesti-primary)] border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {!isCheckingUsername && name && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            {usernameError ? (
                              <X className="w-5 h-5 text-red-500" />
                            ) : (
                              <Check className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        )}
                    </div>
                    <AnimatePresence>
                      {usernameError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-center gap-1.5 text-red-500 ml-1"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span style={{ fontSize: 'var(--text-label)' }}>{usernameError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              )}

              <div className="space-y-2">
                 <label className="text-sm font-medium text-[var(--vesti-dark)] ml-1">電子郵件</label>
                 <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--vesti-gray-mid)] h-5 w-5" />
                    <input 
                       type="email" 
                       value={email}
                       onChange={e => setEmail(e.target.value)}
                       className="w-full bg-transparent border border-[var(--vesti-gray-light)] focus:border-[var(--vesti-primary)] rounded-2xl pl-12 pr-4 py-3 text-[var(--vesti-dark)] outline-none transition-all placeholder:text-[var(--vesti-gray-mid)]/50"
                       placeholder="name@example.com"
                       required
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-medium text-[var(--vesti-dark)] ml-1">密碼</label>
                 <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--vesti-gray-mid)] h-5 w-5" />
                    <input 
                       type={showPassword ? "text" : "password"} 
                       value={password}
                       onChange={e => setPassword(e.target.value)}
                       className="w-full bg-transparent border border-[var(--vesti-gray-light)] focus:border-[var(--vesti-primary)] rounded-2xl pl-12 pr-12 py-3 text-[var(--vesti-dark)] outline-none transition-all placeholder:text-[var(--vesti-gray-mid)]/50"
                       placeholder="輸入密碼"
                       required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                 </div>
                 
                 {/* 密碼規則提示（註冊模式） */}
                 <AnimatePresence>
                   {!isLogin && password && (
                     <motion.div
                       initial={{ opacity: 0, height: 0 }}
                       animate={{ opacity: 1, height: 'auto' }}
                       exit={{ opacity: 0, height: 0 }}
                       className="space-y-2 bg-[var(--vesti-light-bg)] rounded-xl p-3 mt-2"
                     >
                       <p className="text-[var(--vesti-gray-mid)] mb-2" style={{ fontSize: 'var(--text-label)' }}>
                         密碼必須包含：
                       </p>
                       <div className="space-y-1.5">
                         <div className="flex items-center gap-2">
                           {passwordValidation.hasMinLength ? (
                             <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                           ) : (
                             <X className="w-4 h-4 text-[var(--vesti-gray-mid)] flex-shrink-0" />
                           )}
                           <span 
                             className={passwordValidation.hasMinLength ? 'text-green-600' : 'text-[var(--vesti-gray-mid)]'}
                             style={{ fontSize: 'var(--text-label)' }}
                           >
                             至少 8 個字元
                           </span>
                         </div>
                         <div className="flex items-center gap-2">
                           {passwordValidation.hasUpperCase ? (
                             <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                           ) : (
                             <X className="w-4 h-4 text-[var(--vesti-gray-mid)] flex-shrink-0" />
                           )}
                           <span 
                             className={passwordValidation.hasUpperCase ? 'text-green-600' : 'text-[var(--vesti-gray-mid)]'}
                             style={{ fontSize: 'var(--text-label)' }}
                           >
                             包含大寫字母 (A-Z)
                           </span>
                         </div>
                         <div className="flex items-center gap-2">
                           {passwordValidation.hasLowerCase ? (
                             <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                           ) : (
                             <X className="w-4 h-4 text-[var(--vesti-gray-mid)] flex-shrink-0" />
                           )}
                           <span 
                             className={passwordValidation.hasLowerCase ? 'text-green-600' : 'text-[var(--vesti-gray-mid)]'}
                             style={{ fontSize: 'var(--text-label)' }}
                           >
                             包含小寫字母 (a-z)
                           </span>
                         </div>
                         <div className="flex items-center gap-2">
                           {passwordValidation.hasNumber ? (
                             <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                           ) : (
                             <X className="w-4 h-4 text-[var(--vesti-gray-mid)] flex-shrink-0" />
                           )}
                           <span 
                             className={passwordValidation.hasNumber ? 'text-green-600' : 'text-[var(--vesti-gray-mid)]'}
                             style={{ fontSize: 'var(--text-label)' }}
                           >
                             包含數字 (0-9)
                           </span>
                         </div>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 {isLogin && (
                    <div className="flex justify-end">
                        <button type="button" className="text-xs text-[var(--vesti-primary)] hover:underline" onClick={() => setShowForgotPassword(true)}>
                           忘記密碼？
                        </button>
                    </div>
                 )}
              </div>

              {!isLogin && (
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--vesti-dark)] ml-1">確認密碼</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--vesti-gray-mid)] h-5 w-5" />
                        <input 
                           type={showConfirmPassword ? "text" : "password"} 
                           value={confirmPassword}
                           onChange={e => setConfirmPassword(e.target.value)}
                           className="w-full bg-transparent border border-[var(--vesti-gray-light)] focus:border-[var(--vesti-primary)] rounded-2xl pl-12 pr-12 py-3 text-[var(--vesti-dark)] outline-none transition-all placeholder:text-[var(--vesti-gray-mid)]/50"
                           placeholder="再次輸入密碼"
                           required
                        />
                        <button 
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)] transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                 </div>
              )}

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-[var(--vesti-primary)] text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all"
              >
                {isLogin ? '登入' : '註冊帳號'}
              </motion.button>
          </form>

          <div className="my-6 flex items-center gap-3">
             <div className="h-px flex-1 bg-[var(--vesti-gray-light)]" />
             <span className="text-xs text-[var(--vesti-gray-mid)]">或是使用</span>
             <div className="h-px flex-1 bg-[var(--vesti-gray-light)]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--vesti-gray-light)] hover:bg-[var(--vesti-gray-light)]/50 transition-colors">
                <GoogleLogo />
                <span className="text-[var(--vesti-dark)]">Google</span>
             </button>
             <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--vesti-gray-light)] hover:bg-[var(--vesti-gray-light)]/50 transition-colors">
                <AppleLogo />
                <span className="text-[var(--vesti-dark)]">Apple</span>
             </button>
          </div>
       </motion.div>

       {/* Toggle Mode */}
       <div className="mt-8 text-center z-10">
          <p className="text-[var(--vesti-gray-mid)]">
             {isLogin ? '還沒有帳號？' : '已經有帳號了？'}
             <button 
               onClick={() => setIsLogin(!isLogin)}
               className="ml-2 text-[var(--vesti-primary)] font-bold hover:underline"
             >
                {isLogin ? '立即註冊' : '登入'}
             </button>
          </p>
       </div>


    </div>
  );
}