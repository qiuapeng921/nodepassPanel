import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { Node } from '../types';
import { Activity, Server, Users, Wifi, Zap } from 'lucide-react';

export default function Dashboard() {
    const { data: nodes, isLoading } = useQuery({
        queryKey: ['nodes'],
        queryFn: async () => {
            const res = await api.get('/nodes');
            return res.data.data as Node[];
        },
    });

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                    <p className="text-gray-400">System Overview</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-secondary/50 hover:bg-secondary px-4 py-2 rounded-lg border border-white/10 transition-colors">
                        Add Node
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Nodes', value: nodes?.length || 0, icon: Server, color: 'text-blue-400' },
                    { label: 'Active Users', value: '1,234', icon: Users, color: 'text-green-400' },
                    { label: 'Total Bandwidth', value: '45 TB', icon: Activity, color: 'text-purple-400' },
                    { label: 'System Load', value: '24%', icon: Zap, color: 'text-yellow-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-secondary/30 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                            </div>
                            <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Nodes List */}
            <h2 className="text-xl font-semibold text-white mb-6">Active Nodes</h2>

            {isLoading ? (
                <div className="text-center py-20 text-gray-500">Loading nodes...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nodes?.map((node) => (
                        <div key={node.id} className="bg-secondary/40 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <img
                                    src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${node.country || 'US'}.svg`}
                                    className="w-6 h-4 rounded-sm"
                                    alt={node.country}
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                />
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Server size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{node.name}</h3>
                                    <p className="text-xs text-gray-500">{node.address}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-black/20 p-3 rounded-lg">
                                    <span className="text-gray-500 block text-xs mb-1">Status</span>
                                    <span className={`flex items-center gap-2 ${node.status === 1 ? 'text-green-400' : 'text-red-400'}`}>
                                        <span className={`w-2 h-2 rounded-full ${node.status === 1 ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                        {node.status === 1 ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                                <div className="bg-black/20 p-3 rounded-lg">
                                    <span className="text-gray-500 block text-xs mb-1">Latency</span>
                                    <span className="flex items-center gap-2 text-white">
                                        <Wifi size={14} className={node.ping < 100 ? 'text-green-400' : 'text-yellow-400'} />
                                        {node.ping} ms
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-400">
                                <span>Load: {(node.load * 100).toFixed(1)}%</span>
                                <span>Users: {node.online_user}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
