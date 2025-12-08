import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Server,
    Activity,
    Globe,
    CheckCircle,
    XCircle,
    X,
    Save
} from 'lucide-react';
import api from '../../lib/api';

interface Node {
    id: number;
    name: string;
    address: string;
    api_port: number;
    token: string;
    type: string;
    region: string;
    country: string;
    carrier: string;
    group_id: number;
    status: number;
    latency: number;
    load: number;
    rate: number;
    online_users: number;
    created_at: string;
}

interface NodeFormData {
    name: string;
    address: string;
    api_port: number;
    token: string;
    type: string;
    region: string;
    country: string;
    carrier: string;
    group_id: number;
    rate: number;
}

const defaultFormData: NodeFormData = {
    name: '',
    address: '',
    api_port: 10101,
    token: '',
    type: 'shadowsocks',
    region: '',
    country: '',
    carrier: '',
    group_id: 0,
    rate: 1,
};

// 节点管理页面
export default function NodesPage() {
    const [showModal, setShowModal] = useState(false);
    const [editingNode, setEditingNode] = useState<Node | null>(null);
    const [formData, setFormData] = useState<NodeFormData>(defaultFormData);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery<{ data: Node[] }>({
        queryKey: ['admin-nodes'],
        queryFn: () => api.get('/admin/nodes').then(res => res.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: NodeFormData) => api.post('/admin/nodes', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-nodes'] });
            handleCloseModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: NodeFormData }) =>
            api.put(`/admin/nodes/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-nodes'] });
            handleCloseModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/admin/nodes/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-nodes'] });
        },
    });

    const refreshMutation = useMutation({
        mutationFn: (id: number) => api.post(`/admin/nodes/${id}/refresh`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-nodes'] });
        },
    });

    const allNodes = data?.data || [];
    const nodes = searchTerm
        ? allNodes.filter(n => n.name.toLowerCase().includes(searchTerm.toLowerCase()))
        : allNodes;

    // 打开编辑模态框
    const handleEdit = (node: Node) => {
        setEditingNode(node);
        setFormData({
            name: node.name,
            address: node.address,
            api_port: node.api_port,
            token: node.token,
            type: node.type,
            region: node.region,
            country: node.country,
            carrier: node.carrier,
            group_id: node.group_id,
            rate: node.rate,
        });
        setShowModal(true);
    };

    // 打开新建模态框
    const handleCreate = () => {
        setEditingNode(null);
        setFormData(defaultFormData);
        setShowModal(true);
    };

    // 关闭模态框
    const handleCloseModal = () => {
        setShowModal(false);
        setEditingNode(null);
        setFormData(defaultFormData);
        setSaving(false);
    };

    // 提交表单
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingNode) {
                await updateMutation.mutateAsync({ id: editingNode.id, data: formData });
            } else {
                await createMutation.mutateAsync(formData);
            }
        } catch (error) {
            console.error('保存失败:', error);
            setSaving(false);
        }
    };

    // 删除节点
    const handleDelete = (node: Node) => {
        if (confirm(`确定要删除节点 "${node.name}" 吗？此操作不可恢复！`)) {
            deleteMutation.mutate(node.id);
        }
    };

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">节点管理</h1>
                    <p className="text-slate-400 mt-1">管理 NodePass Master 节点</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition"
                >
                    <Plus className="w-4 h-4" />
                    <span>添加节点</span>
                </button>
            </div>

            {/* 工具栏 */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="搜索节点名称..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                    />
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                    title="刷新"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* 节点列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        加载中...
                    </div>
                ) : nodes.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        <Server className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>暂无节点</p>
                        <button
                            onClick={handleCreate}
                            className="mt-4 text-primary hover:underline"
                        >
                            添加第一个节点
                        </button>
                    </div>
                ) : (
                    nodes.map((node) => (
                        <div
                            key={node.id}
                            className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition"
                        >
                            {/* 节点头部 */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${node.status === 1 ? 'bg-green-500/20' : 'bg-red-500/20'
                                        }`}>
                                        <Server className={`w-5 h-5 ${node.status === 1 ? 'text-green-400' : 'text-red-400'
                                            }`} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{node.name}</h3>
                                        <p className="text-xs text-slate-500">{node.address}:{node.api_port}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {node.status === 1 ? (
                                        <span className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                                            <CheckCircle className="w-3 h-3" />
                                            在线
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                                            <XCircle className="w-3 h-3" />
                                            离线
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 节点信息 */}
                            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Globe className="w-4 h-4" />
                                    <span>{node.region || '未知'} · {node.country || '未知'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Activity className="w-4 h-4" />
                                    <span>{node.latency || 0}ms</span>
                                </div>
                            </div>

                            {/* 统计数据 */}
                            <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-800 text-center">
                                <div>
                                    <p className="text-lg font-semibold text-white">{node.online_users || 0}</p>
                                    <p className="text-xs text-slate-500">在线用户</p>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-white">{node.load || 0}%</p>
                                    <p className="text-xs text-slate-500">负载</p>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-white">{node.rate}x</p>
                                    <p className="text-xs text-slate-500">倍率</p>
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                                <button
                                    onClick={() => refreshMutation.mutate(node.id)}
                                    disabled={refreshMutation.isPending}
                                    className="flex-1 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    刷新状态
                                </button>
                                <button
                                    onClick={() => handleEdit(node)}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(node)}
                                    className="p-2 bg-slate-800 hover:bg-red-600 text-white rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 添加/编辑节点模态框 */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* 模态框头部 */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-800">
                            <h3 className="text-lg font-semibold text-white">
                                {editingNode ? '编辑节点' : '添加节点'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 表单 */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* 节点名称 */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    节点名称 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                    placeholder="例如: 香港节点 01"
                                />
                            </div>

                            {/* 服务器地址和端口 */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        服务器地址 <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                        placeholder="IP 或域名"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        API 端口 <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.api_port}
                                        onChange={(e) => setFormData({ ...formData, api_port: Number(e.target.value) })}
                                        required
                                        min={1}
                                        max={65535}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* API Token */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    API Token <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.token}
                                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-primary"
                                    placeholder="NodePass Master API Token"
                                />
                            </div>

                            {/* 地区信息 */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        地区
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.region}
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                        placeholder="亚洲"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        国家
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                        placeholder="香港"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        运营商
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.carrier}
                                        onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                        placeholder="BGP"
                                    />
                                </div>
                            </div>

                            {/* 倍率和分组 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        流量倍率
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.rate}
                                        onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                                        min={0.1}
                                        step={0.1}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        用户组 ID
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.group_id}
                                        onChange={(e) => setFormData({ ...formData, group_id: Number(e.target.value) })}
                                        min={0}
                                        placeholder="0 表示所有用户"
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                    />
                                </div>
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
