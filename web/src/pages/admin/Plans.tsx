import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Package,
    EyeOff,
    X,
    Save
} from 'lucide-react';
import api from '../../lib/api';

interface Plan {
    id: number;
    name: string;
    description: string;
    price: number;
    duration: number;
    transfer: number;
    speed_limit: number;
    device_limit: number;
    group_id: number;
    hidden: boolean;
    sort: number;
    created_at: string;
}

interface PlanFormData {
    name: string;
    description: string;
    price: number;
    duration: number;
    transfer: number;
    speed_limit: number;
    device_limit: number;
    group_id: number;
    hidden: boolean;
    sort: number;
}

const defaultFormData: PlanFormData = {
    name: '',
    description: '',
    price: 0,
    duration: 30,
    transfer: 100,
    speed_limit: 0,
    device_limit: 0,
    group_id: 0,
    hidden: false,
    sort: 0,
};

// 套餐管理页面
export default function PlansPage() {
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
    const [saving, setSaving] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery<{ data: Plan[] }>({
        queryKey: ['admin-plans'],
        queryFn: () => api.get('/admin/plans').then(res => res.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: PlanFormData) => api.post('/admin/plans', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
            handleCloseModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: PlanFormData }) =>
            api.put(`/admin/plans/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
            handleCloseModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/plans/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
        },
    });

    const plans = data?.data || [];

    // 打开编辑模态框
    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            description: plan.description,
            price: plan.price,
            duration: plan.duration,
            transfer: plan.transfer,
            speed_limit: plan.speed_limit,
            device_limit: plan.device_limit,
            group_id: plan.group_id,
            hidden: plan.hidden,
            sort: plan.sort,
        });
        setShowModal(true);
    };

    // 打开新建模态框
    const handleCreate = () => {
        setEditingPlan(null);
        setFormData(defaultFormData);
        setShowModal(true);
    };

    // 关闭模态框
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPlan(null);
        setFormData(defaultFormData);
        setSaving(false);
    };

    // 提交表单
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingPlan) {
                await updateMutation.mutateAsync({ id: editingPlan.id, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
        } catch (error) {
            console.error('保存失败:', error);
            setSaving(false);
        }
    };

    // 删除套餐
    const handleDelete = (plan: Plan) => {
        if (confirm(`确定要删除套餐 "${plan.name}" 吗？此操作不可恢复！`)) {
            deleteMutation.mutate(plan.id);
        }
    };

    // 格式化流量
    const formatTraffic = (gb: number) => {
        if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
        return `${gb} GB`;
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">套餐管理</h1>
                    <p className="text-slate-500 mt-1">管理订阅套餐和定价</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>添加套餐</span>
                </button>
            </div>

            {/* 工具栏 */}
            <div className="flex items-center justify-end gap-4">
                <button
                    onClick={() => refetch()}
                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition shadow-sm"
                    title="刷新"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* 套餐列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        加载中...
                    </div>
                ) : plans.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>暂无套餐</p>
                        <button
                            onClick={handleCreate}
                            className="mt-4 text-primary hover:underline"
                        >
                            创建第一个套餐
                        </button>
                    </div>
                ) : (
                    plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`bg-white border rounded-xl p-5 transition shadow-sm ${plan.hidden ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:border-primary/50'
                                }`}
                        >
                            {/* 套餐头部 */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-900">{plan.name}</h3>
                                        {plan.hidden && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">
                                                <EyeOff className="w-3 h-3" />
                                                隐藏
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                        {plan.description || '暂无描述'}
                                    </p>
                                </div>
                            </div>

                            {/* 价格 */}
                            <div className="mb-4">
                                <span className="text-3xl font-bold text-slate-900">¥{plan.price}</span>
                                <span className="text-slate-500">/{plan.duration}天</span>
                            </div>

                            {/* 套餐详情 */}
                            <div className="space-y-2 mb-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">流量</span>
                                    <span className="text-slate-900">{formatTraffic(plan.transfer)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">速度限制</span>
                                    <span className="text-slate-900">
                                        {plan.speed_limit > 0 ? `${plan.speed_limit} Mbps` : '无限制'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">设备数</span>
                                    <span className="text-slate-900">
                                        {plan.device_limit > 0 ? `${plan.device_limit} 台` : '无限制'}
                                    </span>
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
                                <button
                                    onClick={() => handleEdit(plan)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
                                >
                                    <Edit className="w-4 h-4" />
                                    编辑
                                </button>
                                <button
                                    onClick={() => handleDelete(plan)}
                                    className="p-2 bg-white border border-slate-200 hover:bg-red-50 text-red-600 hover:border-red-200 rounded-lg transition"
                                    title="删除"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 添加/编辑模态框 */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
                        {/* 模态框头部 */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {editingPlan ? '编辑套餐' : '添加套餐'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-900"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 表单 */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* 套餐名称 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    套餐名称 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    placeholder="例如: 月度套餐"
                                />
                            </div>

                            {/* 描述 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    描述
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary resize-none"
                                    placeholder="套餐描述信息"
                                />
                            </div>

                            {/* 价格和时长 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        价格 (元) <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        required
                                        min={0}
                                        step={0.01}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        时长 (天) <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                                        required
                                        min={1}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* 流量和速度限制 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        流量 (GB) <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.transfer}
                                        onChange={(e) => setFormData({ ...formData, transfer: Number(e.target.value) })}
                                        required
                                        min={0}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        速度限制 (Mbps)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.speed_limit}
                                        onChange={(e) => setFormData({ ...formData, speed_limit: Number(e.target.value) })}
                                        min={0}
                                        placeholder="0 表示不限制"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* 设备数和排序 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        设备限制
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.device_limit}
                                        onChange={(e) => setFormData({ ...formData, device_limit: Number(e.target.value) })}
                                        min={0}
                                        placeholder="0 表示不限制"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        排序权重
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.sort}
                                        onChange={(e) => setFormData({ ...formData, sort: Number(e.target.value) })}
                                        min={0}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* 隐藏开关 */}
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <label className="text-sm font-medium text-slate-300">隐藏套餐</label>
                                    <p className="text-xs text-slate-500">隐藏后前台不显示此套餐</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, hidden: !formData.hidden })}
                                    className={`relative w-12 h-6 rounded-full transition ${formData.hidden ? 'bg-primary' : 'bg-slate-700'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${formData.hidden ? 'left-7' : 'left-1'
                                        }`} />
                                </button>
                            </div>

                            {/* 提交按钮 */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition"
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
        </div>
    );
}
