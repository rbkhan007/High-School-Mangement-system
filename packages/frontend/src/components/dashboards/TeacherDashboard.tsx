import { motion } from 'framer-motion';
import {
    BookOpen,
    Users,
    ClipboardList,
    Bell
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../services/api';

const TeacherDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/teachers/dashboard');
                setStats(response.data);
            } catch (err) {
                console.error('Failed to fetch teacher stats', err);
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
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Teacher Workspace</h1>
                    <p className="text-slate-500 font-medium">Welcome back. Here is your daily overview.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                    { label: 'Classes Today', value: stats?.classesToday || '0', icon: BookOpen, trend: 'Routine', up: true, color: 'blue' },
                    { label: 'Students', value: stats?.totalStudents || '0', icon: Users, trend: 'Enrolled', up: true, color: 'green' },
                    { label: 'Pending Attendance', value: stats?.pendingAttendance || '0', icon: ClipboardList, trend: 'Action Needed', up: false, color: 'amber' },
                    { label: 'New Notices', value: stats?.newNotices || '0', icon: Bell, trend: 'Today', up: true, color: 'indigo' },
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
                    <h4 className="text-xl font-black text-slate-900 tracking-tight mb-8">Today's Schedule</h4>
                    <div className="space-y-4">
                        {stats?.schedule?.map((c: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                <div>
                                    <p className="font-bold text-slate-900">{c.cls}</p>
                                    <p className="text-sm font-medium text-slate-500">{c.subject}</p>
                                </div>
                                <span className="font-bold text-school-primary">{c.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-8 border border-white shadow-2xl shadow-slate-200/50">
                    <h4 className="text-xl font-black text-slate-900 tracking-tight mb-8">Recent Notices</h4>
                    <div className="space-y-4">
                        {stats?.recentNotices?.map((n: any, i: number) => (
                            <div key={i} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                                <h5 className="font-bold text-slate-900">{n.title}</h5>
                                <p className="text-sm text-slate-600 mt-1">{n.description}</p>
                                <p className="text-xs font-bold text-slate-400 mt-2">{n.time}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
