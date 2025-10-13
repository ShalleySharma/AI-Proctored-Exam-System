import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, ...opts }]);
    // auto remove after timeout (default 4s)
    const timeout = opts.duration || 4000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, timeout);
  }, []);

  const remove = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ add, remove }}>
      {children}
      <div style={{
        position: 'fixed',
        right: 16,
        top: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 320,
      }}>
        {toasts.map(t =>
          <div key={t.id} style={{
            background: '#111827',
            color: 'white',
            padding: '10px 12px',
            borderRadius: 8,
            boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
            fontSize: 14
          }}>
            {t.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
