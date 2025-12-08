import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Settings,
    Menu,
    X,
    LogOut,
    Zap,
    Copy,
    Check,
    Gift,
    CreditCard
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../lib/api';

// 导航菜单配置
const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: '仪表盘', end: true },
    { path: '/dashboard/plans', icon: Package, label: '购买套餐' },
    { path: '/dashboard/orders', icon: ShoppingCart, label: '我的订单' },
    { path: '/dashboard/recharge', icon: CreditCard, label: '账户充值' },
    { path: '/dashboard/invite', icon: Gift, label: '邀请返利' },
    { path: '/dashboard/settings', icon: Settings, label: '个人设置' },
];

// 侧边栏导航项
function NavItem({ item, collapsed, onClick }: {
    item: typeof navItems[0];
    collapsed: boolean;
    onClick?: () => void;
}) {
    const location = useLocation();
    const isActive = item.end
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path);

    return (
        <Link
            to={item.path}
            onClick={onClick}
            className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
        >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{item.label}</span>}
        </Link>
    );
}

// 用户面板布局
export default function UserLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [copied, setCopied] = useState(false);

    // 获取站点设置
    const { data: settings } = useQuery<{ data: Record<string, string> }>({
        queryKey: ['public-settings'],
        queryFn: () => api.get('/settings').then(res => res.data),
    });

    const siteName = settings?.data?.site_name || 'NyanPass';

    // 更新页面标题
    useEffect(() => {
        document.title = siteName;
    }, [siteName]);

    // 检查登录状态
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const user = userInfo ? JSON.parse(userInfo) : null;

    // 如果是管理员，显示切换到管理面板的入口
    const isAdmin = user?.is_admin;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
    };

    // 复制订阅链接
    const handleCopySubscribe = async () => {
        const subscribeUrl = `${window.location.origin}/api/v1/client/subscribe/${user?.subscribe_token || ''}`;
        try {
            await navigator.clipboard.writeText(subscribeUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('复制失败:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* 移动端遮罩 */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* 侧边栏 */}
            <aside
                className={clsx(
                    'fixed top-0 left-0 z-50 h-full bg-white border-r border-slate-200',
                    'transition-all duration-300 ease-in-out',
                    collapsed ? 'w-20' : 'w-64',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100">
                    {!collapsed && (
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="text-white font-bold text-sm">N</span>
                            </div>
                            <span className="text-lg font-bold text-slate-900">
                                {siteName}
                            </span>
                        </Link>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition hidden lg:block"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition lg:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 导航菜单 */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavItem
                            key={item.path}
                            item={item}
                            collapsed={collapsed}
                            onClick={() => setSidebarOpen(false)}
                        />
                    ))}
                </nav>

                {/* 快捷订阅 */}
                {!collapsed && (
                    <div className="absolute bottom-24 left-0 right-0 px-4">
                        <button
                            onClick={handleCopySubscribe}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition shadow-lg shadow-primary/25"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>已复制订阅链接</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>复制订阅链接</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* 用户信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
                    <div className={clsx(
                        'flex items-center gap-3',
                        collapsed && 'justify-center'
                    )}>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-medium">
                                {user?.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                    {user?.email || 'User'}
                                </p>
                                <p className="text-xs text-slate-500">普通用户</p>
                            </div>
                        )}
                        {!collapsed && (
                            <div className="flex items-center gap-1">
                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition"
                                        title="管理后台"
                                    >
                                        <Zap className="w-4 h-4" />
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                                    title="退出登录"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* 主内容区 */}
            <main
                className={clsx(
                    'min-h-screen transition-all duration-300',
                    collapsed ? 'lg:pl-20' : 'lg:pl-64'
                )}
            >
                {/* 顶部栏 */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                    <div className="flex items-center justify-between h-full px-4 lg:px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition lg:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="flex-1" />

                        {/* 快速操作 */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleCopySubscribe}
                                className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>已复制</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        <span>复制订阅</span>
                                    </>
                                )}
                            </button>

                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition"
                                >
                                    <Zap className="w-4 h-4" />
                                    <span>管理后台</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                {/* 页面内容 */}
                <div className="p-4 lg:p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
