import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ShoppingCart,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,

} from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PaymentModal from '../../components/biz/PaymentModal';

interface Order {
    id: number;
    order_no: string;
    user_id: number;
    plan_id: number;
    plan_name: string;
    amount: number;
    status: number; // 0=待支付 1=已支付 2=已取消 3=已退款
    payment_method: string;
    created_at: string;
    paid_at: string | null;
}

interface OrderListResponse {
    list: Order[];
    total: number;
    page: number;
    page_size: number;
}

// 状态配置
const statusConfig: Record<number, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
    0: { label: '待支付', color: 'text-yellow-600 bg-yellow-50 border border-yellow-200', icon: Clock },
    1: { label: '已支付', color: 'text-green-600 bg-green-50 border border-green-200', icon: CheckCircle },
    2: { label: '已取消', color: 'text-slate-500 bg-slate-100 border border-slate-200', icon: XCircle },
    3: { label: '已退款', color: 'text-red-600 bg-red-50 border border-red-200', icon: AlertCircle },
};

// 用户订单页面
export default function UserOrdersPage() {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<number | null>(null);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [cancelId, setCancelId] = useState<number | null>(null);

    const queryClient = useQueryClient();
    const toast = useToast();

    // 获取用户信息（用于显示余额）
    const { data: profileData } = useQuery<{ data: { balance: number } }>({
        queryKey: ['user-profile'],
        queryFn: () => api.get('/user/profile').then(res => res.data),
    });
    const balance = profileData?.data?.balance || 0;

    // 获取订单列表
    const { data, isLoading, refetch } = useQuery<{ data: OrderListResponse }>({
        queryKey: ['user-orders', page, statusFilter],
        queryFn: () => api.get('/user/orders', {
            params: {
                page,
                page_size: 10,
                status: statusFilter !== null ? statusFilter : undefined
            }
        }).then(res => res.data),
    });

    const orders = data?.data?.list || [];
    const total = data?.data?.total || 0;
    const totalPages = Math.ceil(total / 10);

    // 格式化日期
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 取消订单
    const cancelMutation = useMutation({
        mutationFn: (id: number) => api.post(`/user/orders/${id}/cancel`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-orders'] });
            toast.success('订单已取消');
            setCancelId(null);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || '取消失败');
        }
    });



    const handleCancelClick = (id: number) => {
        setCancelId(id);
    };

    const handleConfirmCancel = () => {
        if (cancelId) {
            cancelMutation.mutate(cancelId);
        }
    };

    const handlePayClick = (order: Order) => {
        setSelectedOrder(order);
        setShowPayModal(true);
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">我的订单</h1>
                    <p className="text-slate-500 mt-1">查看您的订单记录</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition shadow-sm"
                    title="刷新"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* 状态筛选 */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => {
                        setStatusFilter(null);
                        setPage(1);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition ${statusFilter === null
                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    全部
                </button>
                {Object.entries(statusConfig).map(([status, config]) => (
                    <button
                        key={status}
                        onClick={() => {
                            setStatusFilter(Number(status));
                            setPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm transition ${statusFilter === Number(status)
                            ? 'bg-primary text-white shadow-md shadow-primary/25'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {config.label}
                    </button>
                ))}
            </div>

            {/* 订单列表 - 表格视图 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200">
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">订单号</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">套餐</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">金额</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">状态</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">支付方式</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">创建时间</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-slate-400" />
                                        <p>加载中...</p>
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50 text-slate-400" />
                                        <p>暂无订单记录</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const status = statusConfig[order.status] || statusConfig[0];
                                    const StatusIcon = status.icon;

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50 transition duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm text-slate-600">{order.order_no}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-medium text-slate-900">{order.plan_name}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-bold text-slate-900">¥{order.amount.toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-500">
                                                    {order.payment_method || (order.status === 1 ? '余额支付' : '-')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-500">{formatDate(order.created_at)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {order.status === 0 && (
                                                        <>
                                                            <button
                                                                onClick={() => handleCancelClick(order.id)}
                                                                disabled={cancelMutation.isPending}
                                                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs rounded transition shadow-sm disabled:opacity-50"
                                                            >
                                                                取消
                                                            </button>
                                                            <button
                                                                onClick={() => handlePayClick(order)}
                                                                className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs rounded transition shadow-sm shadow-primary/25"
                                                            >
                                                                支付
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        共 {total} 条记录
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-500">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* 确认取消弹窗 */}
            <ConfirmDialog
                isOpen={!!cancelId}
                onClose={() => setCancelId(null)}
                onConfirm={handleConfirmCancel}
                title="取消订单"
                description="确定要取消此订单吗？取消后将无法恢复。"
                confirmText="确认取消"
                type="danger"
                isLoading={cancelMutation.isPending}
            />

            {/* 支付模态框 */}
            {selectedOrder && (
                <PaymentModal
                    isOpen={showPayModal}
                    onClose={() => setShowPayModal(false)}
                    orderNo={selectedOrder.order_no}
                    amount={selectedOrder.amount}
                    balance={balance}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['user-orders'] });
                        setShowPayModal(false);
                    }}
                />
            )}
        </div>
    );
}
