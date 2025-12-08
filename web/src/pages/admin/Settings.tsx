import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Save,
    RefreshCw,
    Settings as SettingsIcon,
    Globe,
    CreditCard,
    Mail,
    Users
} from 'lucide-react';
import api from '../../lib/api';

interface Setting {
    id: number;
    key: string;
    value: string;
    type: string;
    group: string;
    desc: string;
}

const groupConfig: Record<string, { label: string; icon: typeof Globe }> = {
    site: { label: '站点设置', icon: Globe },
    payment: { label: '支付设置', icon: CreditCard },
    mail: { label: '邮件设置', icon: Mail },
    invite: { label: '邀请设置', icon: Users },
};

// 系统设置页面
export default function SettingsPage() {
    const [activeGroup, setActiveGroup] = useState('site');
    const [editedValues, setEditedValues] = useState<Record<string, string>>({});
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery<{ data: Setting[] }>({
        queryKey: ['admin-settings'],
        queryFn: () => api.get('/admin/settings').then(res => res.data),
    });

    const batchUpdateMutation = useMutation({
        mutationFn: (settings: { key: string; value: string }[]) =>
            api.put('/admin/settings/batch', { settings }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            setEditedValues({});
        },
    });

    const allSettings = data?.data || [];
    const settings = allSettings.filter(s => s.group === activeGroup);

    const handleChange = (key: string, value: string) => {
        setEditedValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        const updates = Object.entries(editedValues).map(([key, value]) => ({ key, value }));
        if (updates.length > 0) {
            batchUpdateMutation.mutate(updates);
        }
    };

    const getValue = (setting: Setting) => {
        return editedValues[setting.key] ?? setting.value;
    };

    const hasChanges = Object.keys(editedValues).length > 0;

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">系统设置</h1>
                    <p className="text-slate-400 mt-1">配置系统参数和功能开关</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || batchUpdateMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        <span>保存更改</span>
                    </button>
                </div>
            </div>

            <div className="flex gap-6">
                {/* 分组导航 */}
                <div className="w-48 flex-shrink-0">
                    <nav className="space-y-1">
                        {Object.entries(groupConfig).map(([key, config]) => {
                            const Icon = config.icon;
                            const isActive = activeGroup === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveGroup(key)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${isActive
                                            ? 'bg-primary text-white'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{config.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* 设置表单 */}
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-500">加载中...</div>
                    ) : settings.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <SettingsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>暂无设置项</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {settings.map((setting) => (
                                <div key={setting.key} className="space-y-2">
                                    <label className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-white">{setting.desc || setting.key}</span>
                                        <span className="text-xs text-slate-500 font-mono">{setting.key}</span>
                                    </label>

                                    {setting.type === 'bool' ? (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleChange(setting.key, getValue(setting) === 'true' ? 'false' : 'true')}
                                                className={`relative w-12 h-6 rounded-full transition ${getValue(setting) === 'true' ? 'bg-primary' : 'bg-slate-700'
                                                    }`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${getValue(setting) === 'true' ? 'left-7' : 'left-1'
                                                    }`} />
                                            </button>
                                            <span className="text-sm text-slate-400">
                                                {getValue(setting) === 'true' ? '开启' : '关闭'}
                                            </span>
                                        </div>
                                    ) : setting.type === 'int' ? (
                                        <input
                                            type="number"
                                            value={getValue(setting)}
                                            onChange={(e) => handleChange(setting.key, e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={getValue(setting)}
                                            onChange={(e) => handleChange(setting.key, e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
