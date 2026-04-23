import { useCallback, useEffect, useRef, useState } from "react";
import { setAppNotifyImplementation } from "./appNotify";

const TOAST_TTL_MS = 4500;

const variantStyles = {
  success: { border: "#22c55e", bg: "#f0fdf4", icon: "✓", title: "Success" },
  error: { border: "#ef4444", bg: "#fef2f2", icon: "!", title: "Error" },
  warning: { border: "#f59e0b", bg: "#fffbeb", icon: "⚠", title: "Warning" },
  info: { border: "#3b82f6", bg: "#eff6ff", icon: "i", title: "Notice" },
};

function ToastItem({ id, message, variant, onDismiss }) {
  const s = variantStyles[variant] || variantStyles.info;
  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        minWidth: 280,
        maxWidth: 420,
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${s.border}`,
        background: s.bg,
        boxShadow: "0 10px 40px rgba(15,23,42,0.12)",
        animation: "uf-toast-in 0.25s ease",
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 8,
          background: s.border,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {s.icon}
      </span>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "#0f172a", flex: 1 }}>{message}</p>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        style={{
          flexShrink: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: 4,
          color: "#64748b",
          fontSize: 18,
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export function UIFeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const toastTimers = useRef(new Map());
  const idRef = useRef(0);

  const dismissToast = useCallback((id) => {
    const t = toastTimers.current.get(id);
    if (t) clearTimeout(t);
    toastTimers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((message, variant = "info") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
    const timer = setTimeout(() => dismissToast(id), TOAST_TTL_MS);
    toastTimers.current.set(id, timer);
  }, [dismissToast]);

  const alertFn = useCallback((message, options = {}) => {
    const { title, variant = "info" } = options;
    return new Promise((resolve) => {
      setDialog({
        type: "alert",
        message,
        title: title || variantStyles[variant]?.title || "Notice",
        variant,
        resolve,
      });
    });
  }, []);

  const confirmFn = useCallback((message, options = {}) => {
    const {
      title = "Please confirm",
      confirmLabel = "OK",
      cancelLabel = "Cancel",
      variant = "warning",
    } = options;
    return new Promise((resolve) => {
      setDialog({
        type: "confirm",
        message,
        title,
        variant,
        confirmLabel,
        cancelLabel,
        resolve,
      });
    });
  }, []);

  useEffect(() => {
    setAppNotifyImplementation({ toast, alert: alertFn, confirm: confirmFn });
    return () => setAppNotifyImplementation(null);
  }, [toast, alertFn, confirmFn]);

  const closeDialog = (result) => {
    const r = dialog?.resolve;
    setDialog(null);
    r?.(result);
  };

  const dStyle = dialog ? variantStyles[dialog.variant] || variantStyles.info : null;

  return (
    <>
      <style>{`
        @keyframes uf-toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes uf-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {children}

      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 100000,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem id={t.id} message={t.message} variant={t.variant} onDismiss={dismissToast} />
          </div>
        ))}
      </div>

      {dialog && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100001,
            background: "rgba(15,23,42,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            animation: "uf-fade-in 0.2s ease",
          }}
          onClick={(e) => e.target === e.currentTarget && dialog.type === "alert" && closeDialog()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="uf-dialog-title"
            style={{
              width: "100%",
              maxWidth: 440,
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
              overflow: "hidden",
              border: `1px solid ${dStyle.border}33`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "18px 22px 12px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: dStyle.bg,
                  border: `2px solid ${dStyle.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color: dStyle.border,
                  fontSize: 16,
                }}
              >
                {dStyle.icon}
              </span>
              <h2 id="uf-dialog-title" style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                {dialog.title}
              </h2>
            </div>
            <p
              style={{
                margin: 0,
                padding: "20px 22px",
                fontSize: 14,
                lineHeight: 1.55,
                color: "#334155",
                whiteSpace: "pre-line",
              }}
            >
              {dialog.message}
            </p>
            <div
              style={{
                padding: "14px 22px 20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                background: "#fafbfc",
              }}
            >
              {dialog.type === "confirm" && (
                <button
                  type="button"
                  onClick={() => closeDialog(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  {dialog.cancelLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => closeDialog(dialog.type === "confirm" ? true : undefined)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: dialog.type === "confirm" ? dStyle.border : "#0f2f66",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {dialog.type === "confirm" ? dialog.confirmLabel : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
