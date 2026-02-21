import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    BookOpen,
    Layout
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface RoutineItem {
    id: string;
    day: string;
    period_number: number;
    subject: string;
    start_time: string;
    end_time: string;
    teacher: {
        user: {
            display_name: string;
        }
    };
}

interface Class {
    id: string;
    name: string;
    section: string;
}

const Routine = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [routine, setRoutine] = useState<RoutineItem[]>([]);
    const [loading, setLoading] = useState(false);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const periods = [1, 2, 3, 4, 5, 6, 7];

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const response = await api.get('/classes');
                setClasses(response.data);
                if (response.data.length > 0) setSelectedClass(response.data[0].id);
            } catch {
                console.error('Failed to fetch classes');
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        const fetchRoutine = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/routines?class_id=${selectedClass}`);
                setRoutine(response.data);
            } catch {
                console.error('Failed to fetch routine');
            } finally {
                setLoading(false);
            }
        };
        if (selectedClass) {
            fetchRoutine();
        }
    }, [selectedClass]);

    const getPeriodContent = (day: string, period: number) => {
        return routine.find(item => item.day === day && item.period_number === period);
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-600/30 transform rotate-3">
                        <Calendar className="text-white w-8 h-8 -rotate-3" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Academic Routine</h1>
                        <p className="text-slate-500 font-medium">Digital timetable and period schedule</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200">
                    <Layout className="text-slate-400 ml-2" size={18} />
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="bg-transparent border-0 text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer pr-10"
                    >
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                        ))}
                    </select>
                </div>
            </div>

            <p className="lg:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest text-center animate-pulse">
                ← Swipe to view full timetable →
            </p>

            {loading ? (
                <div className="glass-card p-12 h-[500px] animate-pulse bg-slate-50 border-slate-100" />
            ) : (
                <div className="overflow-x-auto rounded-3xl border border-slate-100 shadow-sm glass-card bg-white/40 no-scrollbar">
                    <table className="w-full border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-6 text-left border-r border-slate-100 w-32">
                                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Day / Period</span>
                                </th>
                                {periods.map(p => (
                                    <th key={p} className="p-6 text-center border-r border-slate-100 min-w-[160px]">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-black text-slate-800">Period {p}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Core Session</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map((day, dIdx) => (
                                <tr key={day} className={cn("border-t border-slate-100", dIdx % 2 === 0 ? "bg-white/40" : "bg-slate-50/20")}>
                                    <td className="p-6 font-bold text-slate-800 border-r border-slate-100">
                                        {day}
                                    </td>
                                    {periods.map(p => {
                                        const period = getPeriodContent(day, p);
                                        return (
                                            <td key={`${day}-${p}`} className="p-3 border-r border-slate-100 last:border-r-0">
                                                <AnimatePresence mode="wait">
                                                    {period ? (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <BookOpen className="text-emerald-500" size={12} />
                                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{period.subject}</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <p className="text-xs font-bold text-slate-700 truncate">{period.teacher.user.display_name}</p>
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                                    <Clock size={10} />
                                                                    <span>{period.start_time} - {period.end_time}</span>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ) : (
                                                        <div className="h-24 flex items-center justify-center grayscale opacity-10">
                                                            <Layout size={24} />
                                                        </div>
                                                    )}
                                                </AnimatePresence>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-l-4 border-l-amber-500 bg-amber-50/5">
                    <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-2">Tiffin Break</h5>
                    <p className="text-sm font-bold text-slate-700">Scheduled after Period 4</p>
                    <p className="text-xs text-slate-500 mt-1">Duration: 30 minutes of rest and refreshment.</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-emerald-500 bg-emerald-50/5">
                    <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2">Morning Assembly</h5>
                    <p className="text-sm font-bold text-slate-700">Daily at 10:00 AM</p>
                    <p className="text-xs text-slate-500 mt-1">Mandatory for all students and staff.</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-l-rose-500 bg-rose-50/5">
                    <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] mb-2">Extra-Curricular</h5>
                    <p className="text-sm font-bold text-slate-700">Thursday Periods 6-7</p>
                    <p className="text-xs text-slate-500 mt-1">Club activities, Scouts, and Sports.</p>
                </div>
            </div>
        </div>
    );
};

export default Routine;
