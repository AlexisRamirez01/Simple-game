import React, { useState, useEffect } from 'react';

const NOTIFICATION_DURATION = 5000;

const Notification = ({
  title,
  duration = NOTIFICATION_DURATION,
  onClose,
  children,
  type = 'default',
  options = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer;
    if (children) {
      setIsVisible(true);
      timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, duration);
    }
    return () => clearTimeout(timer);
  }, [children, duration, onClose]);

  if (!children || !isVisible) return null;

  const baseTransition = options.noAnimation ? '' : 'transition-all duration-300';

  const baseClasses =
    `relative rounded-2xl p-6 flex flex-col items-center w-11/12 max-w-3xl shadow-2xl ${baseTransition} border`;

  const typeStyles = {
    default: 'bg-white/10 border-white/20 text-white backdrop-blur-md',
    error: `
      bg-gradient-to-br from-red-900/70 via-red-700/60 to-red-800/70
      border border-red-400/40 
      text-red-50 
      backdrop-blur-md 
      shadow-[0_0_25px_-5px_rgba(255,60,60,0.4)]
    `,
    success: `
      bg-gradient-to-br from-emerald-900/70 via-emerald-700/60 to-emerald-800/70
      border border-emerald-400/40 
      text-emerald-50 
      backdrop-blur-md
      shadow-[0_0_25px_-5px_rgba(60,255,150,0.4)]
    `,
    info: `
      bg-gradient-to-br from-sky-900/70 via-sky-700/60 to-sky-800/70
      border border-sky-400/40 
      text-sky-50 
      backdrop-blur-md
      shadow-[0_0_25px_-5px_rgba(80,180,255,0.4)]
    `,
  };

  const containerPosition =
    type === 'error' || type === 'info'
      ? 'fixed top-8 inset-x-0 z-[120] flex items-start justify-center'
      : 'fixed inset-0 z-[120] flex items-center justify-center';

  return (
    <div
      className={containerPosition}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Notificación'}
    >
      {type !== 'error' && <div className="absolute inset-0 bg-black/50" />}
      <div className={`${baseClasses} ${typeStyles[type]}`}>
        {title && (
          <h3 className="text-2xl font-semibold mb-3 text-center tracking-wide">
            {title}
          </h3>
        )}
        <div
          className={`flex flex-row gap-4 ${options.disableOverflow ? 'overflow-visible' : 'overflow-x-auto'} text-center text-base`}
        >
          <div className={options.disableHover ? 'pointer-events-none' : ''}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
