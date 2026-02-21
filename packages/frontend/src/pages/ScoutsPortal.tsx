
import { motion } from 'framer-motion';
import {
    Award,
    Map,
    Flag,
    ShieldCheck,
    Calendar,
    Users,
    Search
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';

const ScoutsPortal = () => {
    const [scouts, setScouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScouts = async () => {
            try {
                const response = await api.get('/scouts');
                setScouts(response.data);
            } catch (err) {
                console.error('Failed to fetch scouts');
            } finally {
                setLoading(false);
            }
        };
        fetchScouts();
    }, []);

    return (
        <div className="space-y-8 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Scouts Unit</h1>
                    <p className="text-slate-500 font-medium tracking-wide">Basudebpur High School • Bangladesh Scouts</p>
                </div>
                <button className="px-6 py-3 bg-green-600 text-white rounded-2xl font-black 3d-button shadow-xl shadow-green-900/20 flex items-center gap-2">
                    New Enrollment <Users className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Unit Stats */}
                <div className="glass-card p-8 border border-white bg-green-50/20 col-span-1 md:col-span-1">
                    <Award className="w-12 h-12 text-green-600 mb-6" />
                    <h3 className="text-2xl font-black text-slate-900 mb-2">{loading ? '...' : scouts.length} Active Scouts</h3>
                    <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Official BHS Unit</p>
                    <div className="mt-8 space-y-4">
                        <div className="flex justify-between text-sm font-bold">
                            <span className="text-slate-500">Patrol Leaders</span>
                            <span className="text-slate-900 font-black">
                                {loading ? '...' : scouts.filter(s => s.rank === 'Patrol Leader').length.toString().padStart(2, '0')}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t border-white pt-4">
                            <span className="text-slate-500">Total Badges</span>
                            <span className="text-slate-900 font-black">
                                {loading ? '...' : scouts.reduce((acc, s) => acc + (s.badges?.length || 0), 0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Feature Cards */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                        { title: 'Training Materials', desc: 'Digital manual for knots, first aid, and survival.', icon: Map, color: 'blue' },
                        { title: 'Upcoming Camps', desc: 'View schedule and register for upcoming district camps.', icon: Calendar, color: 'amber' },
                        { title: 'Badge Tracker', desc: 'Request and track your badge progress.', icon: ShieldCheck, color: 'green' },
                        { title: 'Unit Notices', desc: 'Real-time alerts for weekly unit meetings.', icon: Flag, color: 'red' },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.02 }}
                            className="glass-card p-6 border border-white shadow-lg transition-all"
                        >
                            <div className={`p-3 bg-${item.color}-500/10 rounded-xl w-fit mb-4`}>
                                <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                            </div>
                            <h4 className="text-lg font-black text-slate-900 mb-2">{item.title}</h4>
                            <p className="text-xs font-medium text-slate-500 leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="glass-card p-8 border border-white shadow-2xl shadow-slate-200/50">
                <div className="flex justify-between items-center mb-10">
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">Member Directory</h4>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="text" placeholder="Search member..." className="pl-9 pr-4 py-2 bg-slate-50 rounded-xl text-xs font-bold outline-none" />
                    </div>
                </div>
                <div className="space-y-4">
                    {loading ? (
                        <div className="h-20 animate-pulse glass-card" />
                    ) : (
                        scouts.map((m, i) => (
                            <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 text-xs">
                                        {m.student.user.display_name.charAt(0)}
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-black text-slate-900">{m.student.user.display_name}</h5>
                                        <p className="text-[10px] font-black uppercase text-green-600 tracking-widest">{m.rank || 'MEMBER'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="text-right">
                                        <p className="text-xs font-black text-slate-400 uppercase">{(m.badges || []).length} Badges</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {m.status}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScoutsPortal;
