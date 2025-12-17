import { Home, Archive, Compass, Store, User, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from './hooks/useHaptic';

type PageType = 'home' | 'wardrobe' | 'explore' | 'store' | 'profile';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, isActive, onClick }: NavItemProps) {
  const handleClick = () => {
    haptic(isActive ? 'light' : 'medium');
    onClick();
  };

  return (
    <motion.button 
      onClick={handleClick}
      whileTap={{ scale: 0.85 }}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-all"
    >
      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      
      <motion.div 
        className={isActive ? 'text-primary' : 'text-muted-foreground'}
        animate={{ scale: isActive ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {icon}
      </motion.div>
      
      <motion.span 
        className={isActive ? 'text-primary' : 'text-muted-foreground'} 
        style={{ fontSize: 'var(--text-label)', fontWeight: isActive ? 600 : 400 }}
        animate={{ opacity: isActive ? 1 : 0.7 }}
      >
        {label}
      </motion.span>
    </motion.button>
  );
}

interface BottomNavProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-around">
        <NavItem 
          icon={<Home className="h-5 w-5" strokeWidth={2} />} 
          label="首頁" 
          isActive={currentPage === 'home'}
          onClick={() => onPageChange('home')}
        />
        <NavItem 
          icon={<Archive className="h-5 w-5" strokeWidth={2} />} 
          label="衣櫃" 
          isActive={currentPage === 'wardrobe'}
          onClick={() => onPageChange('wardrobe')}
        />
        <NavItem 
          icon={<Compass className="h-5 w-5" strokeWidth={2} />} 
          label="探索" 
          isActive={currentPage === 'explore'}
          onClick={() => onPageChange('explore')}
        />
        <NavItem 
          icon={<Store className="h-5 w-5" strokeWidth={2} />} 
          label="商店" 
          isActive={currentPage === 'store'}
          onClick={() => onPageChange('store')}
        />
        <NavItem 
          icon={<User className="h-5 w-5" strokeWidth={2} />} 
          label="個人" 
          isActive={currentPage === 'profile'}
          onClick={() => onPageChange('profile')}
        />
      </div>
    </div>
  );
}