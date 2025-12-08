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

interface UserProfile {
    id: number;
    balance: number;
}

// 充值页面
export default function UserRechargePage() {
    const [rechargeCode, setRechargeCode] = useState('');
    const [successAmount, setSuccessAmount] = useState<number | null>(null);
    const [error, setError] = useState('');
    const queryClient = useQueryClient();

    // 获取用户信息
    const { data: profileData, isLoading: loadingProfile } = useQuery<{ data: UserProfile }>({
        queryKey: ['user-profile'],
        queryFn: () => api.get('/user/profile').then(res => res.data),
    });

    // 充值
    const rechargeMutation = useMutation({
        mutationFn: (code: string) =>
            api.post('/user/recharge', { code }),
        onSuccess: (res) => {
            const amount = res.data?.data?.amount || 0;
            setSuccessAmount(amount);
            setRechargeCode('');
            setError('');
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            setTimeout(() => setSuccessAmount(null), 5000);
        },
        onError: (err: Error & { response?: { data?: { message?: string } } }) => {
            setError(err.response?.data?.message || '充值失败');
            setSuccessAmount(null);
        },
    });

    const balance = profileData?.data?.balance || 0;

    const handleRecharge = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rechargeCode.trim()) {
            setError('请输入充值卡密');
            return;
        }
        setError('');
        rechargeMutation.mutate(rechargeCode.trim());
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold text-white">账户充值</h1>
                <p className="text-slate-400 mt-1">充值余额购买套餐</p>
            </div>

            {/* 当前余额 */}
            <div className="bg-gradient-to-r from-primary/20 to-purple-600/20 border border-primary/30 rounded-xl p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-xl">
                        <Wallet className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">当前余额</p>
                        <p className="text-3xl font-bold text-white">
                            ¥{loadingProfile ? '...' : balance.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* 充值方式 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 卡密充值 */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <Ticket className="w-5 h-5 text-green-400" />
                            <h2 className="text-lg font-semibold text-white">卡密充值</h2>
                        </div>
                    </div>

                    <form onSubmit={handleRecharge} className="p-6 space-y-4">
                        {/* 成功提示 */}
                        {successAmount !== null && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                                <Check className="w-4 h-4" />
                                <span>充值成功！已到账 ¥{successAmount.toFixed(2)}</span>
                            </div>
                        )}

                        {/* 错误提示 */}
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                充值卡密
                            </label>
                            <input
                                type="text"
                                value={rechargeCode}
                                onChange={(e) => setRechargeCode(e.target.value)}
                                placeholder="请输入充值卡密"
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary font-mono"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={rechargeMutation.isPending}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition disabled:opacity-50"
                        >
                            {rechargeMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>充值中...</span>
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-4 h-4" />
                                    <span>立即充值</span>
                                </>
                            )}
                        </button>

                        <p className="text-xs text-slate-500 text-center">
                            请确保卡密正确，充值后将立即到账
                        </p>
                    </form>
                </div>

                {/* 在线支付（占位） */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                            <h2 className="text-lg font-semibold text-white">在线支付</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                                <CreditCard className="w-8 h-8 text-slate-600" />
                            </div>
                            <p className="text-slate-400 mb-2">在线支付功能即将开放</p>
                            <p className="text-sm text-slate-500">
                                支持支付宝、微信支付等多种支付方式
                            </p>
                        </div>

                        {/* 支付金额选项（占位） */}
                        <div className="grid grid-cols-3 gap-3 mb-4 opacity-50">
                            {[10, 20, 50, 100, 200, 500].map((amount) => (
                                <button
                                    key={amount}
                                    disabled
                                    className="py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-center"
                                >
                                    ¥{amount}
                                </button>
                            ))}
                        </div>

                        <button
                            disabled
                            className="w-full py-3 bg-slate-700 text-slate-400 rounded-lg cursor-not-allowed"
                        >
                            敬请期待
                        </button>
                    </div>
                </div>
            </div>

            {/* 充值说明 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">充值说明</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>充值卡密为一次性使用，充值后立即到账</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>如遇充值问题，请联系客服协助处理</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>账户余额可用于购买任意套餐</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>充值记录可在订单页面查看</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
