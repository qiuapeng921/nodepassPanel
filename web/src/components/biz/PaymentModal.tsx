import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, CreditCard, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import { useToast } from '../ui/Toast';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderNo: string;
    amount: number;
    balance: number;
    onSuccess?: () => void;
    allowBalance?: boolean; // 是否允许余额支付 (充值订单不允许余额支付)
}

export default function PaymentModal({
    isOpen,
    onClose,
    orderNo,
    amount,
    balance,
    onSuccess,
    allowBalance = true
}: PaymentModalProps) {
    const [paymentMethod, setPaymentMethod] = useState(allowBalance ? 'balance' : 'alipay');
    const toast = useToast();
    const queryClient = useQueryClient();

    // 支付订单
    const payMutation = useMutation({
        mutationFn: (data: { order_no: string; method: string }) => api.post('/user/payment/pay', data),
        onSuccess: (res) => {
            const { pay_url, content_type } = res.data.data;
            if (content_type === 'success') {
                toast.success('支付成功！');
                queryClient.invalidateQueries({ queryKey: ['user-profile'] }); // Update balance
                if (onSuccess) onSuccess();
                onClose();
            } else if (pay_url) {
                window.location.href = pay_url;
            } else {
                toast.error('支付初始化成功，但未返回跳转链接');
            }
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || '支付失败');
        }
    });

    const handleConfirmPay = () => {
        payMutation.mutate({
            order_no: orderNo,
            method: paymentMethod
        });
    };

    // 如果不允许余额支付且当前选中的是余额，自动切换到第一个可用
    if (!allowBalance && paymentMethod === 'balance') {
        setPaymentMethod('alipay');
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">支付订单</h3>
                    <p className="text-sm font-normal text-slate-500 mt-1">订单号: {orderNo}</p>
                </div>
            }
            width="sm"
            footer={
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleConfirmPay}
                        disabled={payMutation.isPending || (paymentMethod === 'balance' && balance < amount)}
                        className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                    >
                        {payMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : '确认支付'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="text-center py-2">
                    <p className="text-sm text-slate-500 mb-1">支付金额</p>
                    <p className="text-4xl font-bold text-primary">¥{amount.toFixed(2)}</p>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700">选择支付方式</label>
                    <div className="space-y-3">
                        {allowBalance && (
                            <button
                                onClick={() => setPaymentMethod('balance')}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${paymentMethod === 'balance'
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-600 shadow-sm">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-slate-900">余额支付</p>
                                        <p className="text-xs text-slate-500 mt-0.5">当前余额: ¥{balance.toFixed(2)}</p>
                                    </div>
                                </div>
                                {paymentMethod === 'balance' && (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                    </div>
                                )}
                            </button>
                        )}

                        {/* 其他支付方式 */}
                        {['alipay', 'stripe'].map(method => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${paymentMethod === method
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg shadow-sm">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-slate-900">
                                            {method === 'alipay' ? '支付宝' : 'Stripe / 信用卡'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {method === 'alipay' ? '快捷支付' : '安全支付'}
                                        </p>
                                    </div>
                                </div>
                                {paymentMethod === method && (
                                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
