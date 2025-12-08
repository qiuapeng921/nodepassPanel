import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Lock, Mail, Loader2, KeyRound, Gift, Send, ArrowLeft } from 'lucide-react';

// 页面模式
type PageMode = 'login' | 'register' | 'forgot';

export default function Login() {
    const [mode, setMode] = useState<PageMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // 从 URL 读取邀请码
    useEffect(() => {
        const code = searchParams.get('code');
        if (code) {
            setInviteCode(code);
            setMode('register');
        }
    }, [searchParams]);

    // 倒计时
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 发送验证码
    const handleSendCode = async (codeType: number = 1) => {
        if (!email) {
            setError('请输入邮箱地址');
            return;
        }
        setSendingCode(true);
        setError('');

        try {
            const res = await api.post('/auth/send-code', {
                email,
                type: codeType // 1=注册, 2=找回密码
            });
            if (res.data.code === 200) {
                setCountdown(60);
                setSuccess('验证码已发送至您的邮箱');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(res.data.msg || '发送失败');
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { msg?: string } } };
            setError(error.response?.data?.msg || '发送失败');
        } finally {
            setSendingCode(false);
        }
    };

    // 登录
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', { email, password });
            if (res.data.code === 200) {
                const { token, user } = res.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('userInfo', JSON.stringify(user));
                navigate('/dashboard');
            } else {
                setError(res.data.msg || '登录失败');
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { msg?: string } } };
            setError(error.response?.data?.msg || '邮箱或密码错误');
        } finally {
            setLoading(false);
        }
    };

    // 注册
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('两次输入的密码不一致');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('密码长度不能少于6位');
            setLoading(false);
            return;
        }

        try {
            const res = await api.post('/auth/register', {
                email,
                password,
                code: verifyCode || undefined,
                invite_code: inviteCode || undefined
            });
            if (res.data.code === 200) {
                setSuccess('注册成功！请登录');
                setMode('login');
                setPassword('');
                setConfirmPassword('');
                setVerifyCode('');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(res.data.msg || '注册失败');
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { msg?: string } } };
            setError(error.response?.data?.msg || '注册失败');
        } finally {
            setLoading(false);
        }
    };

    // 重置密码
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!verifyCode) {
            setError('请输入验证码');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('两次输入的密码不一致');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('密码长度不能少于6位');
            setLoading(false);
            return;
        }

        try {
            const res = await api.post('/auth/reset-password', {
                email,
                code: verifyCode,
                new_password: password
            });
            if (res.data.code === 200) {
                setSuccess('密码重置成功！请登录');
                setMode('login');
                setPassword('');
                setConfirmPassword('');
                setVerifyCode('');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(res.data.msg || '重置失败');
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { msg?: string } } };
            setError(error.response?.data?.msg || '重置失败');
        } finally {
            setLoading(false);
        }
    };

    // 切换模式时清空表单
    const switchMode = (newMode: PageMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
        setPassword('');
        setConfirmPassword('');
        setVerifyCode('');
    };

    // 获取标题
    const getTitle = () => {
        switch (mode) {
            case 'register': return '创建新账户';
            case 'forgot': return '找回密码';
            default: return '欢迎回来';
        }
    };

    // 获取提交处理函数
    const getSubmitHandler = () => {
        switch (mode) {
            case 'register': return handleRegister;
            case 'forgot': return handleResetPassword;
            default: return handleLogin;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
            {/* 背景渐变 */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -z-10 animate-pulse"></div>

            <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">N</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        NyanPass
                    </h1>
                    <p className="text-slate-400 mt-2">{getTitle()}</p>
                </div>

                {/* 返回登录按钮 */}
                {mode !== 'login' && (
                    <button
                        onClick={() => switchMode('login')}
                        className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        返回登录
                    </button>
                )}

                <form onSubmit={getSubmitHandler()} className="space-y-5">
                    {/* 错误提示 */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* 成功提示 */}
                    {success && (
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm text-center">
                            {success}
                        </div>
                    )}

                    {/* 邮箱 */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="email"
                            placeholder="邮箱地址"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                            required
                        />
                    </div>

                    {/* 找回密码模式：验证码（必填） */}
                    {mode === 'forgot' && (
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="邮箱验证码"
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    required
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleSendCode(2)} // 类型2=找回密码
                                disabled={sendingCode || countdown > 0}
                                className={cn(
                                    "px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition flex items-center gap-2 whitespace-nowrap",
                                    (sendingCode || countdown > 0) && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {sendingCode ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : countdown > 0 ? (
                                    `${countdown}s`
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        发送
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* 密码（登录和找回密码时显示） */}
                    {(mode === 'login' || mode === 'forgot') && (
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                placeholder={mode === 'forgot' ? '新密码' : '密码'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                required
                            />
                        </div>
                    )}

                    {/* 找回密码：确认新密码 */}
                    {mode === 'forgot' && (
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                placeholder="确认新密码"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                required
                            />
                        </div>
                    )}

                    {/* 注册时显示额外字段 */}
                    {mode === 'register' && (
                        <>
                            {/* 密码 */}
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    placeholder="密码"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    required
                                />
                            </div>

                            {/* 确认密码 */}
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    placeholder="确认密码"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    required
                                />
                            </div>

                            {/* 验证码（可选） */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="邮箱验证码（可选）"
                                        value={verifyCode}
                                        onChange={(e) => setVerifyCode(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleSendCode(1)} // 类型1=注册
                                    disabled={sendingCode || countdown > 0}
                                    className={cn(
                                        "px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition flex items-center gap-2 whitespace-nowrap",
                                        (sendingCode || countdown > 0) && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    {sendingCode ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : countdown > 0 ? (
                                        `${countdown}s`
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            发送
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 邀请码 */}
                            <div className="relative">
                                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="邀请码（可选）"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                                />
                            </div>
                        </>
                    )}

                    {/* 忘记密码链接（仅登录模式显示） */}
                    {mode === 'login' && (
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => switchMode('forgot')}
                                className="text-sm text-slate-400 hover:text-primary transition"
                            >
                                忘记密码？
                            </button>
                        </div>
                    )}

                    {/* 提交按钮 */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2",
                            loading && "opacity-70 cursor-not-allowed"
                        )}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : mode === 'register' ? (
                            "注册"
                        ) : mode === 'forgot' ? (
                            "重置密码"
                        ) : (
                            "登录"
                        )}
                    </button>
                </form>

                {/* 切换登录/注册 */}
                {mode !== 'forgot' && (
                    <div className="mt-6 text-center text-sm text-slate-400">
                        {mode === 'register' ? (
                            <>
                                已有账户？{' '}
                                <button
                                    onClick={() => switchMode('login')}
                                    className="text-primary hover:underline"
                                >
                                    立即登录
                                </button>
                            </>
                        ) : (
                            <>
                                还没有账户？{' '}
                                <button
                                    onClick={() => switchMode('register')}
                                    className="text-primary hover:underline"
                                >
                                    免费注册
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
