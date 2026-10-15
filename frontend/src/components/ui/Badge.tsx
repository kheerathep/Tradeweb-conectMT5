import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'profit' | 'loss' | 'neutral' | 'brand' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
}) => {
  const variantStyles = {
    profit: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    loss: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
    brand: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium rounded',
    md: 'text-xs sm:text-sm px-2.5 py-1 font-semibold rounded-md',
  };

  return (
    <span className={clsx('inline-flex items-center gap-1 leading-none tracking-wide', variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </span>
  );
};
