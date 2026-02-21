
import { motion } from 'framer-motion';
import {
    BookOpen,
    Download,
    Clock,
    Filter,
    Plus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { Book, Assignment } from '@school/shared';

const CourseMaterials = () => {
    const [materials, setMaterials] = useState<Book[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mRes, aRes] = await Promise.all([
                    api.get('/library/books'),
                    api.get('/assignments')
                ]);
                setMaterials(mRes.data);
                setAssignments(aRes.data);
            } catch (err) {
                console.error('Failed to fetch ELMS data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-8 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">ELMS Portal</h1>
                    <p className="text-slate-500 font-medium">Digital Course Materials • Assignments</p>
                </div>
                <button className="px-6 py-3 bg-school-primary text-white rounded-2xl font-black 3d-button shadow-xl shadow-blue-900/20 flex items-center gap-2 uppercase tracking-tighter">
                    Upload Content <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Categories Toolbar */}
            <div className="flex flex-wrap gap-3">
                {['All Subjects', 'Science', 'Arts', 'Commerce', 'ICT'].map((tag, i) => (
                    <button key={i} className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${i === 0 ? 'bg-school-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                        {tag}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 glass-card animate-pulse" />)
                ) : (
                    materials.map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card group p-8 border border-white shadow-xl hover:shadow-2xl transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-2 h-full bg-blue-500/10 group-hover:bg-blue-500 transition-colors" />

                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-blue-500/5 rounded-2xl text-blue-600">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{item.category}</span>
                            </div>

                            <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight tracking-tight">{item.title}</h4>
                            <div className="flex items-center gap-2 mb-8">
                                <Clock className="w-3 h-3 text-slate-300" />
                                <span className="text-xs font-bold text-slate-400">Available: {item.available ?? item.quantity} • By {item.author}</span>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-xs 3d-button flex items-center justify-center gap-2">
                                    Borrow <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Assignment Section */}
            <div className="glass-card p-4 sm:p-10 border border-white shadow-2xl mt-12">
                <div className="flex justify-between items-center mb-6 sm:mb-10">
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter">Active Assignments</h4>
                    <Filter className="w-5 h-5 text-slate-400 cursor-pointer" />
                </div>
                <div className="space-y-4 sm:space-y-6">
                    {loading ? (
                        <div className="h-24 glass-card animate-pulse" />
                    ) : (
                        assignments.map((a, i) => (
                            <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-6 bg-slate-50/50 rounded-2xl gap-4 border border-slate-100/50" >
                                <div>
                                    <h5 className="text-base sm:text-lg font-black text-slate-900 mt-1">{a.title}</h5>
                                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">{a.subject} • Due {new Date(a.due_date).toLocaleDateString()}</p>
                                </div>
                                <button className="px-4 sm:px-6 py-2 sm:py-3 bg-white border border-slate-200 rounded-xl text-[10px] sm:text-xs font-black shadow-sm hover:bg-slate-50 transition-all">
                                    Submit Project
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseMaterials;
