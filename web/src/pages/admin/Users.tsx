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
                    <h1 className="text-2xl font-bold text-white">用户管理</h1>
                    <p className="text-slate-400 mt-1">管理系统中的所有用户</p>
                </div>
            </div>

            {/* 搜索和工具栏 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="搜索邮箱..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                    >
                        搜索
                    </button>
                    <button
                        onClick={() => refetch()}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                        title="刷新"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* 批量操作工具栏 */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg animate-fade-in px-4">
                        <span className="text-sm text-slate-300 mr-2">
                            已选 {selectedIds.length} 项
                        </span>
                        <div className="h-4 w-px bg-slate-700 mx-2" />
                        <button
                            onClick={() => batchUnbanMutation.mutate(selectedIds)}
                            className="p-2 hover:bg-slate-700 rounded transition text-green-400"
                            title="批量启用"
                        >
                            <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => batchBanMutation.mutate(selectedIds)}
                            className="p-2 hover:bg-slate-700 rounded transition text-orange-400"
                            title="批量禁用"
                        >
                            <Ban className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowBatchChargeModal(true)}
                            className="p-2 hover:bg-slate-700 rounded transition text-blue-400"
                            title="批量充值"
                        >
                            <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => batchResetTrafficMutation.mutate(selectedIds)}
                            className="p-2 hover:bg-slate-700 rounded transition text-purple-400"
                            title="批量重置流量"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <div className="h-4 w-px bg-slate-700 mx-2" />
                        <button
                            onClick={handleBatchDelete}
                            className="p-2 hover:bg-red-900/50 rounded transition text-red-400"
                            title="批量删除"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* 用户列表 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={users.length > 0 && selectedIds.length === users.length}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-offset-slate-900"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">用户</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">余额</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">流量使用</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">状态</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">到期时间</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        加载中...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        暂无数据
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-800/50 transition">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(user.id)}
                                                onChange={() => handleSelect(user.id)}
                                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-offset-slate-900"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                                                    <span className="text-white font-medium">
                                                        {user.email[0].toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-white">{user.email}</p>
                                                    <p className="text-xs text-slate-500">ID: {user.id}</p>
                                                </div>
                                                {user.is_admin && (
                                                    <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                                                        管理员
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-white">¥{user.balance.toFixed(2)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <p className="text-sm text-white">
                                                    {formatTraffic(user.upload + user.download)} / {formatTraffic(user.transfer_enable)}
                                                </p>
                                                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
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
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                                                    <CheckCircle className="w-3 h-3" />
                                                    正常
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                                                    <Ban className="w-3 h-3" />
                                                    已禁用
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-400">
                                                {user.expired_at
                                                    ? new Date(user.expired_at).toLocaleDateString('zh-CN')
                                                    : '永久'
                                                }
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenCharge(user)}
                                                    className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-green-400"
                                                    title="充值"
                                                >
                                                    <DollarSign className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => resetTrafficMutation.mutate(user.id)}
                                                    className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-blue-400"
                                                    title="重置流量"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                                {user.status === 1 ? (
                                                    <button
                                                        onClick={() => banMutation.mutate(user.id)}
                                                        className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-orange-400"
                                                        title="禁用"
                                                    >
                                                        <Ban className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => unbanMutation.mutate(user.id)}
                                                        className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-green-400"
                                                        title="解禁"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-white"
                                                    title="编辑"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-red-400"
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
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
                        <p className="text-sm text-slate-400">
                            共 {total} 条记录
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                上一页
                            </button>
                            <span className="text-sm text-slate-400">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <h3 className="text-lg font-semibold text-white">
                                编辑用户
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">邮箱</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">新密码 (留空不修改)</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                    placeholder="留空不修改密码"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">余额 (元)</label>
                                    <input
                                        type="number"
                                        value={formData.balance}
                                        onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                                        min={0}
                                        step={0.01}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">流量额度 (GB)</label>
                                    <input
                                        type="number"
                                        value={formData.transfer_enable}
                                        onChange={(e) => setFormData({ ...formData, transfer_enable: Number(e.target.value) })}
                                        min={0}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">用户组 ID</label>
                                    <input
                                        type="number"
                                        value={formData.group_id}
                                        onChange={(e) => setFormData({ ...formData, group_id: Number(e.target.value) })}
                                        min={0}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">到期时间</label>
                                    <input
                                        type="date"
                                        value={formData.expired_at}
                                        onChange={(e) => setFormData({ ...formData, expired_at: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <label className="text-sm font-medium text-slate-300">管理员权限</label>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, is_admin: !formData.is_admin })}
                                    className={`relative w-12 h-6 rounded-full transition ${formData.is_admin ? 'bg-primary' : 'bg-slate-700'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${formData.is_admin ? 'left-7' : 'left-1'
                                        }`} />
                                </button>
                            </div>

                            {/* 模态框底部 */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
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
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">用户充值</h3>
                            <input
                                type="number"
                                autoFocus
                                value={chargeAmount}
                                onChange={(e) => setChargeAmount(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary mb-4"
                                placeholder="输入金额"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowChargeModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
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
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">批量充值</h3>
                            <p className="text-slate-400 text-sm mb-4">
                                将为选中的 {selectedIds.length} 位用户充值。
                            </p>
                            <input
                                type="number"
                                autoFocus
                                value={chargeAmount}
                                onChange={(e) => setChargeAmount(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary mb-4"
                                placeholder="输入金额"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowBatchChargeModal(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
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
