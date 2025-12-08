import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextValue {
    addToast: (type: ToastType, message: string, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const colors = {
    success: 'bg-white border-green-200 text-green-800',
    error: 'bg-white border-red-200 text-red-800',
    info: 'bg-white border-blue-200 text-blue-800',
    warning: 'bg-white border-yellow-200 text-yellow-800',
};

const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-yellow-500',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, message, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const success = useCallback((msg: string, dur?: number) => addToast('success', msg, dur), [addToast]);
    const error = useCallback((msg: string, dur?: number) => addToast('error', msg, dur), [addToast]);
    const info = useCallback((msg: string, dur?: number) => addToast('info', msg, dur), [addToast]);
    const warning = useCallback((msg: string, dur?: number) => addToast('warning', msg, dur), [addToast]);

    // 监听全局 API 错误
    React.useEffect(() => {
        // 动态导入避免循环依赖（虽然 api -> events, Toast -> events 没有循环，但为了保险）
        // 其实这里 Toast 依赖 events, api 依赖 events, events 是独立的，没问题。
        // 直接 import 可能更好。但在 replace_file_content 里不好加顶层 import。
        // 使用动态 import 或者 假设顶层 import。
        // 为了方便，这里用 dynamic import 或者在组件内 import。
        // 既然 events 是新文件，我可以在文件头部加 import? replace_file 只能替换块。
        // 我用 dynamic import safe way.
        let unsubscribe: () => void;
        import('../../lib/events').then(({ globalEvents }) => {
            unsubscribe = globalEvents.on('api_error', (msg: any) => {
                addToast('error', typeof msg === 'string' ? msg : '未知错误');
            });
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, success, error, info, warning }}>
            {children}
            {createPortal(
                <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                    <AnimatePresence>
                        {toasts.map((toast) => {
                            const Icon = icons[toast.type];
                            return (
                                <motion.div
                                    key={toast.id}
                                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                    layout
                                    className={clsx(
                                        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg shadow-slate-200/50 min-w-[300px] max-w-sm backdrop-blur-sm',
                                        colors[toast.type]
                                    )}
                                >
                                    <Icon className={clsx('w-5 h-5 flex-shrink-0', iconColors[toast.type])} />
                                    <p className="text-sm font-medium flex-1">{toast.message}</p>
                                    <button
                                        onClick={() => removeToast(toast.id)}
                                        className="p-1 rounded-full hover:bg-black/5 transition -mr-1"
                                    >
                                        <X className="w-4 h-4 opacity-50" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}
