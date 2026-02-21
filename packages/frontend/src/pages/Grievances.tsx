import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldAlert,
    Plus,
    MessageSquare,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    User,
    Tag,
    ChevronRight,
    Send
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/auth-context';
import { useSocket } from '../context/socket-context';
import { cn } from '../utils/cn';

interface Grievance {
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'PENDING' | 'ASSIGNED' | 'RESOLVED' | 'ESCALATED';
    created_at: string;
    submitted_by_user?: {
        display_name: string;
    };
}

const Grievances = () => {
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    useAuth();
    const { socket } = useSocket();

    const [newGrievance, setNewGrievance] = useState({
        title: '',
        description: '',
        category: 'Academic',
        anonymous: false
    });

    useEffect(() => {
        fetchGrievances();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('new-grievance', (grievance: Grievance) => {
                setGrievances(prev => [grievance, ...prev]);
            });

            socket.on('grievance-update', (updatedGrievance: Grievance) => {
                setGrievances(prev => prev.map(g => g.id === updatedGrievance.id ? updatedGrievance : g));
            });

            return () => {
                socket.off('new-grievance');
                socket.off('grievance-update');
            };
        }
    }, [socket]);

    const fetchGrievances = async () => {
        setLoading(true);
        try {
            const response = await api.get('/grievances');
            setGrievances(response.data);
        } catch {
            console.error('Failed to fetch grievances');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/grievances', newGrievance);
            setIsModalOpen(false);
            setNewGrievance({ title: '', description: '', category: 'Academic', anonymous: false });
            fetchGrievances();
        } catch {
            console.error('Failed to submit grievance');
        }
    };

    const StatusBadge = ({ status }: { status: Grievance['status'] }) => {
        const configs = {
            PENDING: { color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
            ASSIGNED: { color: 'text-blue-600', bg: 'bg-blue-50', icon: User },
            RESOLVED: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
            ESCALATED: { color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle },
        };
        const config = configs[status];
        const Icon = config.icon;

        return (
            <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-current opacity-80", config.bg, config.color)}>
                <Icon size={12} />
                {status}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-800/30 transform -rotate-3">
                        <ShieldAlert className="text-white w-8 h-8 rotate-3" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Grievance Desk</h1>
                        <p className="text-slate-500 font-medium">Safe and transparent complaint management system</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-3d-primary flex items-center gap-2 px-6"
                    >
                        <Plus size={20} />
                        <span className="font-bold">New Grievance</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="glass-card p-6 h-32 animate-pulse bg-slate-50 border-slate-100" />
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {grievances.map((g, index) => (
                            <motion.div
                                key={g.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card p-6 group hover:border-slate-300 transition-all duration-300 grid md:grid-cols-[1fr,auto] gap-6 items-center"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-slate-800">{g.title}</h3>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase tracking-tighter">
                                            <Tag size={10} />
                                            {g.category}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{g.description}</p>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            {new Date(g.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MessageSquare size={12} />
                                            Ticket #{g.id.slice(0, 5)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                    <StatusBadge status={g.status} />
                                    <button className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-all group-hover:translate-x-1">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {!loading && grievances.length === 0 && (
                <div className="glass-card p-24 text-center border-dashed border-2 border-slate-200 bg-slate-50/50">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-200/50">
                        <ShieldAlert className="text-slate-200 w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-600 tracking-tight">System Secure & Quiet</h3>
                    <p className="text-slate-400 font-medium mt-3 max-w-sm mx-auto">No pending grievances or complaints in the system. Everything is running smoothly.</p>
                </div>
            )}

            {/* Modal for new grievance */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden"
                        >
                            <div className="p-10">
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Submit New Ticket</h2>
                                <p className="text-slate-500 mb-8 font-medium">Your voice is important for our community improvement.</p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject / Title</label>
                                        <input
                                            required
                                            type="text"
                                            value={newGrievance.title}
                                            onChange={(e) => setNewGrievance({ ...newGrievance, title: e.target.value })}
                                            className="w-full bg-slate-50 border-0 rounded-2xl py-4 px-6 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-800 transition-all"
                                            placeholder="Brief summary of the issue..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                            <select
                                                value={newGrievance.category}
                                                onChange={(e) => setNewGrievance({ ...newGrievance, category: e.target.value })}
                                                className="w-full bg-slate-50 border-0 rounded-2xl py-4 px-6 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-800 transition-all appearance-none"
                                            >
                                                <option>Academic</option>
                                                <option>Facility</option>
                                                <option>Behavioral</option>
                                                <option>Staff</option>
                                                <option>Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Privacy Mode</label>
                                            <button
                                                type="button"
                                                onClick={() => setNewGrievance({ ...newGrievance, anonymous: !newGrievance.anonymous })}
                                                className={cn(
                                                    "w-full py-4 px-6 rounded-2xl text-xs font-bold transition-all border flex items-center justify-between",
                                                    newGrievance.anonymous ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"
                                                )}
                                            >
                                                {newGrievance.anonymous ? 'Anonymous' : 'Display Name'}
                                                <div className={cn("w-4 h-4 rounded-full border-2", newGrievance.anonymous ? "border-white bg-slate-800" : "border-slate-200 bg-slate-50")} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Description</label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={newGrievance.description}
                                            onChange={(e) => setNewGrievance({ ...newGrievance, description: e.target.value })}
                                            className="w-full bg-slate-50 border-0 rounded-2xl py-4 px-6 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-800 transition-all resize-none"
                                            placeholder="Describe the situation in detail..."
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="flex-1 py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-[2] btn-3d bg-slate-800 text-white py-4 flex items-center justify-center gap-2"
                                        >
                                            <Send size={18} />
                                            Submit Ticket
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Grievances;
