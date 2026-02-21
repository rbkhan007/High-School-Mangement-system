
import { motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    Users,
    UserCheck,
    AlertTriangle,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import socket from '../utils/socket';
import api from '../services/api';

const data = [
    { name: 'Jan', attendance: 85, performance: 78 },
    { name: 'Feb', attendance: 88, performance: 82 },
    { name: 'Mar', attendance: 92, performance: 85 },
    { name: 'Apr', attendance: 90, performance: 88 },
    { name: 'May', attendance: 95, performance: 91 },
];



const ControlCenter = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [logsRes, statsRes] = await Promise.all([
                    api.get('/admin/logs'),
                    api.get('/admin/stats')
                ]);
                setLogs(logsRes.data);
                setStats(statsRes.data);
            } catch (err) {
                console.error('Failed to fetch dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        socket.on('log-update', (newLog) => {
            setLogs(prev => [newLog, ...prev].slice(0, 10));
        });

        return () => {
            socket.off('log-update');
        };
    }, []);
    return (
        <div className="space-y-8 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Monitor</h1>
                    <p className="text-slate-500 font-medium">Headmaster's Control Center • Live Activity</p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-bold flex items-center gap-2 border border-green-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        Database Online
                    </div>
                    <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold border border-blue-100 italic">
                        v2.0 PRO
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                    { label: 'Total Students', value: stats?.totalStudents?.toLocaleString() || '0', icon: Users, trend: '+0%', up: true, color: 'blue' },
                    { label: 'Today Attendance', value: stats?.attendanceRate || '0%', icon: UserCheck, trend: '+0%', up: true, color: 'green' },
                    { label: 'Pending Grievances', value: stats?.pendingGrievances?.toString().padStart(2, '0') || '00', icon: AlertTriangle, trend: 'Live', up: true, color: 'amber' },
                    { label: 'System Uptime', value: stats?.uptime || '99.9%', icon: Activity, trend: 'Stable', up: true, color: 'indigo' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-4 lg:p-6 border border-white/50 shadow-xl shadow-slate-200/40 relative overflow-hidden group"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-110 transition-transform`} />
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 bg-${stat.color}-500/10 rounded-2xl`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-black ${stat.up ? 'text-green-600' : 'text-amber-600'}`}>
                                {stat.trend} {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">{stat.label}</h3>
                        <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-8 border border-white shadow-2xl shadow-slate-200/50">
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Academic Growth</h4>
                        <select className="bg-slate-50 border-none text-xs font-bold rounded-lg px-3 py-2 outline-none">
                            <option>Last 6 Months</option>
                            <option>Yearly</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1e40af" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                                />
                                <Area type="monotone" dataKey="attendance" stroke="#1e40af" strokeWidth={4} fillOpacity={1} fill="url(#colorAttend)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-8 border border-white shadow-2xl shadow-slate-200/50">
                    <div className="flex justify-between items-center mb-10">
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Grade Distribution</h4>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                <span className="text-[10px] font-bold text-slate-400">Class Performance</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="performance" fill="#d4af37" radius={[6, 6, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Real-time Activity Feed */}
            <div className="glass-card p-8 border border-white shadow-2xl shadow-slate-200/50">
                <h4 className="text-xl font-black text-slate-900 tracking-tight mb-8">System Activity Logs</h4>
                <div className="space-y-6">
                    {logs.map((log, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 text-xs text-uppercase">
                                    {log.user?.display_name?.charAt(0) || log.level?.[0] || 'S'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{log.user?.display_name || 'System'}</p>
                                    <p className="text-xs font-medium text-slate-500">{log.message || log.action}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                    ))}
                    {logs.length === 0 && !loading && (
                        <p className="text-center text-slate-400 font-bold">No activity logs found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ControlCenter;
