import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: () => void;
  onBack?: () => void;
}

export function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
                          onChange={e => setName(e.target.value)}
                          className="w-full bg-transparent border border-[var(--vesti-gray-light)] focus:border-[var(--vesti-primary)] rounded-2xl px-4 py-3 text-[var(--vesti-dark)] outline-none transition-all placeholder:text-[var(--vesti-gray-mid)]/50"
                          placeholder="您的暱稱"
                        />
                    </div>
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
                 {isLogin && (
                    <div className="flex justify-end">
                        <button type="button" className="text-xs text-[var(--vesti-primary)] hover:underline">
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
                <span className="font-bold text-[var(--vesti-dark)]">Google</span>
             </button>
             <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--vesti-gray-light)] hover:bg-[var(--vesti-gray-light)]/50 transition-colors">
                <span className="font-bold text-[var(--vesti-dark)]">Apple</span>
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
