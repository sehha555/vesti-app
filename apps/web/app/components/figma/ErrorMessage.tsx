import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, WifiOff, AlertTriangle, X } from 'lucide-react';

interface ErrorMessageProps {
  type?: 'error' | 'network' | 'warning';
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  isVisible?: boolean;
}

export function ErrorMessage({
  type = 'error',
  message,
  onDismiss,
  onRetry,
  isVisible = true,
}: ErrorMessageProps) {
  const config = {
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
    },
    network: {
      icon: WifiOff,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      borderColor: 'border-orange-200',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
    },
  }[type];

  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`mx-5 mb-4 rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-4`}
        >
          <div className="flex items-start gap-3">
            <Icon className={`h-5 w-5 ${config.textColor} flex-shrink-0 mt-0.5`} strokeWidth={2} />
            
            <div className="flex-1">
              <p className={config.textColor} style={{ fontSize: 'var(--text-label)' }}>
                {message}
              </p>
              
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`mt-2 ${config.textColor} underline transition-opacity hover:opacity-70`}
                  style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}
                >
                  重試
                </button>
              )}
            </div>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`${config.textColor} transition-opacity hover:opacity-70`}
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Inline Error (for form fields)
interface InlineErrorProps {
  message: string;
  isVisible?: boolean;
}

export function InlineError({ message, isVisible = true }: InlineErrorProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2 mt-2"
        >
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" strokeWidth={2} />
          <p className="text-red-500" style={{ fontSize: 'var(--text-label)' }}>
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
