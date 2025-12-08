import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    RefreshCw,
    ShoppingCart,
    CheckCircle,
    XCircle,
    Clock,
    RotateCcw
} from 'lucide-react';
import api from '../../lib/api';

interface Order {
    id: number;
    order_no: string;
    user_id: number;
    plan_id: number;
    amount: number;
    discount: number;
    paid: number;
    status: number;
    pay_method: string;
    paid_at: string | null;
    created_at: string;
}

interface OrderListResponse {
    list: Order[];
    total: number;
    page: number;
    page_size: number;
}

const statusConfig: Record<number, { label: string; color: string; icon: typeof CheckCircle }> = {
    0: { label: '待支付', color: 'text-yellow-400 bg-yellow-500/20', icon: Clock },
    1: { label: '已支付', color: 'text-green-400 bg-green-500/20', icon: CheckCircle },
    2: { label: '已取消', color: 'text-slate-400 bg-slate-500/20', icon: XCircle },
    3: { label: '已退款', color: 'text-red-400 bg-red-500/20', icon: RotateCcw },
};

// 订单管理页面
export default function OrdersPage() {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<number | undefined>();
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery<{ data: OrderListResponse }>({
        queryKey: ['admin-orders', page, statusFilter],
        queryFn: () => api.get('/admin/orders', {
            params: { page, page_size: 20, status: statusFilter }
        }).then(res => res.data),
    });

    const markPaidMutation = useMutation({
        mutationFn: (id: number) => api.post(`/admin/orders/${id}/paid`, { pay_method: 'manual' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        },
    });

    const refundMutation = useMutation({
        mutationFn: (id: number) => api.post(`/admin/orders/${id}/refund`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        },
    });

    const orders = data?.data?.list || [];
    const total = data?.data?.total || 0;
    const totalPages = Math.ceil(total / 20);

    const handleMarkPaid = (order: Order) => {
        if (confirm(`确定要将订单 ${order.order_no} 标记为已支付吗？`)) {
            markPaidMutation.mutate(order.id);
        }
    };

    const handleRefund = (order: Order) => {
        if (confirm(`确定要退款订单 ${order.order_no} 吗？`)) {
            refundMutation.mutate(order.id);
        }
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold text-white">订单管理</h1>
                <p className="text-slate-400 mt-1">管理用户订单和支付</p>
            </div>

            {/* 筛选栏 */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">状态：</span>
                    <select
                        value={statusFilter ?? ''}
                        onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : undefined)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                    >
                        <option value="">全部</option>
                        <option value="0">待支付</option>
                        <option value="1">已支付</option>
                        <option value="2">已取消</option>
                        <option value="3">已退款</option>
                    </select>
                </div>
                <div className="flex-1" />
                <button
                    onClick={() => refetch()}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                    title="刷新"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* 订单列表 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">订单号</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">用户ID</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">金额</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">状态</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">支付方式</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">创建时间</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>暂无订单</p>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => {
                                    const status = statusConfig[order.status] || statusConfig[0];
                                    const StatusIcon = status.icon;
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-800/50 transition">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm text-white">{order.order_no}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-400">#{order.user_id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <span className="text-sm font-medium text-white">¥{order.paid}</span>
                                                    {order.discount > 0 && (
                                                        <span className="text-xs text-slate-500 line-through ml-2">
                                                            ¥{order.amount}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${status.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-400">
                                                    {order.pay_method || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-400">
                                                    {new Date(order.created_at).toLocaleString('zh-CN')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {order.status === 0 && (
                                                        <button
                                                            onClick={() => handleMarkPaid(order)}
                                                            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition"
                                                        >
                                                            确认支付
                                                        </button>
                                                    )}
                                                    {order.status === 1 && (
                                                        <button
                                                            onClick={() => handleRefund(order)}
                                                            className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition"
                                                        >
                                                            退款
                                                        </button>
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

                {/* 分页 */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
                        <p className="text-sm text-slate-400">共 {total} 条</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                                上一页
                            </button>
                            <span className="text-sm text-slate-400">{page} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                                下一页
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
