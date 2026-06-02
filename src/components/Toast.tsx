import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, Info } from "lucide-react";

type ToastType = "success" | "info" | "error";
interface ToastItem { id: number; msg: string; type: ToastType }

const ToastCtx = createContext<(msg: string, type?: ToastType) => void>(() => {});

export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const show = useCallback((msg: string, type: ToastType = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev.slice(-2), { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2400);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              t.type === "success" ? "bg-success" : t.type === "error" ? "bg-danger" : "bg-slate-700"
            }`}
          >
            {t.type === "success" ? <CheckCircle2 size={16} /> : <Info size={16} />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
