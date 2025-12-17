<<<<<<< HEAD
import { PieChart, Pie, Cell, Label } from 'recharts';
=======
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
import { motion } from 'motion/react';

export function WardrobeUtilization() {
  const data = [
    { name: 'Used', value: 30 },
    { name: 'Unused', value: 70 },
  ];
  
  // Primary color for used, Light gray for unused
  const COLORS = ['var(--vesti-primary)', 'var(--vesti-gray-light)'];

  return (
    <div className="px-5 mb-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)] border-2 border-[var(--vesti-secondary)]"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--vesti-dark)]">衣櫃利用率</h3>
          <span className="rounded-full bg-[var(--vesti-bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--vesti-gray-mid)]">
            本月
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="h-32 w-32 flex-shrink-0 relative">
<<<<<<< HEAD
            <PieChart width={128} height={128}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={55}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
                cornerRadius={4}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <Label
                  value="30%"
                  position="center"
                  className="text-lg font-bold fill-[var(--vesti-dark)]"
                  style={{ fontWeight: 800 }}
                />
              </Pie>
            </PieChart>
=======
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={55}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <Label
                    value="30%"
                    position="center"
                    className="text-lg font-bold fill-[var(--vesti-dark)]"
                    style={{ fontWeight: 800 }}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm text-[var(--vesti-gray-mid)] mb-1">表現不錯！</p>
              <p className="text-xs leading-relaxed text-[var(--vesti-gray-mid)]/80">
                你本月已經穿過了衣櫃中 <strong className="text-[var(--vesti-primary)]">30%</strong> 的衣服。試著搭配那些被冷落的單品吧！
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[var(--vesti-primary)]" />
                <span className="text-[10px] text-[var(--vesti-gray-mid)]">已穿過</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[var(--vesti-gray-light)]" />
                <span className="text-[10px] text-[var(--vesti-gray-mid)]">未穿過</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> de3ed00c33a5d0df6cf810802fd173e4ca4388a2
