import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User,
    Lock,
    Key,
    RefreshCw,
    Save,
    Copy,
    Check,
    Eye,
    EyeOff,
    AlertTriangle
} from 'lucide-react';
import api from '../../lib/api';

interface UserProfile {
    id: number;
    email: string;
    balance: number;
    created_at: string;
}

// 用户设置页面
export default function UserSettingsPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const queryClient = useQueryClient();

    // 获取用户信息
    const { data: profileData, isLoading, refetch } = useQuery<{ data: UserProfile }>({
        queryKey: ['user-profile'],
        queryFn: () => api.get('/user/profile').then(res => res.data),
    });

    // 修改密码
    const changePasswordMutation = useMutation({
        mutationFn: (data: { old_password: string; new_password: string }) =>
            api.put('/user/password', data),
        onSuccess: () => {
            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(false), 3000);
        },
        onError: (error: Error & { response?: { data?: { message?: string } } }) => {
            setPasswordError(error.response?.data?.message || '修改失败');
        },
    });



    const profile = profileData?.data;



    // 处理密码修改
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        // 验证密码
        if (newPassword.length < 6) {
            setPasswordError('新密码长度不能少于6位');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('两次输入的密码不一致');
            return;
        }

        setSaving(true);
        try {
            await changePasswordMutation.mutateAsync({
                old_password: currentPassword,
                new_password: newPassword,
            });
        } finally {
            setSaving(false);
        }
    };



    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">个人设置</h1>
                    <p className="text-slate-500 mt-1">管理您的账户信息和安全设置</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition shadow-sm"
                    title="刷新"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* 账户信息 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-slate-900">账户信息</h2>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {isLoading ? (
                        <div className="text-slate-500">加载中...</div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between py-3 border-b border-slate-200">
                                <div>
                                    <p className="text-sm text-slate-400">邮箱地址</p>
                                    <p className="text-slate-900 font-medium">{profile?.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-3 border-b border-slate-200">
                                <div>
                                    <p className="text-sm text-slate-400">账户余额</p>
                                    <p className="text-slate-900 font-medium">¥{(profile?.balance || 0).toFixed(2)}</p>
                                </div>
                                <button
                                    className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition text-sm"
                                    onClick={() => alert('充值功能开发中')}
                                >
                                    充值
                                </button>
                            </div>

                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm text-slate-400">注册时间</p>
                                    <p className="text-slate-900 font-medium">
                                        {profile?.created_at
                                            ? new Date(profile.created_at).toLocaleDateString('zh-CN')
                                            : '-'
                                        }
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>


            {/* 修改密码 */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-slate-900">修改密码</h2>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                    {/* 成功提示 */}
                    {passwordSuccess && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                            <Check className="w-4 h-4" />
                            <span>密码修改成功</span>
                        </div>
                    )}

                    {/* 错误提示 */}
                    {passwordError && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{passwordError}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            当前密码
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary pr-10"
                                placeholder="输入当前密码"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            新密码
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                            placeholder="至少6位字符"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            确认新密码
                        </label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary"
                            placeholder="再次输入新密码"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? '保存中...' : '保存修改'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 危险操作区域 */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-red-500/30">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <h2 className="text-lg font-semibold text-red-400">危险区域</h2>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white font-medium">删除账户</p>
                            <p className="text-xs text-slate-500">删除后所有数据将无法恢复</p>
                        </div>
                        <button
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition text-sm"
                            onClick={() => alert('此功能暂未开放')}
                        >
                            删除账户
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
