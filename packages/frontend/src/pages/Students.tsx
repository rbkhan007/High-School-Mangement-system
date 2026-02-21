import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Search,
    GraduationCap,
    Mail,
    ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface Student {
    user_id: string;
    student_id: string;
    class: string;
    section: string;
    roll_number: number;
    user: {
        display_name: string;
        email: string;
        phone: string;
        photo_url?: string;
    };
}

const Students = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('All');

    const classes = ['All', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const query = selectedClass !== 'All' ? `?class=${selectedClass}` : '';
                const response = await api.get(`/students${query}`);
                setStudents(response.data);
            } catch {
                console.error('Failed to fetch students');
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selectedClass]);

    const filteredStudents = students.filter(student =>
        student.user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/30 transform -rotate-3">
                        <Users className="text-white w-8 h-8 rotate-3" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Student Directory</h1>
                        <p className="text-slate-500 font-medium">Manage and view all enrolled students</p>
                    </div>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    {classes.map((cls) => (
                        <button
                            key={cls}
                            onClick={() => setSelectedClass(cls)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                                selectedClass === cls
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                    : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            {cls}
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass-card p-4 relative group">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search by name, ID or record..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border-0 rounded-2xl py-4 pl-14 pr-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600 transition-all"
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 6].map(i => (
                        <div key={i} className="glass-card p-6 h-48 animate-pulse bg-slate-50 border-slate-100" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredStudents.map((student, index) => (
                            <motion.div
                                key={student.user_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="glass-card group hover:border-indigo-200 transition-all duration-300 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center border border-indigo-100 relative overflow-hidden">
                                            {student.user.photo_url ? (
                                                <img src={student.user.photo_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <GraduationCap className="text-indigo-400 w-8 h-8" />
                                            )}
                                            <div className="absolute top-0 right-0 p-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full border border-white" />
                                            </div>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                                                {student.user.display_name}
                                            </h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">ID: {student.student_id}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                                            <span className="text-slate-400 font-bold uppercase tracking-widest">Class</span>
                                            <span className="text-slate-700 font-bold bg-slate-100 px-2 py-1 rounded-lg">{student.class} - {student.section}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs py-2 border-b border-slate-50">
                                            <span className="text-slate-400 font-bold uppercase tracking-widest">Roll</span>
                                            <span className="text-slate-700 font-bold">#{student.roll_number}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs pt-1">
                                            <div className="flex-1 flex items-center gap-2 bg-slate-50 p-2 rounded-xl text-slate-500 truncate">
                                                <Mail size={14} className="text-slate-400" />
                                                <span className="truncate">{student.user.email}</span>
                                            </div>
                                            <button className="p-2 bg-slate-50 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-3 bg-slate-50/50 flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                                    <span>Member since 2024</span>
                                    <span className="text-green-600 flex items-center gap-1"><div className="w-1 h-1 bg-green-500 rounded-full" /> Active</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {!loading && filteredStudents.length === 0 && (
                <div className="glass-card p-20 text-center border-dashed border-2 border-slate-200">
                    <Search className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-600">No matching search results</h3>
                    <p className="text-slate-400 mt-2">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
};

export default Students;
