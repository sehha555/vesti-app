import { Home, Archive, Compass, Store, User } from 'lucide-react';
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
    <button
      onClick={handleClick}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors active:scale-95"
    >
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-primary" />
      )}

      <div className={`transition-transform ${isActive ? 'text-primary scale-110' : 'text-muted-foreground'}`}>
        {icon}
      </div>

      <span className={`text-xs transition-colors ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground opacity-70'}`}>
        {label}
      </span>
    </button>
  );
}

interface BottomNavProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm">
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