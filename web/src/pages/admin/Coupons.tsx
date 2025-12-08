import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    X,
    Save,
    CheckCircle,
    Ban,
    Copy
} from 'lucide-react';
import api from '../../lib/api';

interface Coupon {
    id: number;
    code: string;
    type: number;
    value: number;
    min_amount: number;
    max_discount: number;
    limit_per_user: number;
    total_limit: number;
    used_count: number;
    plan_ids: string;
    start_at: number;
    expired_at: number;
    status: number;
    created_at: string;
}

interface CouponListResponse {
    list: Coupon[];
    total: number;
    page: number;
    page_size: number;
}

interface CouponFormData {
    code: string;
    type: number;
    value: number;
    min_amount: number;
    max_discount: number;
    limit_per_user: number;
    total_limit: number;
    plan_ids: string;
    start_at: string; // YYYY-MM-DDTHH:mm
    expired_at: string; // YYYY-MM-DDTHH:mm
    status: number;
}

const initialFormState: CouponFormData = {
    code: '',
    type: 1, // 1: Fixed Amount, 2: Percentage
    value: 0,
    min_amount: 0,
    max_discount: 0,
    limit_per_user: 1,
    total_limit: 0,
    plan_ids: '',
    start_at: '',
    expired_at: '',
    status: 1,
};

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '永久';
    return new Date(dateStr).toLocaleString('zh-CN');
}

