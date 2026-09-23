import { motion } from 'motion/react';

type Status = 'success' | 'error' | 'warning' | 'info' | 'inactive';

const colorMap = {
  success: 'bg-green-500 glow-green',
  error: 'bg-red-500 glow-red',
  warning: 'bg-yellow-500 glow-yellow',
  info: 'bg-blue-500 glow-blue',
  inactive: 'bg-neutral-600',
};

export function StatusDot({ status = 'inactive', pulse = false }: { status?: Status; pulse?: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-2.5 h-2.5">
      {pulse && status !== 'inactive' && (
        <motion.div
          className={`absolute inset-0 rounded-full opacity-50 ${colorMap[status].split(' ')[0]}`}
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className={`w-2.5 h-2.5 rounded-full ${colorMap[status]}`} />
    </div>
  );
}
