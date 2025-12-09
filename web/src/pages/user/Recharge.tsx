import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, ArrowRight } from 'lucide-react';

export default function UserRechargePage() {
    const [amount, setAmount] = useState('');
    const [customAmount, setCustomAmount] = useState('');
    const [loading, setLoading] = useState(false);

    // 预设金额选项
    const presetAmounts = [10, 20, 50, 100, 200, 500];

    const handleAmountSelect = (value: number) => {
        setAmount(value.toString());
        setCustomAmount('');
    };

    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomAmount(value);
        setAmount(value);
    };

    const handleOnlineRecharge = async () => {
        const finalAmount = parseFloat(amount);
        if (!finalAmount || finalAmount <= 0) {
            alert('请输入有效的充值金额');
            return;
        }

        setLoading(true);
        try {
            // TODO: 调用在线充值API
            const response = await fetch('/api/v1/user/recharge/online', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ amount: finalAmount }),
            });

            const data = await response.json();
            if (data.code === 0) {
                alert('充值订单创建成功，即将跳转到支付页面');
                // TODO: 跳转到支付页面或处理支付逻辑
            } else {
                alert(data.message || '充值失败');
            }
        } catch (error) {
            console.error('充值失败:', error);
            alert('充值失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    账户充值
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    为您的账户充值余额，支持在线支付
                </p>
            </div>

            {/* 在线充值卡片 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
            >
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <CreditCard className="w-8 h-8" />
                        <h2 className="text-2xl font-bold">在线充值</h2>
                    </div>
                    <p className="text-blue-100">
                        支持支付宝、微信支付等多种支付方式
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* 预设金额选择 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            选择充值金额
                        </label>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {presetAmounts.map((value) => (
                                <motion.button
                                    key={value}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAmountSelect(value)}
                                    className={`
                                        px-4 py-3 rounded-xl font-semibold transition-all
                                        ${amount === value.toString() && !customAmount
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }
                                    `}
                                >
                                    ¥{value}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* 自定义金额输入 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            或输入自定义金额
                        </label>
                        <div className="relative">
                            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={customAmount}
                                onChange={handleCustomAmountChange}
                                placeholder="请输入充值金额"
                                className="
                                    w-full pl-12 pr-4 py-3 
                                    bg-gray-50 dark:bg-gray-700 
                                    border border-gray-300 dark:border-gray-600 
                                    rounded-xl
                                    text-gray-900 dark:text-white
                                    placeholder-gray-400 dark:placeholder-gray-500
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                    transition-all
                                "
                            />
                        </div>
                    </div>

                    {/* 充值金额显示 */}
                    {amount && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-400">充值金额：</span>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    ¥{parseFloat(amount).toFixed(2)}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* 充值按钮 */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleOnlineRecharge}
                        disabled={!amount || loading}
                        className="
                            w-full py-4 px-6
                            bg-gradient-to-r from-blue-500 to-purple-600
                            hover:from-blue-600 hover:to-purple-700
                            text-white font-bold rounded-xl
                            shadow-lg shadow-blue-500/50
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all
                            flex items-center justify-center gap-2
                        "
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                处理中...
                            </>
                        ) : (
                            <>
                                立即充值
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </motion.button>

                    {/* 充值说明 */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                            温馨提示
                        </h3>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                            <li>• 充值金额将立即到账，可用于购买套餐</li>
                            <li>• 支持支付宝、微信等主流支付方式</li>
                            <li>• 充值遇到问题请联系客服</li>
                        </ul>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
