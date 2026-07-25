"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";

interface Toast {
  id: number;
  message: string;
  bad?: boolean;
}

const ToastContext = createContext<(message: string, bad?: boolean) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, bad?: boolean) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, bad }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 22,
          insetInlineEnd: 22,
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-pop"
            style={{
              background: t.bad ? "var(--color-clay)" : "var(--color-ink)",
              color: "#fff",
              borderRadius: "var(--radius-pill)",
              padding: "11px 18px",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "var(--shadow-e3)",
              display: "flex",
              alignItems: "center",
              gap: 9,
              maxWidth: "min(420px, 90vw)",
            }}
          >
            <Icon
              name={t.bad ? "x" : "check"}
              size={15}
              strokeWidth={2.2}
              style={{ color: t.bad ? "#fff" : "#6EE7B7", flex: "none" }}
            />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
