import { ReactNode, Key } from 'react';
import { motion } from 'motion/react';

interface CardProps {
  key?: Key;
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
  delay?: number;
}

export function Card({ children, className = '', title, action, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className={`bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/50 bg-neutral-900/50">
          {title && <h3 className="text-sm font-medium text-neutral-300">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1 overflow-hidden">{children}</div>
    </motion.div>
  );
}
