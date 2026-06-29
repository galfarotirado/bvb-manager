'use client';
import { useState, useCallback, createContext, useContext } from 'react';

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);
  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-xl font-bold text-sm shadow-2xl animate-slide-up pointer-events-auto flex items-center gap-2 max-w-xs ${
            t.type==='success'?'bg-green-500 text-white':t.type==='error'?'bg-red-500 text-white':'bg-bvb-yellow text-black'
          }`}>
            <span>{t.type==='success'?'✓':t.type==='error'?'✕':'ℹ'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
