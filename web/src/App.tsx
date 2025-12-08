import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

// 管理员布局和页面
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsersPage from './pages/admin/Users';
import AdminNodesPage from './pages/admin/Nodes';
import AdminPlansPage from './pages/admin/Plans';
import AdminOrdersPage from './pages/admin/Orders';
import AnnouncementsPage from './pages/admin/Announcements';
import AdminSettingsPage from './pages/admin/Settings';
import AdminRechargeCodesPage from './pages/admin/RechargeCodes';
import AdminCouponsPage from './pages/admin/Coupons';

// 用户布局和页面
import UserLayout from './layouts/UserLayout';
import UserDashboard from './pages/user/Dashboard';
import UserPlansPage from './pages/user/Plans';
import UserOrdersPage from './pages/user/Orders';
import UserSettingsPage from './pages/user/Settings';
import UserInvitePage from './pages/user/Invite';
import UserRechargePage from './pages/user/Recharge';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<Login />} />

        {/* 用户面板 */}
        <Route path="/dashboard" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="plans" element={<UserPlansPage />} />
          <Route path="orders" element={<UserOrdersPage />} />
          <Route path="invite" element={<UserInvitePage />} />
          <Route path="recharge" element={<UserRechargePage />} />
          <Route path="settings" element={<UserSettingsPage />} />
        </Route>

        {/* 管理员面板 */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="nodes" element={<AdminNodesPage />} />
          <Route path="plans" element={<AdminPlansPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="recharge-codes" element={<AdminRechargeCodesPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
        </Route>

        {/* 默认重定向到用户面板 */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
