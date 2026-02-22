import { motion } from 'framer-motion';
import {
    Users,
    Activity,
    CreditCard,
    Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../services/api';

const ParentDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/parent/dashboard');
                setStats(response.data);
            } catch (err) {
                console.error('Failed to fetch parent stats', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8">Loading workspace...</div>;

    return (
        <div className="space-y-8 p-4">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Parent Portal</h1>
                    <p className="text-slate-500 font-medium">Monitor your children's progress and stay updated.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                    { label: 'Children Enrolled', value: stats?.childrenEnrolled || '0', icon: Users, trend: 'Active', up: true, color: 'blue' },
                    { label: 'Avg. Attendance', value: stats?.averageAttendance || '0%', icon: Activity, trend: 'Overall', up: true, color: 'green' },
                    { label: 'Pending Fees', value: stats?.pendingFees || '৳ 0', icon: CreditCard, trend: 'Cleared', up: true, color: 'indigo' },
                    { label: 'Notices', value: stats?.notices || '0', icon: Bell, trend: 'Unread', up: false, color: 'amber' },
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
                            <div className={`flex items-center gap-1 text-sm font-black text-${stat.color}-600`}>
                                {stat.trend}
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest">{stat.label}</h3>
                        <p className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-8 border border-white shadow-2xl shadow-slate-200/50">
                    <h4 className="text-xl font-black text-slate-900 tracking-tight mb-8">Children Overview</h4>
                    <div className="space-y-4">
                        {stats?.children?.map((c: any, i: number) => (
                            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">
                                    {c.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-900">{c.name}</h5>
                                    <p className="text-sm text-slate-500">{c.class}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-sm font-bold text-green-600">{c.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-8 border border-white shadow-2xl shadow-slate-200/50">
                    <h4 className="text-xl font-black text-slate-900 tracking-tight mb-8">School Announcements</h4>
                    {stats?.announcements?.map((a: any, i: number) => (
                        <div key={i} className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-4">
                            <h5 className="font-bold text-slate-900">{a.title}</h5>
                            <p className="text-sm text-slate-600 mt-2">{a.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;
