import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock send reset email
    setIsSubmitted(true);
    toast.success('重設密碼郵件已發送！');
  };

  return (
    <div className="min-h-screen bg-[var(--vesti-background)] flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
       {/* Background Decoration */}
       <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[var(--vesti-primary)]/5 blur-3xl" />
       <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[var(--vesti-secondary)]/10 blur-3xl" />

       {/* Back Button */}
       <motion.button
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         onClick={onBack}
         className="absolute top-8 left-6 flex items-center gap-2 text-[var(--vesti-dark)] hover:text-[var(--vesti-primary)] transition-colors z-10"
       >
         <ArrowLeft className="h-5 w-5" />
         <span>返回</span>
       </motion.button>

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
            {isSubmitted ? '請檢查您的電子郵件' : '重設您的密碼'}
         </p>
       </motion.div>

       {/* Card */}
       <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-md border border-[var(--vesti-gray-light)] shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-[32px] p-8 z-10"
       >
          {!isSubmitted ? (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-[var(--vesti-dark)] mb-2">忘記密碼？</h2>
                <p className="text-sm text-[var(--vesti-gray-mid)]">
                  請輸入您的電子郵件地址，我們將發送重設密碼的連結給您
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-[var(--vesti-primary)] text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all"
                >
                  發送重設連結
                </motion.button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--vesti-primary)]/10 flex items-center justify-center"
              >
                <Mail className="h-8 w-8 text-[var(--vesti-primary)]" />
              </motion.div>
              
              <h2 className="text-[var(--vesti-dark)] mb-3">郵件已發送</h2>
              <p className="text-sm text-[var(--vesti-gray-mid)] mb-6">
                我們已將重設密碼的連結發送到 <span className="font-medium text-[var(--vesti-dark)]">{email}</span>
              </p>
              <p className="text-xs text-[var(--vesti-gray-mid)] mb-6">
                沒有收到郵件？請檢查您的垃圾郵件資料夾，或稍後再試一次。
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onBack}
                className="w-full bg-[var(--vesti-primary)] text-white font-bold py-4 rounded-2xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all"
              >
                返回登入
              </motion.button>
            </div>
          )}
       </motion.div>

       {/* Resend Link */}
       {isSubmitted && (
         <div className="mt-6 text-center z-10">
            <button 
              onClick={() => {
                toast.success('重設密碼郵件已重新發送！');
              }}
              className="text-sm text-[var(--vesti-primary)] hover:underline"
            >
              重新發送郵件
            </button>
         </div>
       )}
    </div>
  );
}
