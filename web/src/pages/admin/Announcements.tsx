import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Megaphone,
    Send,
    Archive,
    X,
    Save
} from 'lucide-react';
import api from '../../lib/api';

interface Announcement {
    id: number;
    title: string;
    content: string;
    tags: string;
    priority: number;
    popup: boolean;
    status: number;
    published_at: string | null;
    expired_at: string | null;
    created_at: string;
}

interface AnnouncementFormData {
    title: string;
    content: string;
    tags: string;
    priority: number;
    popup: boolean;
}

const defaultFormData: AnnouncementFormData = {
    title: '',
    content: '',
    tags: '',
    priority: 0,
    popup: false,
};

const statusConfig: Record<number, { label: string; color: string }> = {
    0: { label: '草稿', color: 'text-slate-400 bg-slate-500/20' },
    1: { label: '已发布', color: 'text-green-400 bg-green-500/20' },
    2: { label: '已下线', color: 'text-red-400 bg-red-500/20' },
};

// 公告管理页面
export default function AnnouncementsPage() {
    const [showModal, setShowModal] = useState(false);
    const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
    const [formData, setFormData] = useState<AnnouncementFormData>(defaultFormData);
    const [saving, setSaving] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery<{ data: Announcement[] }>({
        queryKey: ['admin-announcements'],
        queryFn: () => api.get('/admin/announcements').then(res => res.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: AnnouncementFormData) => api.post('/admin/announcements', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
            handleCloseModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: AnnouncementFormData }) =>
            api.put(`/admin/announcements/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
            handleCloseModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/announcements/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }),
    });

    const publishMutation = useMutation({
        mutationFn: (id: number) => api.post(`/admin/announcements/${id}/publish`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }),
    });

    const offlineMutation = useMutation({
        mutationFn: (id: number) => api.post(`/admin/announcements/${id}/offline`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-announcements'] }),
    });

    const announcements = data?.data || [];

    // 打开编辑模态框
    const handleEdit = (ann: Announcement) => {
        setEditingAnn(ann);
        setFormData({
            title: ann.title,
            content: ann.content,
            tags: ann.tags,
            priority: ann.priority,
            popup: ann.popup,
        });
        setShowModal(true);
    };

    // 打开新建模态框
    const handleCreate = () => {
        setEditingAnn(null);
        setFormData(defaultFormData);
        setShowModal(true);
    };

    // 关闭模态框
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingAnn(null);
        setFormData(defaultFormData);
        setSaving(false);
    };

    // 提交表单
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingAnn) {
                await updateMutation.mutateAsync({ id: editingAnn.id, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
        } catch (error) {
            console.error('保存失败:', error);
            setSaving(false);
        }
    };

    // 删除公告
    const handleDelete = (ann: Announcement) => {
        if (confirm(`确定要删除公告 "${ann.title}" 吗？`)) {
            deleteMutation.mutate(ann.id);
        }
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">公告管理</h1>
                    <p className="text-slate-500 mt-1">管理系统公告和通知</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>发布公告</span>
                </button>
            </div>

            {/* 工具栏 */}
            <div className="flex items-center justify-end gap-4">
                <button
                    onClick={() => refetch()}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* 公告列表 */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-slate-500">加载中...</div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>暂无公告</p>
                        <button
                            onClick={handleCreate}
                            className="mt-4 text-primary hover:underline"
                        >
                            发布第一条公告
                        </button>
                    </div>
                ) : (
                    announcements.map((ann) => {
                        const status = statusConfig[ann.status] || statusConfig[0];
                        return (
                            <div
                                key={ann.id}
                                className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-white text-lg">{ann.title}</h3>
                                            <span className={`px-2 py-0.5 text-xs rounded ${status.color}`}>
                                                {status.label}
                                            </span>
                                            {ann.popup && (
                                                <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
                                                    弹窗
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                                            {ann.content.replace(/<[^>]*>/g, '').slice(0, 200)}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>创建于 {new Date(ann.created_at).toLocaleDateString('zh-CN')}</span>
                                            {ann.published_at && (
                                                <span>发布于 {new Date(ann.published_at).toLocaleDateString('zh-CN')}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {ann.status === 0 && (
                                            <button
                                                onClick={() => publishMutation.mutate(ann.id)}
                                                disabled={publishMutation.isPending}
                                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                                                title="发布"
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        )}
                                        {ann.status === 1 && (
                                            <button
                                                onClick={() => offlineMutation.mutate(ann.id)}
                                                disabled={offlineMutation.isPending}
                                                className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50"
                                                title="下线"
                                            >
                                                <Archive className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(ann)}
                                            className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ann)}
                                            className="p-2 bg-slate-800 hover:bg-red-600 text-white rounded-lg transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 添加/编辑模态框 */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
                        {/* 模态框头部 */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">
                                {editingAnn ? '编辑公告' : '发布公告'}
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
                            {/* 标题 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    标题 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                    placeholder="公告标题"
                                />
                            </div>

                            {/* 内容 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    内容 <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                    rows={8}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary resize-none"
                                    placeholder="支持 Markdown 格式"
                                />
                            </div>

                            {/* 标签和优先级 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        标签
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tags}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                        placeholder="多个标签用逗号分隔"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        优先级
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                                        min={0}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                                        placeholder="数值越大越靠前"
                                    />
                                </div>
                            </div>

                            {/* 弹窗开关 */}
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <label className="text-sm font-medium text-slate-300">弹窗显示</label>
                                    <p className="text-xs text-slate-500">用户登录后以弹窗形式显示</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, popup: !formData.popup })}
                                    className={`relative w-12 h-6 rounded-full transition ${formData.popup ? 'bg-primary' : 'bg-slate-700'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${formData.popup ? 'left-7' : 'left-1'
                                        }`} />
                                </button>
                            </div>

                            {/* 提交按钮 */}
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
        </div>
    );
}
