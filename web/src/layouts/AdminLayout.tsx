import { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Server,
    Package,
    Megaphone,
    Settings,
    ShoppingCart,
    Menu,
    X,
    LogOut,
    ChevronDown,
    Ticket,
    Tag
} from 'lucide-react';
import { clsx } from 'clsx';

// 导航菜单配置
const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: '仪表盘', end: true },
    { path: '/admin/users', icon: Users, label: '用户管理' },
    { path: '/admin/nodes', icon: Server, label: '节点管理' },
    { path: '/admin/plans', icon: Package, label: '套餐管理' },
    { path: '/admin/orders', icon: ShoppingCart, label: '订单管理' },
    { path: '/admin/recharge-codes', icon: Ticket, label: '充值卡密' },
    { path: '/admin/coupons', icon: Tag, label: '优惠券' },
    { path: '/admin/announcements', icon: Megaphone, label: '公告管理' },
    { path: '/admin/settings', icon: Settings, label: '系统设置' },
];

// 侧边栏导航项
function NavItem({ item, collapsed }: { item: typeof navItems[0]; collapsed: boolean }) {
    const location = useLocation();
    const isActive = item.end
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path);

    return (
        <Link
            to={item.path}
            className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-white/10',
                isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-slate-300 hover:text-white'
            )}
        >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">{item.label}</span>}
        </Link>
    );
}

// 管理面板布局
export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // 检查登录状态
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const user = userInfo ? JSON.parse(userInfo) : null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-slate-950">
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
                    'fixed top-0 left-0 z-50 h-full bg-slate-900 border-r border-slate-800',
                    'transition-all duration-300 ease-in-out',
                    collapsed ? 'w-20' : 'w-64',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
                    {!collapsed && (
                        <Link to="/admin" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">N</span>
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                NyanPass
                            </span>
                        </Link>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition hidden lg:block"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition lg:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 导航菜单 */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavItem key={item.path} item={item} collapsed={collapsed} />
                    ))}
                </nav>

                {/* 用户信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
                    <div className={clsx(
                        'flex items-center gap-3',
                        collapsed && 'justify-center'
                    )}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium">
                                {user?.email?.[0]?.toUpperCase() || 'A'}
                            </span>
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {user?.email || 'Admin'}
                                </p>
                                <p className="text-xs text-slate-400">管理员</p>
                            </div>
                        )}
                        {!collapsed && (
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition"
                                title="退出登录"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
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
                <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
                    <div className="flex items-center justify-between h-full px-4 lg:px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition lg:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="flex-1" />

                        {/* 用户下拉菜单（桌面端） */}
                        <div className="hidden lg:flex items-center gap-4">
                            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {user?.email?.[0]?.toUpperCase() || 'A'}
                                    </span>
                                </div>
                                <span className="text-sm text-slate-300">{user?.email || 'Admin'}</span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </button>
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
