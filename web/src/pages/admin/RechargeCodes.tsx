import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Ticket,
    Plus,
    Trash2,
    RefreshCw,
    Copy,
    Check,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Download
} from 'lucide-react';
import api from '../../lib/api';

interface RechargeCode {
    id: number;
    code: string;
    amount: number;
    used: boolean;
    used_by: number;
    used_at: string | null;
    remark: string;
    created_at: string;
}

interface RechargeCodeListResponse {
    list: RechargeCode[];
    total: number;
    page: number;
    page_size: number;
}

// 充值卡密管理页面
export default function RechargeCodesPage() {
    const [page, setPage] = useState(1);
    const [usedFilter, setUsedFilter] = useState<boolean | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createAmount, setCreateAmount] = useState('10');
    const [createCount, setCreateCount] = useState('10');
    const [createRemark, setCreateRemark] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [createdCodes, setCreatedCodes] = useState<string[]>([]);
    const queryClient = useQueryClient();

    // 获取卡密列表
    const { data, isLoading, refetch } = useQuery<{ data: RechargeCodeListResponse }>({
        queryKey: ['admin-recharge-codes', page, usedFilter],
        queryFn: () => api.get('/admin/recharge/codes', {
            params: {
                page,
                page_size: 20,
                used: usedFilter !== null ? usedFilter : undefined
            }
        }).then(res => res.data),
    });

    // 创建卡密
    const createMutation = useMutation({
        mutationFn: (data: { amount: number; count: number; remark: string }) =>
            api.post('/admin/recharge/codes', data),
        onSuccess: (res) => {
            const codes = res.data?.data?.codes || [];
            setCreatedCodes(codes);
            queryClient.invalidateQueries({ queryKey: ['admin-recharge-codes'] });
        },
    });

    // 删除卡密
    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/recharge/codes/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-recharge-codes'] });
        },
    });

    const codes = data?.data?.list || [];
    const total = data?.data?.total || 0;
    const totalPages = Math.ceil(total / 20);

    // 复制单个卡密
    const handleCopy = async (code: string, id: number) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('复制失败', err);
        }
    };

    // 复制所有新生成的卡密
    const handleCopyAll = async () => {
        try {
            await navigator.clipboard.writeText(createdCodes.join('\n'));
            alert('已复制所有卡密到剪贴板');
        } catch (err) {
            console.error('复制失败', err);
        }
    };

    // 创建卡密
    const handleCreate = () => {
        const amount = parseFloat(createAmount);
        const count = parseInt(createCount);

        if (isNaN(amount) || amount <= 0) {
            alert('请输入有效的金额');
            return;
        }
        if (isNaN(count) || count < 1 || count > 100) {
            alert('数量范围: 1-100');
            return;
        }

        createMutation.mutate({
            amount,
            count,
            remark: createRemark
        });
    };

    // 删除卡密
    const handleDelete = (id: number) => {
        if (confirm('确定删除此卡密？')) {
            deleteMutation.mutate(id);
        }
    };

    // 格式化日期
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN');
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">充值卡密管理</h1>
                    <p className="text-slate-500 mt-1">生成和管理用户充值卡密</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition shadow-sm"
                        title="刷新"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            setShowCreateModal(true);
                            setCreatedCodes([]);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>生成卡密</span>
                    </button>
                </div>
            </div>

            {/* 筛选 */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => { setUsedFilter(null); setPage(1); }}
                    className={`px-4 py-2 rounded-lg text-sm transition ${usedFilter === null
                        ? 'bg-primary text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    全部
                </button>
                <button
                    onClick={() => { setUsedFilter(false); setPage(1); }}
                    className={`px-4 py-2 rounded-lg text-sm transition ${usedFilter === false
                        ? 'bg-primary text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    未使用
                </button>
                <button
                    onClick={() => { setUsedFilter(true); setPage(1); }}
                    className={`px-4 py-2 rounded-lg text-sm transition ${usedFilter === true
                        ? 'bg-primary text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    已使用
                </button>
            </div>

            {/* 卡密列表 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">卡密</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">金额</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">状态</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">备注</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">创建时间</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                                        加载中...
                                    </td>
                                </tr>
                            ) : codes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        暂无卡密数据
                                    </td>
                                </tr>
                            ) : (
                                codes.map((code) => (
                                    <tr key={code.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-slate-900">{code.code}</span>
                                                <button
                                                    onClick={() => handleCopy(code.code, code.id)}
                                                    className="p-1 hover:bg-slate-100 rounded transition"
                                                    title="复制"
                                                >
                                                    {copiedId === code.id ? (
                                                        <Check className="w-4 h-4 text-green-400" />
                                                    ) : (
                                                        <Copy className="w-4 h-4 text-slate-500" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-green-400 font-medium">
                                            ¥{code.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {code.used ? (
                                                <span className="px-2 py-1 text-xs bg-slate-600/50 text-slate-400 rounded">
                                                    已使用
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                                                    可用
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">
                                            {code.remark || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm">
                                            {formatDate(code.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {!code.used && (
                                                <button
                                                    onClick={() => handleDelete(code.id)}
                                                    disabled={deleteMutation.isPending}
                                                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                                                    title="删除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-500">共 {total} 条记录</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-slate-500">{page} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 生成卡密弹窗 */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">批量生成卡密</h3>
                        </div>

                        <div className="p-6 space-y-4">
                            {createdCodes.length > 0 ? (
                                // 显示生成结果
                                <>
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                        <p className="text-green-400 mb-2">
                                            成功生成 {createdCodes.length} 个卡密！
                                        </p>
                                    </div>

                                    <div className="bg-slate-100 rounded-lg p-4 max-h-60 overflow-y-auto">
                                        <div className="space-y-2">
                                            {createdCodes.map((code, index) => (
                                                <div key={index} className="font-mono text-sm text-slate-900">
                                                    {code}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCopyAll}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
                                    >
                                        <Download className="w-4 h-4" />
                                        复制全部卡密
                                    </button>
                                </>
                            ) : (
                                // 生成表单
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            面额（元）
                                        </label>
                                        <input
                                            type="number"
                                            value={createAmount}
                                            onChange={(e) => setCreateAmount(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                            placeholder="10"
                                            min="1"
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            生成数量
                                        </label>
                                        <input
                                            type="number"
                                            value={createCount}
                                            onChange={(e) => setCreateCount(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                            placeholder="10"
                                            min="1"
                                            max="100"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            备注（可选）
                                        </label>
                                        <input
                                            type="text"
                                            value={createRemark}
                                            onChange={(e) => setCreateRemark(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                            placeholder="如：促销活动"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-200 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreatedCodes([]);
                                }}
                                className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
                            >
                                关闭
                            </button>
                            {createdCodes.length === 0 && (
                                <button
                                    onClick={handleCreate}
                                    disabled={createMutation.isPending}
                                    className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {createMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            生成
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
