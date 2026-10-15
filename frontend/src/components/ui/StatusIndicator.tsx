import React from 'react';
import clsx from 'clsx';
import { ConnectionStatus } from '../../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  showText?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  showText = true,
  className,
}) => {
  const configs: Record<ConnectionStatus, { color: string; ping: boolean; label: string }> = {
    CONNECTED: { color: 'bg-emerald-500', ping: true, label: 'Connected' },
    SYNCING: { color: 'bg-blue-500', ping: true, label: 'Syncing' },
    PENDING: { color: 'bg-amber-500', ping: false, label: 'Pending' },
    ERROR: { color: 'bg-rose-500', ping: false, label: 'Error' },
    DISCONNECTED: { color: 'bg-slate-500', ping: false, label: 'Disconnected' },
    NOT_CONNECTED: { color: 'bg-slate-600', ping: false, label: 'Not Connected' },
  };

  const config = configs[status] || configs.NOT_CONNECTED;

  return (
    <div className={clsx('inline-flex items-center gap-2', className)}>
      <span className="relative flex h-2.5 w-2.5">
        {config.ping && (
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              config.color
            )}
          />
        )}
        <span className={clsx('relative inline-flex rounded-full h-2.5 w-2.5', config.color)} />
      </span>
      {showText && <span className="text-xs sm:text-sm font-medium text-slate-300">{config.label}</span>}
    </div>
  );
};
