import Modal from './Modal';
import { AlertTriangle, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info';
    isLoading?: boolean;
}

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = '确定',
    cancelText = '取消',
    type = 'info',
    isLoading = false,
}: ConfirmDialogProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            width="sm"
            closeOnmaskClick={!isLoading}
        >
            <div className="text-center pt-2 pb-6">
                <div className={clsx(
                    "w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center",
                    type === 'danger' ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                )}>
                    {type === 'danger' ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                {description && <p className="text-sm text-slate-500 px-4">{description}</p>}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition disabled:opacity-50 font-medium"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className={clsx(
                        "flex-1 py-2.5 text-white rounded-xl transition disabled:opacity-50 font-medium shadow-lg",
                        type === 'danger'
                            ? "bg-red-500 hover:bg-red-600 shadow-red-500/25"
                            : "bg-primary hover:bg-primary/90 shadow-primary/25"
                    )}
                >
                    {isLoading ? '处理中...' : confirmText}
                </button>
            </div>
        </Modal>
    );
}
