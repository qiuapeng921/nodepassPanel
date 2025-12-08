import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ShoppingCart,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    FileText
} from 'lucide-react';
import api from '../../lib/api';

interface Order {
    id: number;
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
    0: { label: '待支付', color: 'text-yellow-400 bg-yellow-400/20', icon: Clock },
    1: { label: '已支付', color: 'text-green-400 bg-green-400/20', icon: CheckCircle },
    2: { label: '已取消', color: 'text-slate-400 bg-slate-400/20', icon: XCircle },
    3: { label: '已退款', color: 'text-red-400 bg-red-400/20', icon: AlertCircle },
};

// 用户订单页面
export default function UserOrdersPage() {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<number | null>(null);

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

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">我的订单</h1>
                    <p className="text-slate-400 mt-1">查看您的订单记录</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
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
                        ? 'bg-primary text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
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
                            ? 'bg-primary text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        {config.label}
                    </button>
                ))}
            </div>

            {/* 订单列表 */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-slate-500">
                        <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                        <p>加载中...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>暂无订单记录</p>
                    </div>
                ) : (
                    orders.map((order) => {
                        const status = statusConfig[order.status] || statusConfig[0];
                        const StatusIcon = status.icon;

                        return (
                            <div
                                key={order.id}
                                className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition"
                            >
                                {/* 订单头部 */}
                                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-slate-800 rounded-lg">
                                            <FileText className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">订单 #{order.id}</p>
                                            <p className="text-sm text-slate-500">{formatDate(order.created_at)}</p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${status.color}`}>
                                        <StatusIcon className="w-4 h-4" />
                                        {status.label}
                                    </span>
                                </div>

                                {/* 订单内容 */}
                                <div className="px-6 py-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg font-medium text-white">{order.plan_name}</p>
                                            <p className="text-sm text-slate-500">
                                                {order.payment_method || '余额支付'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-primary">¥{order.amount.toFixed(2)}</p>
                                            {order.paid_at && (
                                                <p className="text-sm text-slate-500">
                                                    支付时间: {formatDate(order.paid_at)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 订单操作 */}
                                {order.status === 0 && (
                                    <div className="px-6 py-3 bg-slate-800/50 border-t border-slate-800 flex items-center justify-end gap-3">
                                        <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition">
                                            取消订单
                                        </button>
                                        <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm rounded-lg transition">
                                            立即支付
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                        共 {total} 条记录
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-4 py-2 text-sm text-slate-400">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
