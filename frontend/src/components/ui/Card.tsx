import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl border border-surface-border bg-surface-card/80 p-4 sm:p-5 transition-all shadow-sm',
        hoverable && 'hover:border-slate-700 hover:shadow-md cursor-pointer hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
};