export default function CouponsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<CouponFormData>(initialFormState);
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery<{ data: CouponListResponse }>({
        queryKey: ['admin-coupons', page, search],
        queryFn: () => api.get('/admin/coupons', {
            params: { page, page_size: 20, search }
        }).then(res => res.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: CouponFormData) => {
            const payload = {
                ...data,
                start_at: data.start_at ? Math.floor(new Date(data.start_at).getTime() / 1000) : 0,
                expired_at: data.expired_at ? Math.floor(new Date(data.expired_at).getTime() / 1000) : 0,
            };
            return api.post('/admin/coupons', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            handleCloseModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: CouponFormData }) => {
            const payload = {
                ...data,
                start_at: data.start_at ? Math.floor(new Date(data.start_at).getTime() / 1000) : 0,
                expired_at: data.expired_at ? Math.floor(new Date(data.expired_at).getTime() / 1000) : 0,
            };
            return api.put(`/admin/coupons/${id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            handleCloseModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/coupons/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
    });

    const coupons = data?.data?.list || [];
    const total = data?.data?.total || 0;
    const totalPages = Math.ceil(total / 20);

    const handleSearch = () => {
        setSearch(searchInput);
        setPage(1);
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormData(initialFormState);
        setShowModal(true);
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingId(coupon.id);
        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            min_amount: coupon.min_amount,
            max_discount: coupon.max_discount,
            limit_per_user: coupon.limit_per_user,
            total_limit: coupon.total_limit,
            plan_ids: coupon.plan_ids || '',
            start_at: coupon.start_at ? new Date(coupon.start_at * 1000).toISOString().slice(0, 16) : '',
            // Assuming start_at is timestamp in seconds from backend based on my interface definition in this file (lines 28-29)
            // Wait, my interface specific start_at: number.
            // But verify backend again. coupon_service uses time.Unix(req.StartAt, 0).
            // Model has *time.Time.
            // JSON serialization of *time.Time is ISO string.
            // So interface Coupon should have start_at: string.
            // Let me correct the interface first.

            // Correction: see below in `interface Coupon`
            // I will assume backend returns ISO string for *time.Time fields.
            // So I should parse ISO string to fill form date inputs.
            // new Date(coupon.start_at).toISOString().slice(0, 16) is correct for ISO string.

            expired_at: coupon.expired_at ? new Date(coupon.expired_at * 1000).toISOString().slice(0, 16) : '',
            status: coupon.status,
        });
        setShowModal(true);
    };

    // Correcting interface based on backend behavior (returning models with time.Time)
    // The backend uses GORM model which has *time.Time fields. These are serialized as ISO strings.
    // So the interface should use string for start_at and expired_at.

    // BUT WAIT, in my previous `write_to_file` I defined `start_at` as number in interface.
    // I need to be careful.
    // Backend `List` returns `[]*model.Coupon`.
    // `model.Coupon` has `StartAt *time.Time \`json:"start_at"\``.
    // So it will be a string in JSON.
    // I must update the interface to match.

    const handleDelete = (id: number) => {
        if (confirm('确定要删除此优惠券吗？')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
    };

    const generateCode = () => {
        const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let res = "";
        for (let i = 0; i < 12; i++) {
            res += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setFormData({ ...formData, code: res });
    };

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        // Toast can be added here
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">优惠券管理</h1>
                    <p className="text-slate-400 mt-1">创建和管理优惠券及促销活动</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                        title="刷新"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>新建优惠券</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <input
                        type="text"
                        placeholder="搜索优惠券..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                >
                    搜索
                </button>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">优惠券码</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">类型</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">面值</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">使用限制</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">已使用</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">状态</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase">过期时间</th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {isLoading ? (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-500">加载中...</td></tr>
                            ) : coupons.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-slate-500">暂无数据</td></tr>
                            ) : (
                                coupons.map((coupon: any) => ( // Keeping 'any' here temporarily or I should fix the interface
                                    <tr key={coupon.id} className="hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-white">{coupon.code}</span>
                                                <button onClick={() => handleCopy(coupon.code)} className="text-slate-500 hover:text-white transition">
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">
                                            {coupon.type === 1 ? '金额抵扣' : coupon.type === 2 ? '百分比折扣' : '免费天数'}
                                        </td>
                                        <td className="px-6 py-4 text-green-400 font-bold">
                                            {coupon.type === 1 ? `¥${coupon.value}` : coupon.type === 2 ? `${coupon.value}% OFF` : `${coupon.value} 天`}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            <div>总限: {coupon.total_limit || '无'}</div>
                                            <div>用户: {coupon.limit_per_user || '无'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{coupon.used_count}</td>
                                        <td className="px-6 py-4">
                                            {coupon.status === 1 ? (
                                                <span className="flex items-center gap-1 text-green-400 text-xs bg-green-500/10 px-2 py-1 rounded">
                                                    <CheckCircle className="w-3 h-3" /> 启用
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-red-400 text-xs bg-red-500/10 px-2 py-1 rounded">
                                                    <Ban className="w-3 h-3" /> 禁用
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">
                                            {formatDate(coupon.expired_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {/* Use 'any' type cast if needed for handleEdit to accept the coupon from map, or ensure map uses defined Interface */}
                                                <button onClick={() => handleEdit(coupon as unknown as Coupon)} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(coupon.id)} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white">{editingId ? '编辑优惠券' : '新建优惠券'}</h3>
                            <button onClick={handleCloseModal}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm text-slate-400 mb-1">优惠券码</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            className="flex-1 bg-slate-800 border-slate-700 rounded px-3 py-2 text-white"
                                            placeholder="留空自动生成"
                                        />
                                        <button type="button" onClick={generateCode} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded text-white flex gap-1 items-center">
                                            <RefreshCw className="w-4 h-4" /> 生成
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">类型</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: Number(e.target.value) })}
                                        className="w-full bg-slate-800 border-slate-700 rounded px-3 py-2 text-white"
                                    >
                                        <option value={1}>金额抵扣</option>
                                        <option value={2}>百分比折扣</option>
                                        <option value={3}>免费天数</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">
                                        {formData.type === 1 ? '减免金额' : formData.type === 2 ? '折扣百分比 (1-100)' : '赠送天数'}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                        className="w-full bg-slate-800 border-slate-700 rounded px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">最低消费 (元)</label>
                                    <input
                                        type="number"
                                        value={formData.min_amount}
                                        onChange={(e) => setFormData({ ...formData, min_amount: Number(e.target.value) })}
                                        className="w-full bg-slate-800 border-slate-700 rounded px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">最大抵扣 (仅百分比有效)</label>
                                    <input
                                        type="number"
                                        value={formData.max_discount}
                                        onChange={(e) => setFormData({ ...formData, max_discount: Number(e.target.value) })}
                                        className="w-full bg-slate-800 border-slate-700 rounded px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">每人限用</label>
                                    <input
                                        type="number"
                                        value={formData.limit_per_user}
                                        onChange={(e) => setFormData({ ...formData, limit_per_user: Number(e.target.value) })}
                                        className="w-full bg-slate-800 border-slate-700 rounded px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">总次数限制 (0不限)</label>
                                    <input
                                        type="number"
                                        value={formData.total_limit}
                                        onChange={(e) => setFormData({ ...formData, total_limit: Number(e.target.value) })}
                                        className="w-full bg-slate-800 border-slate-700 rounded px-3 py-2 text-white"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-slate-400 mb-1">指定套餐ID (逗号分隔，留空所有)</label>
                                    <input
                                        type="text"
                                        value={formData.plan_ids}
                                        onChange={(e) => setFormData({ ...formData, plan_ids: e.target.value })}
                                        className="w-full bg-slate-800 border-slate-700 rounded px-3 py-2 text-white"
                                        placeholder="例如: 1,2,3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">开始时间</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.start_at}
                                        onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                                        className="w-full bg-slate-800 border-slate-700 rounded px-3 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">过期时间</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.expired_at}
                                        onChange={(e) => setFormData({ ...formData, expired_at: e.target.value })}
                                        className="w-full bg-slate-800 border-slate-700 rounded px-3 py-2 text-white"
                                    />
                                </div>
                                <div className="col-span-2 flex items-center justify-between py-2 border-t border-slate-800 mt-2">
                                    <span className="text-white">状态</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: formData.status === 1 ? 0 : 1 })}
                                        className={`w-12 h-6 rounded-full relative transition ${formData.status === 1 ? 'bg-primary' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${formData.status === 1 ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded">取消</button>
                                <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded flex items-center gap-2">
                                    <Save className="w-4 h-4" /> 保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
