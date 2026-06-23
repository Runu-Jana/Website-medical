import { createContext, useContext, useState, useCallback } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

const ToastContext = createContext(null);

let idCounter = 0;

const styles = {
  success: { bg: 'bg-accent', icon: FiCheckCircle },
  error: { bg: 'bg-danger', icon: FiAlertCircle },
  info: { bg: 'bg-primary', icon: FiInfo },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info') => {
      const id = ++idCounter;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[90vw]">
        {toasts.map((t) => {
          const s = styles[t.type] || styles.info;
          const Icon = s.icon;
          return (
            <div
              key={t.id}
              className={`${s.bg} text-white rounded-lg shadow-lg px-4 py-3 flex items-start gap-3 animate-[fadeIn_.2s_ease]`}
            >
              <Icon className="mt-0.5 shrink-0" size={18} />
              <p className="text-sm flex-1 leading-snug">{t.message}</p>
              <button onClick={() => remove(t.id)} className="opacity-80 hover:opacity-100">
                <FiX size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
