import { motion } from 'motion/react';

interface CardSkeletonProps {
  count?: number;
  aspectRatio?: '1:1' | '4:5' | '2:3';
}

export function CardSkeleton({ count = 4, aspectRatio = '4:5' }: CardSkeletonProps) {
  const aspectClass = {
    '1:1': 'aspect-square',
    '4:5': 'aspect-[4/5]',
    '2:3': 'aspect-[2/3]',
  }[aspectRatio];

  return (
    <div className="grid grid-cols-2 gap-3 px-5">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="overflow-hidden rounded-[16px] bg-card border-2 border-[var(--vesti-gray-mid)]/20 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        >
          {/* Image Skeleton */}
          <div className={`${aspectClass} w-full bg-[var(--vesti-gray-light)] relative overflow-hidden`}>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: 'linear',
              }}
            />
          </div>

          {/* Content Skeleton */}
          <div className="p-3 space-y-2">
            {/* Brand */}
            <div className="h-3 w-16 bg-[var(--vesti-gray-light)] rounded-full relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'linear',
                  delay: 0.1,
                }}
              />
            </div>

            {/* Title */}
            <div className="h-4 w-full bg-[var(--vesti-gray-light)] rounded-full relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'linear',
                  delay: 0.2,
                }}
              />
            </div>

            {/* Price */}
            <div className="h-5 w-20 bg-[var(--vesti-gray-light)] rounded-full relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'linear',
                  delay: 0.3,
                }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// List Skeleton (for outfit packs)
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 px-5">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="overflow-hidden rounded-[16px] bg-card border-2 border-[var(--vesti-gray-mid)]/20 shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4"
        >
          <div className="flex gap-4">
            {/* Image Skeleton */}
            <div className="w-24 h-24 rounded-xl bg-[var(--vesti-gray-light)] relative overflow-hidden flex-shrink-0">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'linear',
                }}
              />
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-[var(--vesti-gray-light)] rounded-full relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear',
                    delay: 0.1,
                  }}
                />
              </div>
              <div className="h-3 w-1/2 bg-[var(--vesti-gray-light)] rounded-full relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear',
                    delay: 0.2,
                  }}
                />
              </div>
              <div className="h-5 w-1/3 bg-[var(--vesti-gray-light)] rounded-full relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: 'linear',
                    delay: 0.3,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
