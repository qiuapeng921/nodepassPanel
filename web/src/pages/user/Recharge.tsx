import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    CreditCard,
    Ticket,
    Wallet,
    Check,
    Loader2,
    AlertCircle
} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import PaymentModal from '../../components/biz/PaymentModal';

interface UserProfile {
    id: number;
    balance: number;
}

// 充值页面
export default function UserRechargePage() {
    const [rechargeCode, setRechargeCode] = useState('');
    const [successAmount, setSuccessAmount] = useState<number | null>(null);
    const [error, setError] = useState('');

    // Online Recharge State
    const [selectedAmount, setSelectedAmount] = useState<number>(0);
    const [customAmount, setCustomAmount] = useState('');
    const [isCustom, setIsCustom] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [createdOrder, setCreatedOrder] = useState<{ order_no: string; amount: number } | null>(null);

    const queryClient = useQueryClient();
    const toast = useToast();

    // 获取用户信息
    const { data: profileData, isLoading: loadingProfile } = useQuery<{ data: UserProfile }>({
        queryKey: ['user-profile'],
        queryFn: () => api.get('/user/profile').then(res => res.data),
    });

    // 卡密充值
    const rechargeMutation = useMutation({
        mutationFn: (code: string) =>
            api.post('/user/recharge', { code }),
        onSuccess: (res) => {
            const amount = res.data?.data?.amount || 0;
            setSuccessAmount(amount);
            setRechargeCode('');
            setError('');
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            toast.success(`充值成功！已到账 ¥${amount.toFixed(2)}`);
            setTimeout(() => setSuccessAmount(null), 5000);
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || '充值失败');
            toast.error(err.response?.data?.message || '充值失败');
            setSuccessAmount(null);
        },
    });

    // 在线充值创建订单
    const createOrderMutation = useMutation({
        mutationFn: (amount: number) => api.post('/user/recharge/online', { amount }),
        onSuccess: (res) => {
            const data = res.data.data;
            setCreatedOrder({
                order_no: data.order_no,
                amount: data.amount,
            });
            setShowPayModal(true);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || '创建订单失败');
        }
    });

    const balance = profileData?.data?.balance || 0;

    const handleRechargeCode = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rechargeCode.trim()) {
            setError('请输入充值卡密');
            return;
        }
        setError('');
        rechargeMutation.mutate(rechargeCode.trim());
    };

    const handleOnlineRecharge = () => {
        let amount = selectedAmount;
        if (isCustom) {
            amount = parseFloat(customAmount);
            if (isNaN(amount) || amount <= 0) {
                toast.error('请输入有效的金额');
                return;
            }
        }
        if (amount <= 0) {
            toast.error('请选择或输入充值金额');
            return;
        }
        createOrderMutation.mutate(amount);
    };

    const amounts = [10, 20, 50, 100, 200, 500];

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">账户充值</h1>
                <p className="text-slate-500 mt-1">充值余额购买套餐</p>
            </div>

            {/* 当前余额 */}
            <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20 rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/50 rounded-xl shadow-sm">
                        <Wallet className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-600">当前余额</p>
                        <p className="text-3xl font-bold text-slate-900">
                            ¥{loadingProfile ? '...' : balance.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* 充值方式 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 在线支付 */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm order-2 lg:order-1">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-semibold text-slate-900">在线支付</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {amounts.map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => {
                                        setSelectedAmount(amount);
                                        setIsCustom(false);
                                        setCustomAmount('');
                                    }}
                                    className={`py-3 border rounded-lg text-center transition ${!isCustom && selectedAmount === amount
                                            ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                        }`}
                                >
                                    ¥{amount}
                                </button>
                            ))}
                        </div>

                        <div className="mb-6">
                            <div
                                className={`flex items-center px-4 py-3 border rounded-lg transition ${isCustom ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                onClick={() => setIsCustom(true)}
                            >
                                <span className="text-slate-500 mr-2">¥</span>
                                <input
                                    type="number"
                                    placeholder="自定义金额"
                                    className="w-full bg-transparent outline-none text-slate-900 placeholder-slate-400"
                                    value={customAmount}
                                    onChange={(e) => {
                                        setCustomAmount(e.target.value);
                                        setIsCustom(true);
                                        setSelectedAmount(0);
                                    }}
                                    onFocus={() => {
                                        setIsCustom(true);
                                        setSelectedAmount(0);
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleOnlineRecharge}
                            disabled={createOrderMutation.isPending || (!selectedAmount && !customAmount)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
                        >
                            {createOrderMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>处理中...</span>
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4" />
                                    <span>立即支付</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* 卡密充值 */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm order-1 lg:order-2">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <Ticket className="w-5 h-5 text-green-500" />
                            <h2 className="text-lg font-semibold text-slate-900">卡密充值</h2>
                        </div>
                    </div>

                    <form onSubmit={handleRechargeCode} className="p-6 space-y-4">
                        {/* 成功提示 */}
                        {successAmount !== null && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-600">
                                <Check className="w-4 h-4" />
                                <span>充值成功！已到账 ¥{successAmount.toFixed(2)}</span>
                            </div>
                        )}

                        {/* 错误提示 */}
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                充值卡密
                            </label>
                            <input
                                type="text"
                                value={rechargeCode}
                                onChange={(e) => setRechargeCode(e.target.value)}
                                placeholder="请输入充值卡密"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-green-500 font-mono placeholder-slate-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={rechargeMutation.isPending}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition disabled:opacity-50 shadow-sm shadow-green-500/20"
                        >
                            {rechargeMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>充值中...</span>
                                </>
                            ) : (
                                <>
                                    <Ticket className="w-4 h-4" />
                                    <span>立即充值</span>
                                </>
                            )}
                        </button>

                        <p className="text-xs text-slate-500 text-center">
                            请确保卡密正确，充值后将立即到账
                        </p>
                    </form>
                </div>
            </div>

            {/* 充值说明 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-4">充值说明</h3>
                <ul className="space-y-2 text-sm text-slate-500">
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>账户余额可用于购买站内任意套餐或服务</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>在线支付支持支付宝、微信等多种支付方式，实时到账</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>卡密充值请确保来源合法，卡密为一次性验证，使用后即失效</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>如遇充值失败或未到账问题，请保留支付凭证并立即联系客服</span>
                    </li>
                </ul>
            </div>

            {/* 支付弹窗 */}
            {createdOrder && (
                <PaymentModal
                    isOpen={showPayModal}
                    onClose={() => setShowPayModal(false)}
                    orderNo={createdOrder.order_no}
                    amount={createdOrder.amount}
                    balance={balance}
                    allowBalance={false}
                    onSuccess={() => {
                        toast.success('充值成功');
                        setShowPayModal(false);
                        queryClient.invalidateQueries({ queryKey: ['user-profile'] });
                    }}
                />
            )}
        </div>
    );
}
