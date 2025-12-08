import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Package,
    Check,
    Zap,
    Star,
    ArrowRight,
    Loader2,
    Tag,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

interface Plan {
    id: number;
    name: string;
    description: string;
    price: number;
    duration: number;
    transfer: number;
    speed_limit: number;
    device_limit: number;
    sort: number;
}

interface UserProfile {
    id: number;
    balance: number;
}

// 格式化流量
function formatTraffic(gb: number): string {
    if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
    return `${gb} GB`;
}

// 套餐购买页面
export default function UserPlansPage() {
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; final_amount: number } | null>(null);

    const queryClient = useQueryClient();
    const toast = useToast();
    const navigate = useNavigate();

    // 获取套餐列表
    const { data: plansData, isLoading: loadingPlans } = useQuery<{ data: Plan[] }>({
        queryKey: ['public-plans'],
        queryFn: () => api.get('/plans').then(res => res.data),
    });

    // 获取用户信息
    const { data: profileData } = useQuery<{ data: UserProfile }>({
        queryKey: ['user-profile'],
        queryFn: () => api.get('/user/profile').then(res => res.data),
    });

    // 验证优惠券
    const verifyCouponMutation = useMutation({
        mutationFn: (data: { code: string; plan_id: number; amount: number }) =>
            api.post('/user/coupons/verify', data).then(res => res.data),
        onSuccess: (res) => {
            if (res.code === 200) {
                setAppliedCoupon({
                    code: couponCode,
                    discount: res.data.discount,
                    final_amount: res.data.final_amount
                });
                setCouponError('');
                toast.success('优惠券使用成功');
            } else {
                setCouponError(res.message || '优惠券无效');
                setAppliedCoupon(null);
                toast.error(res.message || '优惠券无效');
            }
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || '优惠券验证失败';
            setCouponError(msg);
            setAppliedCoupon(null);
            toast.error(msg);
        }
    });

    // 创建订单
    const createOrderMutation = useMutation({
        mutationFn: (data: { plan_id: number; coupon_code?: string }) =>
            api.post('/user/orders', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-orders'] });
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
            setShowConfirmModal(false);
            setSelectedPlan(null);
            toast.success('订单创建成功！请前往订单页面查看。');
            navigate('/dashboard/orders');
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || '订单创建失败');
        },
    });

    const plans = plansData?.data || [];
    const balance = profileData?.data?.balance || 0;

    // 打开确认弹窗
    const handleSelectPlan = (plan: Plan) => {
        setSelectedPlan(plan);
        // Reset coupon
        setCouponCode('');
        setCouponError('');
        setAppliedCoupon(null);
        setShowConfirmModal(true);
    };

    const handleVerifyCoupon = () => {
        if (!couponCode || !selectedPlan) return;
        verifyCouponMutation.mutate({
            code: couponCode,
            plan_id: selectedPlan.id,
            amount: selectedPlan.price
        });
    }

    // 确认购买
    const handleConfirmPurchase = () => {
        if (!selectedPlan) return;
        createOrderMutation.mutate({
            plan_id: selectedPlan.id,
            coupon_code: appliedCoupon?.code
        });
    };

    // Calculate final price needed from balance
    const finalPrice = appliedCoupon ? appliedCoupon.final_amount : (selectedPlan?.price || 0);

    // 判断余额是否足够
    const isBalanceEnough = balance >= finalPrice;

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">购买套餐</h1>
                <p className="text-slate-500 mt-1">选择适合您的订阅方案</p>
            </div>

            {/* 账户余额提示 */}
            <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/50 rounded-lg shadow-sm">
                            <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">当前余额</p>
                            <p className="text-xl font-bold text-slate-900">¥{balance.toFixed(2)}</p>
                        </div>
                    </div>
                    <button
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
                        onClick={() => navigate('/user/recharge')}
                    >
                        立即充值
                    </button>
                </div>
            </div>

            {/* 套餐列表 */}
            {loadingPlans ? (
                <div className="text-center py-12 text-slate-500">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
                    <p>加载套餐中...</p>
                </div>
            ) : plans.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>暂无可用套餐</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan, index) => {
                        const isPopular = index === 1; // 第二个套餐标记为热门
                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-white border rounded-2xl overflow-hidden transition-all hover:scale-[1.02] shadow-sm ${isPopular
                                    ? 'border-primary shadow-lg shadow-primary/10'
                                    : 'border-slate-200 hover:border-primary/50'
                                    }`}
                            >
                                {/* 热门标签 */}
                                {isPopular && (
                                    <div className="absolute top-0 right-0 bg-primary text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                                        <Star className="w-3 h-3 inline-block mr-1" />
                                        热门
                                    </div>
                                )}

                                <div className="p-6">
                                    {/* 套餐名称 */}
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                            {plan.description || '优质代理服务'}
                                        </p>
                                    </div>

                                    {/* 价格 */}
                                    <div className="mb-6">
                                        <span className="text-4xl font-bold text-slate-900">¥{plan.price}</span>
                                        <span className="text-slate-500 ml-1">/{plan.duration}天</span>
                                    </div>

                                    {/* 套餐特性 */}
                                    <ul className="space-y-3 mb-6">
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span className="text-slate-600">
                                                {formatTraffic(plan.transfer)} 流量
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span className="text-slate-600">
                                                {plan.speed_limit > 0 ? `${plan.speed_limit} Mbps 限速` : '不限速度'}
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span className="text-slate-600">
                                                {plan.device_limit > 0 ? `${plan.device_limit} 台设备` : '不限设备'}
                                            </span>
                                        </li>
                                        <li className="flex items-center gap-2 text-sm">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            <span className="text-slate-600">所有节点可用</span>
                                        </li>
                                    </ul>

                                    {/* 购买按钮 */}
                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition ${isPopular
                                            ? 'bg-primary hover:bg-primary/90 text-white'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                                            }`}
                                    >
                                        立即购买
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 购买确认弹窗 */}
            {showConfirmModal && selectedPlan && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-900">确认购买</h3>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* 套餐信息 */}
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-500">套餐名称</span>
                                    <span className="text-slate-900 font-medium">{selectedPlan.name}</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-500">有效期</span>
                                    <span className="text-slate-900">{selectedPlan.duration} 天</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-500">流量额度</span>
                                    <span className="text-slate-900">{formatTraffic(selectedPlan.transfer)}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                    <span className="text-slate-500">套餐价格</span>
                                    <span className="text-xl font-bold text-primary">¥{selectedPlan.price}</span>
                                </div>
                            </div>

                            {/* 优惠券 */}
                            <div>
                                <label className="block text-sm text-slate-500 mb-2">使用优惠券</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            disabled={!!appliedCoupon}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-slate-900 text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                                            placeholder="输入优惠券码"
                                        />
                                    </div>
                                    {appliedCoupon ? (
                                        <button
                                            onClick={() => {
                                                setAppliedCoupon(null);
                                                setCouponCode('');
                                            }}
                                            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleVerifyCoupon}
                                            disabled={!couponCode || verifyCouponMutation.isPending}
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition disabled:opacity-50 text-sm whitespace-nowrap"
                                        >
                                            {verifyCouponMutation.isPending ? '验证中...' : '兑换'}
                                        </button>
                                    )}
                                </div>
                                {couponError && (
                                    <p className="text-red-400 text-xs mt-1">{couponError}</p>
                                )}
                                {appliedCoupon && (
                                    <p className="text-green-400 text-xs mt-1">
                                        已优惠 ¥{appliedCoupon.discount.toFixed(2)}
                                    </p>
                                )}
                            </div>

                            {/* 余额信息 */}
                            <div className={`rounded-lg p-4 ${isBalanceEnough
                                ? 'bg-green-500/10 border border-green-500/20'
                                : 'bg-red-500/10 border border-red-500/20'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <span className={isBalanceEnough ? 'text-green-600' : 'text-red-500'}>
                                        当前余额
                                    </span>
                                    <span className={`font-bold ${isBalanceEnough ? 'text-green-600' : 'text-red-500'}`}>
                                        ¥{balance.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50">
                                    <span className="text-sm text-slate-500">实付金额</span>
                                    <span className="font-bold text-slate-900">¥{finalPrice.toFixed(2)}</span>
                                </div>
                                {!isBalanceEnough && (
                                    <p className="text-sm text-red-400 mt-2">
                                        余额不足，还需充值 ¥{(finalPrice - balance).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                            >
                                取消
                            </button>
                            {isBalanceEnough ? (
                                <button
                                    onClick={handleConfirmPurchase}
                                    disabled={createOrderMutation.isPending}
                                    className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    {createOrderMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                                    ) : (
                                        '确认购买'
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/user/recharge')}
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
                                >
                                    去充值
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
