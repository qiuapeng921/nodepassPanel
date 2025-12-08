import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Edit,
    Trash2,
    Ban,
    CheckCircle,
    RefreshCw,
    X,
    Save,
    DollarSign,
    RotateCcw
} from 'lucide-react';
import api from '../../lib/api';

interface User {
    id: number;
    email: string;
    balance: number;
    upload: number;
    download: number;
    transfer_enable: number;
    status: number;
    is_admin: boolean;
    group_id: number;
    expired_at: string | null;
    created_at: string;
}

interface UserListResponse {
    list: User[];
    total: number;
    page: number;
    page_size: number;
}

interface UserFormData {
    email: string;
    password: string;
    balance: number;
    transfer_enable: number;
    status: number;
    is_admin: boolean;
    group_id: number;
    expired_at: string;
}

// 格式化流量
function formatTraffic(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// 用户管理页面
export default function UsersPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserFormData>({
        email: '',
        password: '',
        balance: 0,
        transfer_enable: 0,
        status: 1,
        is_admin: false,
        group_id: 0,
        expired_at: '',
    });
    const [saving, setSaving] = useState(false);
    const [showChargeModal, setShowChargeModal] = useState(false);
    const [chargeAmount, setChargeAmount] = useState(0);
    const [chargeUserId, setChargeUserId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [showBatchChargeModal, setShowBatchChargeModal] = useState(false);

    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery<{ data: UserListResponse }>({
        queryKey: ['admin-users', page, search],
        queryFn: () => api.get('/admin/users', {
            params: { page, page_size: 20, search }
        }).then(res => res.data),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<UserFormData> }) =>
            api.put(`/admin/users/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            handleCloseModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    });

    const banMutation = useMutation({
        mutationFn: (id: number) => api.post(`/admin/users/${id}/ban`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    });

    const unbanMutation = useMutation({
        mutationFn: (id: number) => api.post(`/admin/users/${id}/unban`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    });

    const chargeMutation = useMutation({
        mutationFn: ({ id, amount }: { id: number; amount: number }) =>
            api.post(`/admin/users/${id}/charge`, { amount }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setShowChargeModal(false);
            setChargeAmount(0);
            setChargeUserId(null);
        },
    });

    const resetTrafficMutation = useMutation({
        mutationFn: (id: number) => api.post(`/admin/users/${id}/reset-traffic`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    });

    // 批量操作 Mutations
    const batchBanMutation = useMutation({
        mutationFn: (ids: number[]) => api.post('/admin/users/batch/ban', { ids }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setSelectedIds([]);
        },
    });

    const batchUnbanMutation = useMutation({
        mutationFn: (ids: number[]) => api.post('/admin/users/batch/unban', { ids }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setSelectedIds([]);
        },
    });

    const batchDeleteMutation = useMutation({
        mutationFn: (ids: number[]) => api.post('/admin/users/batch/delete', { ids }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setSelectedIds([]);
        },
    });

    const batchChargeMutation = useMutation({
        mutationFn: ({ ids, amount }: { ids: number[]; amount: number }) =>
            api.post('/admin/users/batch/charge', { ids, amount }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setSelectedIds([]);
            setShowBatchChargeModal(false);
            setChargeAmount(0);
        },
    });

    const batchResetTrafficMutation = useMutation({
        mutationFn: (ids: number[]) => api.post('/admin/users/batch/reset-traffic', { ids }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            setSelectedIds([]);
        },
    });

    const users = data?.data?.list || [];
    const total = data?.data?.total || 0;
    const totalPages = Math.ceil(total / 20);

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    // 打开编辑模态框
    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '',
            balance: user.balance,
            transfer_enable: user.transfer_enable / 1024 / 1024 / 1024, // 转换为 GB
            status: user.status,
            is_admin: user.is_admin,
            group_id: user.group_id,
            expired_at: user.expired_at ? user.expired_at.split('T')[0] : '',
        });
        setShowModal(true);
    };

    // 关闭模态框
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setSaving(false);
    };

    // 提交表单
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setSaving(true);

        try {
            const updateData: Record<string, unknown> = {
                balance: formData.balance,
                transfer_enable: formData.transfer_enable * 1024 * 1024 * 1024, // GB 转 bytes
                status: formData.status,
                is_admin: formData.is_admin,
                group_id: formData.group_id,
            };

            if (formData.password) {
                updateData.password = formData.password;
            }

            if (formData.expired_at) {
                updateData.expired_at = formData.expired_at + 'T23:59:59Z';
            }

            await updateMutation.mutateAsync({ id: editingUser.id, data: updateData as Partial<UserFormData> });
        } catch (error) {
            console.error('保存失败:', error);
            setSaving(false);
        }
    };

    // 删除用户
    const handleDelete = (user: User) => {
        if (confirm(`确定要删除用户 "${user.email}" 吗？此操作不可恢复！`)) {
            deleteMutation.mutate(user.id);
        }
    };

    // 打开充值模态框
    const handleOpenCharge = (user: User) => {
        setChargeUserId(user.id);
        setChargeAmount(0);
        setShowChargeModal(true);
    };

    // 批量操作处理
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(users.map(u => u.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelect = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBatchDelete = () => {
        if (confirm(`确定要删除选中的 ${selectedIds.length} 个用户吗？此操作不可恢复！`)) {
            batchDeleteMutation.mutate(selectedIds);
        }
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">用户管理</h1>
                    <p className="text-slate-500 mt-1">管理系统中的所有用户</p>
                </div>
            </div>

            {/* 搜索和工具栏 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="搜索用户名、邮箱..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition border border-slate-200"
                        >
                            搜索
                        </button>
                        <button
                            onClick={() => refetch()}
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition border border-slate-200"
                            title="刷新"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 批量操作工具栏 */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-xl animate-fade-in">
                        <span className="text-sm text-slate-600">
                            已选择 <span className="font-bold text-primary">{selectedIds.length}</span> 个用户
                        </span>
                        <div className="h-4 w-px bg-slate-200" />
                        <button
                            onClick={() => batchUnbanMutation.mutate(selectedIds)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="批量启用"
                        >
                            <CheckCircle className="w-4 h-4" />
                            启用
                        </button>
                        <button
                            onClick={() => batchBanMutation.mutate(selectedIds)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition"
                            title="批量禁用"
                        >
                            <Ban className="w-4 h-4" />
                            禁用
                        </button>
                        <button
                            onClick={() => setShowBatchChargeModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="批量充值"
                        >
                            <DollarSign className="w-4 h-4" />
                            充值
                        </button>
                        <button
                            onClick={() => batchResetTrafficMutation.mutate(selectedIds)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="批量重置流量"
                        >
                            <RotateCcw className="w-4 h-4" />
                            重置流量
                        </button>
                        <button
                            onClick={handleBatchDelete}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="批量删除"
                        >
                            <Trash2 className="w-4 h-4" />
                            删除
                        </button>
                    </div>
                )}
            </div>

            {/* 用户列表 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={users.length > 0 && selectedIds.length === users.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                </th>
                                <th className="px-6 py-4">用户信息</th>
                                <th className="px-6 py-4">余额/流量</th>
                                <th className="px-6 py-4">状态</th>
                                <th className="px-6 py-4">到期时间</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        暂无用户
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(user.id)}
                                                onChange={() => handleSelect(user.id)}
                                                className="rounded border-slate-300 text-primary focus:ring-primary"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{user.email}</div>
                                                    <div className="text-slate-500 text-xs">ID: {user.id}</div>
                                                </div>
                                                {user.is_admin && (
                                                    <span className="px-1.5 py-0.5 text-xs bg-yellow-50 text-yellow-600 border border-yellow-100 rounded">
                                                        管理员
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="text-slate-900 font-medium">¥{user.balance.toFixed(2)}</div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span>{formatTraffic(user.upload + user.download)} / {formatTraffic(user.transfer_enable)}</span>
                                                </div>
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
                                                        style={{
                                                            width: `${Math.min(100, ((user.upload + user.download) / user.transfer_enable) * 100)}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.status === 1 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-50 text-green-600 rounded-full border border-green-100">
                                                    <CheckCircle className="w-3 h-3" />
                                                    正常
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-50 text-red-600 rounded-full border border-red-100">
                                                    <Ban className="w-3 h-3" />
                                                    已禁用
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {user.expired_at
                                                ? new Date(user.expired_at).toLocaleDateString('zh-CN')
                                                : '永久'
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenCharge(user)}
                                                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                                    title="充值"
                                                >
                                                    <DollarSign className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => resetTrafficMutation.mutate(user.id)}
                                                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                                    title="重置流量"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                                {user.status === 1 ? (
                                                    <button
                                                        onClick={() => banMutation.mutate(user.id)}
                                                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition hover:text-orange-600"
                                                        title="禁用"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => unbanMutation.mutate(user.id)}
                                                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition hover:text-green-600"
                                                        title="解禁"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                                    title="编辑"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition"
                                                    title="删除"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 分页 */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                        <p className="text-sm text-slate-500">
                            共 {total} 条记录
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                上一页
                            </button>
                            <span className="text-sm text-slate-500">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                下一页
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 编辑用户模态框 */}
            {showModal && editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-lg font-semibold text-slate-900">
                                编辑用户
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">新密码 (留空不修改)</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    placeholder="留空不修改密码"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">余额 (元)</label>
                                    <input
                                        type="number"
                                        value={formData.balance}
                                        onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                                        min={0}
                                        step={0.01}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">流量额度 (GB)</label>
                                    <input
                                        type="number"
                                        value={formData.transfer_enable}
                                        onChange={(e) => setFormData({ ...formData, transfer_enable: Number(e.target.value) })}
                                        min={0}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">用户组 ID</label>
                                    <input
                                        type="number"
                                        value={formData.group_id}
                                        onChange={(e) => setFormData({ ...formData, group_id: Number(e.target.value) })}
                                        min={0}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">到期时间</label>
                                    <input
                                        type="date"
                                        value={formData.expired_at}
                                        onChange={(e) => setFormData({ ...formData, expired_at: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <label className="text-sm font-medium text-slate-700">管理员权限</label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_admin: !formData.is_admin })}
                                    className={`relative w-12 h-6 rounded-full transition ${formData.is_admin ? 'bg-primary' : 'bg-slate-200'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${formData.is_admin ? 'left-7' : 'left-1'
                                        }`} />
                                </button>
                            </div>

                            {/* 模态框底部 */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? '保存中...' : '保存'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 充值模态框 */}
            {showChargeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-xl">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">用户充值</h3>
                            <input
                                type="number"
                                autoFocus
                                value={chargeAmount}
                                onChange={(e) => setChargeAmount(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary mb-4"
                                placeholder="输入金额"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowChargeModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => {
                                        if (chargeUserId) {
                                            chargeMutation.mutate({ id: chargeUserId, amount: chargeAmount });
                                        }
                                    }}
                                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
                                >
                                    确认
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 批量充值模态框 */}
            {showBatchChargeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-xl">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">批量充值</h3>
                            <p className="text-slate-500 text-sm mb-4">
                                将为选中的 {selectedIds.length} 位用户充值。
                            </p>
                            <input
                                type="number"
                                autoFocus
                                value={chargeAmount}
                                onChange={(e) => setChargeAmount(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary mb-4"
                                placeholder="输入金额"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowBatchChargeModal(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={() => batchChargeMutation.mutate({ ids: selectedIds, amount: chargeAmount })}
                                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
                                >
                                    确认
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
