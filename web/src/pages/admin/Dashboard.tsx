import {
    Users,
    Server,
    Package,
    ShoppingCart,
    TrendingUp,
    TrendingDown,
    Activity
} from 'lucide-react';

// 统计卡片
function StatCard({
    title,
    value,
    change,
    changeType,
    icon: Icon
}: {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'up' | 'down';
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-500">{title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
                    {change && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${changeType === 'up' ? 'text-green-500' : 'text-red-500'
                            }`}>
                            {changeType === 'up' ? (
                                <TrendingUp className="w-4 h-4" />
                            ) : (
                                <TrendingDown className="w-4 h-4" />
                            )}
                            <span>{change}</span>
                        </div>
                    )}
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
            </div>
        </div>
    );
}

// 管理仪表盘页面
export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">仪表盘</h1>
                <p className="text-slate-500 mt-1">欢迎回来，查看系统概览</p>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="总用户数"
                    value="1,234"
                    change="+12.5%"
                    changeType="up"
                    icon={Users}
                />
                <StatCard
                    title="活跃节点"
                    value="8"
                    change="+2"
                    changeType="up"
                    icon={Server}
                />
                <StatCard
                    title="套餐销量"
                    value="567"
                    change="+23.1%"
                    changeType="up"
                    icon={Package}
                />
                <StatCard
                    title="今日订单"
                    value="42"
                    change="-5.2%"
                    changeType="down"
                    icon={ShoppingCart}
                />
            </div>

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 流量统计 */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">流量统计</h3>
                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:border-primary">
                            <option>最近 7 天</option>
                            <option>最近 30 天</option>
                            <option>最近 90 天</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-center justify-center text-slate-400">
                        <Activity className="w-8 h-8 mr-2" />
                        <span>图表加载中...</span>
                    </div>
                </div>

                {/* 订单趋势 */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">订单趋势</h3>
                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 focus:outline-none focus:border-primary">
                            <option>最近 7 天</option>
                            <option>最近 30 天</option>
                            <option>最近 90 天</option>
                        </select>
                    </div>
                    <div className="h-64 flex items-center justify-center text-slate-400">
                        <Activity className="w-8 h-8 mr-2" />
                        <span>图表加载中...</span>
                    </div>
                </div>
            </div>

            {/* 最近活动 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">最近活动</h3>
                <div className="space-y-4">
                    {[
                        { action: '新用户注册', user: 'user@example.com', time: '2 分钟前' },
                        { action: '订单支付成功', user: 'buyer@example.com', time: '5 分钟前' },
                        { action: '节点状态变更', user: '香港节点 01', time: '15 分钟前' },
                        { action: '套餐购买', user: 'vip@example.com', time: '30 分钟前' },
                    ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition px-2 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{item.action}</p>
                                <p className="text-xs text-slate-500">{item.user}</p>
                            </div>
                            <span className="text-xs text-slate-400">{item.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
