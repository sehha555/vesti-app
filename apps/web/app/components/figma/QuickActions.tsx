<<<<<<< HEAD
import { Calendar, Shirt, Tag, Percent } from 'lucide-react';
import { motion } from 'motion/react';
import { haptic } from './hooks/useHaptic';
=======
import { PieChart, Shirt, Tag, Percent } from 'lucide-react';
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2

interface QuickActionsProps {
  onNavigateToTryOn?: () => void;
  onNavigateToTrending?: () => void;
  onNavigateToDiscount?: () => void;
<<<<<<< HEAD
  onNavigateToCalendar?: () => void;
}

export function QuickActions({ onNavigateToTryOn, onNavigateToTrending, onNavigateToDiscount, onNavigateToCalendar }: QuickActionsProps) {
  const actions = [
    { icon: <Calendar className="h-7 w-7" strokeWidth={1.5} />, label: "日曆", onClick: onNavigateToCalendar },
=======
}

export function QuickActions({ onNavigateToTryOn, onNavigateToTrending, onNavigateToDiscount }: QuickActionsProps) {
  const actions = [
    { icon: <PieChart className="h-7 w-7" strokeWidth={1.5} />, label: "分析", onClick: undefined },
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
    { icon: <Shirt className="h-7 w-7" strokeWidth={1.5} />, label: "試穿", onClick: onNavigateToTryOn },
    { icon: <Percent className="h-7 w-7" strokeWidth={1.5} />, label: "折扣", onClick: onNavigateToDiscount },
    { icon: <Tag className="h-7 w-7" strokeWidth={1.5} />, label: "熱銷", onClick: onNavigateToTrending },
  ];

  return (
    <div className="flex justify-between px-6 py-6">
      {actions.map((action, index) => (
<<<<<<< HEAD
        <motion.button
          key={index}
          onClick={() => {
            haptic('medium');
            action.onClick?.();
          }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.92 }}
          className="flex flex-col items-center gap-2.5"
        >
          <motion.div 
            className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px] bg-white text-[var(--vesti-primary)] shadow-[0_12px_24px_rgba(0,0,0,0.08)] border-[3px] border-[var(--vesti-secondary)] transition-all duration-300 hover:border-[var(--vesti-primary)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.12)]"
            whileHover={{ 
              borderColor: 'var(--vesti-primary)',
            }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {action.icon}
          </motion.div>
          <span className="text-xs font-bold text-[var(--vesti-dark)] tracking-wide">
            {action.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
=======
        <button
          key={index}
          onClick={action.onClick}
          className="group flex flex-col items-center gap-2.5"
        >
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-[24px] bg-white text-[var(--vesti-primary)] shadow-[0_12px_24px_rgba(0,0,0,0.08)] border-[3px] border-[var(--vesti-secondary)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[var(--vesti-primary)] group-hover:shadow-[0_16px_32px_rgba(0,0,0,0.12)] active:scale-95">
            {action.icon}
          </div>
          <span className="text-xs font-bold text-[var(--vesti-dark)] tracking-wide">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
