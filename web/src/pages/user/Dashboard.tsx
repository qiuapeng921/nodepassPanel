import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    Clock,
    Zap,
    Server,
    RefreshCw,
    ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface UserProfile {
    id: number;
    email: string;
    balance: number;
    upload: number;
    download: number;
    transfer_enable: number;
    expired_at: string | null;
    group_id: number;
}

interface Node {
    id: number;
    name: string;
    address: string;
    port: number;
    protocol: string;
    status: number;
    traffic_rate: number;
}

// 格式化流量
function formatTraffic(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    if (bytes < 1024 * 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
    return `${(bytes / 1024 / 1024 / 1024 / 1024).toFixed(2)} TB`;
}

// 格式化到期时间
function formatExpiredAt(expiredAt: string | null): { text: string; color: string } {
    if (!expiredAt) {
        return { text: '永久有效', color: 'text-green-400' };
    }

    const expDate = new Date(expiredAt);
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: '已过期', color: 'text-red-400' };
    } else if (diffDays <= 7) {
        return { text: `${diffDays} 天后到期`, color: 'text-yellow-400' };
    } else {
        return { text: `${diffDays} 天后到期`, color: 'text-slate-400' };
    }
}

// 用户仪表盘
export default function UserDashboard() {
    // 获取用户信息
    const { data: profileData, isLoading: loadingProfile, refetch: refetchProfile } = useQuery<{ data: UserProfile }>({
        queryKey: ['user-profile'],
        queryFn: () => api.get('/user/profile').then(res => res.data),
    });

    // 获取节点列表
    const { data: nodesData, isLoading: loadingNodes } = useQuery<{ data: Node[] }>({
        queryKey: ['user-nodes'],
        queryFn: () => api.get('/user/nodes').then(res => res.data),
    });

    const profile = profileData?.data;
    const nodes = nodesData?.data || [];
    const onlineNodes = nodes.filter(n => n.status === 1);

    // 计算流量使用百分比
    const usedTraffic = (profile?.upload || 0) + (profile?.download || 0);
    const totalTraffic = profile?.transfer_enable || 1;
    const usedPercent = Math.min(100, (usedTraffic / totalTraffic) * 100);

    // 到期时间信息
    const expiredInfo = formatExpiredAt(profile?.expired_at || null);

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
                    <p className="text-slate-500 mt-1">查看您的使用情况</p>
                </div>
                <button
                    onClick={() => refetchProfile()}
                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition shadow-sm"
                    title="刷新数据"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 流量使用 */}
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-blue-500/20 rounded-lg">
                            <Activity className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-xs text-blue-400">{usedPercent.toFixed(1)}%</span>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-slate-500">已用流量</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {loadingProfile ? '...' : formatTraffic(usedTraffic)}
                        </p>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                                style={{ width: `${usedPercent}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400">
                            总流量: {formatTraffic(totalTraffic)}
                        </p>
                    </div>
                </div>

                {/* 到期时间 */}
                <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-purple-500/20 rounded-lg">
                            <Clock className="w-5 h-5 text-purple-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-slate-500">套餐状态</p>
                        <p className={`text-2xl font-bold ${expiredInfo.color}`}>
                            {loadingProfile ? '...' : expiredInfo.text}
                        </p>
                        <p className="text-xs text-slate-400">
                            {profile?.expired_at
                                ? new Date(profile.expired_at).toLocaleDateString('zh-CN')
                                : '无到期时间'
                            }
                        </p>
                    </div>
                </div>

                {/* 账户余额 */}
                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-green-500/20 rounded-lg">
                            <Zap className="w-5 h-5 text-green-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-slate-500">账户余额</p>
                        <p className="text-2xl font-bold text-slate-900">
                            ¥{loadingProfile ? '...' : (profile?.balance || 0).toFixed(2)}
                        </p>
                        <Link
                            to="/dashboard/plans"
                            className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-500 transition"
                        >
                            充值购买 <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                {/* 可用节点 */}
                <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 bg-orange-500/20 rounded-lg">
                            <Server className="w-5 h-5 text-orange-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-slate-500">可用节点</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {loadingNodes ? '...' : `${onlineNodes.length} / ${nodes.length}`}
                        </p>
                        <p className="text-xs text-slate-400">
                            在线节点数
                        </p>
                    </div>
                </div>
            </div>

            {/* 节点列表预览 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">节点状态</h2>
                    <span className="text-sm text-slate-500">
                        {onlineNodes.length} 个节点在线
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {loadingNodes ? (
                        <div className="px-6 py-8 text-center text-slate-500">加载中...</div>
                    ) : nodes.length === 0 ? (
                        <div className="px-6 py-8 text-center text-slate-500">暂无可用节点</div>
                    ) : (
                        nodes.slice(0, 5).map((node) => (
                            <div
                                key={node.id}
                                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${node.status === 1 ? 'bg-green-500' : 'bg-red-500'
                                        }`} />
                                    <div>
                                        <p className="font-medium text-slate-900">{node.name}</p>
                                        <p className="text-sm text-slate-500">{node.address}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-600">{node.protocol}</p>
                                    <p className="text-xs text-slate-400">
                                        倍率: {node.traffic_rate}x
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {nodes.length > 5 && (
                    <div className="px-6 py-3 border-t border-slate-100 text-center">
                        <span className="text-sm text-slate-500">
                            还有 {nodes.length - 5} 个节点，请使用客户端查看
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
