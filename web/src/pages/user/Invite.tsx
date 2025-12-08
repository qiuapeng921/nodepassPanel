import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Gift,
    Copy,
    Check,
    Users,
    DollarSign,
    Clock,
    ChevronLeft,
    ChevronRight,
    Share2,
    RefreshCw
} from 'lucide-react';
import api from '../../lib/api';

interface InviteInfo {
    invite_code: string;
    invite_link: string;
    invite_count: number;
    total_commission: number;
    pending_commission: number;
}

interface InviteRecord {
    id: number;
    email: string;
    commission: number;
    status: number;
    created_at: string;
}

interface InviteRecordsResponse {
    list: InviteRecord[];
    total: number;
    page: number;
    page_size: number;
}

// 邀请页面
export default function UserInvitePage() {
    const [page, setPage] = useState(1);
    const [copied, setCopied] = useState(false);

    // 获取邀请信息
    const { data: inviteData, isLoading: loadingInfo, refetch } = useQuery<{ data: InviteInfo }>({
        queryKey: ['user-invite'],
        queryFn: () => api.get('/user/invite').then(res => res.data),
    });

    // 获取邀请记录
    const { data: recordsData, isLoading: loadingRecords } = useQuery<{ data: InviteRecordsResponse }>({
        queryKey: ['user-invite-records', page],
        queryFn: () => api.get('/user/invite/records', {
            params: { page, page_size: 10 }
        }).then(res => res.data),
    });

    const info = inviteData?.data;
    const records = recordsData?.data?.list || [];
    const total = recordsData?.data?.total || 0;
    const totalPages = Math.ceil(total / 10);

    // 复制邀请链接
    const handleCopy = async () => {
        if (!info?.invite_link) return;
        try {
            await navigator.clipboard.writeText(info.invite_link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('复制失败:', error);
        }
    };

    // 格式化日期
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('zh-CN');
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">邀请返利</h1>
                    <p className="text-slate-500 mt-1">邀请好友注册赚取佣金</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition shadow-sm"
                    title="刷新"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-slate-500">邀请人数</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                        {loadingInfo ? '...' : info?.invite_count || 0}
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-slate-500">累计佣金</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                        ¥{loadingInfo ? '...' : (info?.total_commission || 0).toFixed(2)}
                    </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                            <Clock className="w-5 h-5" />
                        </div>
                        <span className="text-slate-500">待结算</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                        ¥{loadingInfo ? '...' : (info?.pending_commission || 0).toFixed(2)}
                    </p>
                </div>
            </div>

            {/* 邀请链接 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <Share2 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-slate-900">我的邀请链接</h2>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-sm text-slate-500 mb-2">邀请码</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-lg text-primary select-all">
                                {loadingInfo ? '...' : info?.invite_code || '-'}
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-slate-500 mb-2">邀请链接</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 truncate select-all">
                                {loadingInfo ? '...' : info?.invite_link || '-'}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition flex items-center gap-2 shadow-sm"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>已复制</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span>复制</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                        <p className="text-sm text-slate-500">
                            <Gift className="w-4 h-4 inline-block mr-1" />
                            当您邀请的好友首次付费时，您将获得订单金额的返利佣金。
                        </p>
                    </div>
                </div>
            </div>

            {/* 邀请记录 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">邀请记录</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">用户</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">佣金</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">状态</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">邀请时间</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loadingRecords ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                        暂无邀请记录
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-slate-900">{record.email}</td>
                                        <td className="px-6 py-4 text-green-600 font-medium">
                                            ¥{record.commission.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {record.status === 1 ? (
                                                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                                                    已结算
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                                                    待结算
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {formatDate(record.created_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-sm text-slate-500">共 {total} 条记录</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition disabled:opacity-50 shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-slate-500">{page} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition disabled:opacity-50 shadow-sm"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
