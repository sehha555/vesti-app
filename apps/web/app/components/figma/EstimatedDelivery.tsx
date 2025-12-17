import { motion } from 'motion/react';
import { ChevronRight, Truck } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

// Mock data for home page display
const mockDeliveryItems = [
  {
    id: 1,
    name: '經典白T恤',
    price: 890,
    imageUrl: 'https://images.unsplash.com/photo-1643881080033-e67069c5e4df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHRzaGlydCUyMGNsb3RoaW5nfGVufDF8fHx8MTc2MjU1NDc2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'BasicWear',
<<<<<<< HEAD
    merchant: 'BasicWear',
=======
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
    status: 'tomorrow'
  },
  {
    id: 2,
    name: '直筒牛仔褲',
    price: 1590,
    imageUrl: 'https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zJTIwZmFzaGlvbnxlbnwxfHx8fDE3NjI1NzE5ODN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    brand: 'Denim Co.',
<<<<<<< HEAD
    merchant: 'DenimCo',
=======
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
    status: 'later'
  }
];

<<<<<<< HEAD
interface EstimatedDeliveryProps {
  onNavigateToDelivery?: (merchant?: string) => void;
}

export function EstimatedDelivery({ onNavigateToDelivery }: EstimatedDeliveryProps) {
=======
export function EstimatedDelivery() {
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
  return (
    <section className="mx-5 mt-0 mb-6 p-6 bg-white rounded-3xl border-2 border-[var(--vesti-secondary)] shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[var(--vesti-dark)] flex items-center gap-2">
          <span className="w-1 h-5 bg-[var(--vesti-primary)] rounded-full"></span>
          <span>預計配送</span>
        </h3>
<<<<<<< HEAD
        <button 
          onClick={onNavigateToDelivery}
          className="flex items-center text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)] transition-colors"
          style={{ fontSize: 'var(--text-label)', fontWeight: 500 }}
        >
=======
        <button className="flex items-center text-xs font-medium text-[var(--vesti-gray-mid)] hover:text-[var(--vesti-dark)] transition-colors">
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
           查看全部
           <ChevronRight className="w-4 h-4 ml-0.5" />
        </button>
      </div>
      
      <div className="flex flex-col gap-4">
         {mockDeliveryItems.map((item, index) => {
            const isFast = item.status === 'tomorrow';
            const statusColor = isFast ? 'bg-orange-500' : 'bg-green-600';
            const statusText = isFast ? '明天送達' : '3天後送達';
            
            return (
               <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
<<<<<<< HEAD
                  onClick={() => onNavigateToDelivery?.(item.merchant)}
                  className="w-full bg-[#F8F8F7] p-3.5 pr-4 rounded-2xl border border-gray-200 flex gap-4 items-center group hover:bg-gray-100 transition-all shadow hover:shadow-md cursor-pointer"
=======
                  className="w-full bg-[#F8F8F7] p-3.5 pr-4 rounded-2xl border border-gray-200 flex gap-4 items-center group hover:bg-gray-100 transition-all shadow hover:shadow-md"
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
               >
                  <div className="w-16 h-16 rounded-xl bg-white overflow-hidden flex-shrink-0 relative shadow-sm">
                     <ImageWithFallback src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                     <div className="flex items-center justify-between mb-1">
                        <h4 className="text-[var(--vesti-dark)] font-bold text-sm truncate max-w-[120px]">{item.name}</h4>
                        <span className="text-[var(--vesti-dark)] font-bold text-sm">
                           ${item.price.toLocaleString()}
                        </span>
                     </div>
                     
                     <div className="flex items-center justify-between">
                        <p className="text-[var(--vesti-gray-mid)] text-xs truncate">{item.brand}</p>
                        <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${statusColor} shadow-sm`}>
                           {statusText}
                        </span>
                     </div>
                  </div>
               </motion.div>
            );
         })}
         
         {/* More Items Hint */}
         <div className="text-center mt-1">
            <span className="text-[10px] text-gray-400">還有 2 件商品準備中...</span>
         </div>
      </div>
    </section>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
