import { Home, Archive, Compass, Store, User, Bookmark } from 'lucide-react';

type PageType = 'home' | 'wardrobe' | 'collection' | 'explore' | 'store' | 'profile' | 'tryon' | 'checkout' | 'discount' | 'trending' | 'upload' | 'login';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

function NavItem({ icon, label, isActive, onClick }: NavItemProps) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-all"
    >
      <div className={isActive ? 'text-[var(--vesti-primary)]' : 'text-[var(--vesti-gray-mid)]'}>
        {icon}
      </div>
      <span className={`text-[11px] ${isActive ? 'text-[var(--vesti-primary)]' : 'text-[var(--vesti-gray-mid)]'}`} style={{ fontWeight: isActive ? 600 : 400 }}>
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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-around">
        <NavItem 
          icon={<Home className="h-5 w-5" strokeWidth={2} />} 
          label="Home" 
          isActive={currentPage === 'home'}
          onClick={() => onPageChange('home')}
        />
        <NavItem 
          icon={<Archive className="h-5 w-5" strokeWidth={2} />} 
          label="Wardrobe" 
          isActive={currentPage === 'wardrobe'}
          onClick={() => onPageChange('wardrobe')}
        />
        <NavItem 
          icon={<Compass className="h-5 w-5" strokeWidth={2} />} 
          label="Explore" 
          isActive={currentPage === 'explore'}
          onClick={() => onPageChange('explore')}
        />
        <NavItem 
          icon={<Store className="h-5 w-5" strokeWidth={2} />} 
          label="Store" 
          isActive={currentPage === 'store'}
          onClick={() => onPageChange('store')}
        />
        <NavItem 
          icon={<User className="h-5 w-5" strokeWidth={2} />} 
          label="Profile" 
          isActive={currentPage === 'profile'}
          onClick={() => onPageChange('profile')}
        />
      </div>
    </div>
  );
}
