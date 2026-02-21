import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserSquare2,
    Search,
    Mail,
    Phone,
    Award,
    Shield,
    AtSign
} from 'lucide-react';
import api from '../services/api';

interface Teacher {
    user_id: string;
    employee_id: string;
    subjects: string[];
    mpo_id: string;
    user: {
        display_name: string;
        email: string;
        phone: string;
        photo_url?: string;
    };
}

const Teachers = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/teachers');
            setTeachers(response.data);
        } catch {
            console.error('Failed to fetch teachers');
        } finally {
            setLoading(false);
        }
    };

    const filteredTeachers = teachers.filter(teacher =>
        teacher.user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-600/30 transform -rotate-3">
                        <UserSquare2 className="text-white w-8 h-8 rotate-3" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Academic Faculty</h1>
                        <p className="text-slate-500 font-medium">Profiles of our dedicated educators</p>
                    </div>
                </div>

                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3">
                    <Award className="text-rose-600" size={20} />
                    <span className="text-sm font-bold text-slate-700">{teachers.length} Faculty Members</span>
                </div>
            </div>

            <div className="glass-card p-4 relative group">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search by name, subject, or employee ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-2xl py-4 pl-14 pr-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-rose-600 transition-all"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="glass-card p-8 h-64 animate-pulse bg-slate-50 border-slate-100" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredTeachers.map((teacher, index) => (
                            <motion.div
                                key={teacher.user_id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card group hover:border-rose-200 transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row"
                            >
                                <div className="sm:w-48 bg-slate-50 p-8 flex flex-col items-center justify-center relative border-b sm:border-b-0 sm:border-r border-slate-100">
                                    <div className="w-24 h-24 rounded-3xl bg-white flex items-center justify-center border border-slate-200 shadow-xl shadow-slate-200/50 mb-4 group-hover:scale-110 transition-transform relative z-10 overflow-hidden">
                                        {teacher.user.photo_url ? (
                                            <img src={teacher.user.photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserSquare2 className="text-rose-200 w-12 h-12" />
                                        )}
                                    </div>
                                    <div className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] relative z-10 bg-rose-50 px-2 py-1 rounded-full">{teacher.employee_id}</div>

                                    {/* Geometric BG decoration */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-rose-300" />
                                </div>

                                <div className="flex-1 p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-1">{teacher.user.display_name}</h3>
                                            <div className="flex items-center gap-2 text-rose-600">
                                                <Shield size={14} className="fill-rose-600/10" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Verified Faculty</span>
                                            </div>
                                        </div>
                                        <button className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                            <Mail size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Subject Specialization</p>
                                            <div className="flex flex-wrap gap-2">
                                                {teacher.subjects.map(subject => (
                                                    <span key={subject} className="px-3 py-1.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                                        {subject}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <AtSign size={12} />
                                                    <span className="text-[10px] uppercase font-bold tracking-tighter">Email</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-700 truncate">{teacher.user.email}</p>
                                            </div>
                                            <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <Phone size={12} />
                                                    <span className="text-[10px] uppercase font-bold tracking-tighter">Phone</span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-700">{teacher.user.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {!loading && filteredTeachers.length === 0 && (
                <div className="glass-card p-20 text-center border-dashed border-2 border-slate-200 bg-slate-50/50">
                    <UserSquare2 className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-slate-600 tracking-tight">System Faculty Quiet</h3>
                    <p className="text-slate-400 font-medium mt-3 max-w-sm mx-auto">No teachers found matching your search. Please verify the credentials.</p>
                </div>
            )}
        </div>
    );
};

export default Teachers;
