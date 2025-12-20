import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center px-8 py-16 text-center"
    >
      {/* Icon with Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className="mb-6 rounded-full bg-[var(--vesti-gray-light)] p-6"
      >
        <Icon 
          className="h-12 w-12 text-[var(--vesti-gray-mid)]" 
          strokeWidth={1.5}
        />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-2 text-[var(--vesti-dark)]"
        style={{ fontWeight: 600 }}
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mb-6 max-w-sm text-[var(--vesti-gray-mid)]"
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3 w-full max-w-xs"
        >
          {actionLabel && onAction && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onAction}
              className="w-full rounded-full bg-[var(--vesti-primary)] px-6 py-3 text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
              style={{ fontWeight: 600 }}
            >
              {actionLabel}
            </motion.button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onSecondaryAction}
              className="w-full rounded-full border-2 border-[var(--vesti-gray-mid)]/30 bg-white px-6 py-3 text-[var(--vesti-dark)] transition-all hover:border-[var(--vesti-primary)]/50 hover:bg-[var(--vesti-gray-light)]/50 active:scale-95"
              style={{ fontWeight: 500 }}
            >
              {secondaryActionLabel}
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Compact Empty State (for smaller sections)
interface CompactEmptyStateProps {
  icon: LucideIcon;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function CompactEmptyState({
  icon: Icon,
  message,
  actionLabel,
  onAction,
}: CompactEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      <Icon className="h-8 w-8 text-[var(--vesti-gray-mid)] mb-3" strokeWidth={1.5} />
      <p className="text-[var(--vesti-gray-mid)] mb-3 px-4" style={{ fontSize: 'var(--text-label)' }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="text-[var(--vesti-primary)] transition-all hover:underline"
          style={{ fontSize: 'var(--text-label)', fontWeight: 600 }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
