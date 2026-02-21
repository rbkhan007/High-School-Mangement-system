import { useEffect, useState } from 'react';
import api from '../services/api';
import NoticeCard from '../components/NoticeCard';
import { Megaphone, Plus, Languages, RefreshCcw, BellOff } from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { useSocket } from '../context/socket-context';
import { motion, AnimatePresence } from 'framer-motion';

import { Notice } from '@school/shared';

const Notices = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [language, setLanguage] = useState<'en' | 'bn'>('bn');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { socket } = useSocket();

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/notices');
            setNotices(response.data);
        } catch {
            console.error('Failed to fetch notices');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('new-notice', (notice: Notice) => {
                setNotices(prev => [notice, ...prev]);
            });
            return () => {
                socket.off('new-notice');
            };
        }
    }, [socket]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-school-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-school-primary/30 transform rotate-3">
                        <Megaphone className="text-white w-8 h-8 -rotate-3" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Notice Board</h1>
                        <p className="text-slate-500 font-medium">Important announcements and updates</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                        className="btn-3d flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-800/50"
                    >
                        <Languages size={20} />
                        <span className="hidden sm:inline">{language === 'en' ? 'বাংলা সংস্করণ' : 'English Version'}</span>
                    </button>

                    {user?.role === 'HEADMASTER' && (
                        <button className="btn-3d-primary flex items-center gap-2">
                            <Plus size={20} /> <span className="hidden sm:inline">New Notice</span>
                        </button>
                    )}

                    <button
                        onClick={fetchNotices}
                        className="p-3 glass-card text-slate-500 hover:text-school-primary transition-all active:scale-95"
                        title="Refresh"
                    >
                        <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="glass-card p-6 h-64 animate-pulse bg-slate-100/50 border-2 border-slate-100" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                        {notices.map((notice, index) => (
                            <motion.div
                                key={notice.id}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                layout
                            >
                                <NoticeCard notice={notice} language={language} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {!loading && notices.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-16 text-center border-dashed border-2 border-slate-200 bg-slate-50/50 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <BellOff size={120} className="-rotate-12" />
                    </div>
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <Megaphone size={40} className="text-slate-400 transform -rotate-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">System Notice Quiet</h2>
                    <p className="text-slate-500 font-medium mt-3 max-w-sm mx-auto leading-relaxed">
                        The notice board is currently empty. Direct broadcasts from the school administration will appear here in real-time.
                    </p>
                </motion.div>
            )}
        </div>
    );
};

export default Notices;
