import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ClipboardList,
    Calendar as CalendarIcon,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronRight,
    Save,
    Filter,
    Users
} from 'lucide-react';
import api from '../services/api';
import { cn } from '../utils/cn';

interface User {
    id: string;
    display_name: string;
    email: string;
}

interface Student {
    user_id: string;
    student_id: string;
    roll_number: number;
    user: User;
}

interface Class {
    id: string;
    name: string;
    section: string;
}

const Attendance = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<Student[]>([]);
    const [records, setRecords] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0 });

    const fetchClasses = useCallback(async () => {
        try {
            const response = await api.get('/classes');
            setClasses(response.data);
            if (response.data.length > 0 && !selectedClass) setSelectedClass(response.data[0].id);
        } catch {
            console.error('Failed to fetch classes');
        }
    }, [selectedClass]);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const cls = classes.find(c => c.id === selectedClass);
            if (!cls) return;

            const response = await api.get(`/students?class=${cls.name}&section=${cls.section}`);
            setStudents(response.data);

            const initialRecords: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
            response.data.forEach((s: Student) => {
                initialRecords[s.user_id] = 'PRESENT';
            });
            setRecords(prev => ({ ...initialRecords, ...prev }));
        } catch {
            console.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    }, [classes, selectedClass]);

    const fetchExistingAttendance = useCallback(async () => {
        try {
            const response = await api.get(`/attendance/reports?date=${date}&class_id=${selectedClass}`);
            if (response.data.length > 0) {
                const existingRecords: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
                response.data.forEach((att: { student_id: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }) => {
                    existingRecords[att.student_id] = att.status;
                });
                setRecords(existingRecords);
            }
        } catch {
            console.error('Failed to fetch existing attendance');
        }
    }, [date, selectedClass]);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    useEffect(() => {
        if (selectedClass) {
            fetchStudents();
            fetchExistingAttendance();
        }
    }, [selectedClass, date, fetchStudents, fetchExistingAttendance]);

    useEffect(() => {
        const counts = Object.values(records).reduce((acc, status) => {
            acc[status.toLowerCase() as keyof typeof acc]++;
            return acc;
        }, { present: 0, absent: 0, late: 0 });
        setStats(counts);
    }, [records]);

    const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
        setRecords(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const attendanceData = {
                date,
                class_id: selectedClass,
                records: Object.entries(records).map(([student_id, status]) => ({
                    student_id,
                    status
                }))
            };
            await api.post('/attendance', attendanceData);
            alert('Attendance marked successfully');
        } catch {
            console.error('Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-school-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-school-primary/30 transform rotate-3">
                        <ClipboardList className="text-white w-8 h-8 -rotate-3" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Attendance Tracker</h1>
                        <p className="text-slate-500 font-medium whitespace-nowrap">Daily student presence management</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Present', value: stats.present, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
                        { label: 'Absent', value: stats.absent, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
                        { label: 'Late', value: stats.late, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
                    ].map((s) => (
                        <div key={s.label} className={cn("px-4 py-3 rounded-2xl border border-slate-100 flex items-center gap-3", s.bg)}>
                            <s.icon className={cn("w-5 h-5", s.color)} />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{s.label}</p>
                                <p className={cn("text-lg font-bold leading-tight", s.color)}>{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="glass-card p-6 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Class</label>
                    <div className="relative group">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-school-primary transition-colors" size={18} />
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full bg-slate-50 border-0 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-school-primary transition-all appearance-none cursor-pointer"
                        >
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" size={18} />
                    </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Academic Date</label>
                    <div className="relative group">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-school-primary transition-colors" size={18} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-slate-50 border-0 rounded-2xl py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 focus:ring-2 focus:ring-school-primary transition-all cursor-pointer pl-11 pr-4"
                        />
                    </div>
                </div>

                <div className="flex items-end h-full">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading || students.length === 0}
                        className="btn-3d-primary py-3.5 px-8 flex items-center gap-2 group disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={20} />
                        )}
                        <span className="font-bold">Sync to Database</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        Student Board <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">{students.length} Total</span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Filter size={14} />
                        <span>Filter by Roll</span>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="glass-card p-4 h-24 animate-pulse bg-slate-50 border-slate-100" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {students.map((student, index) => (
                                <motion.div
                                    key={student.user_id}
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={cn(
                                        "glass-card p-4 border-2 transition-all duration-300 relative group overflow-hidden",
                                        records[student.user_id] === 'PRESENT' ? "border-green-100/50 bg-green-50/5" :
                                            records[student.user_id] === 'ABSENT' ? "border-red-100/50 bg-red-50/5" :
                                                "border-amber-100/50 bg-amber-50/5"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200/50">
                                                {student.roll_number}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 text-sm truncate">{student.user.display_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{student.student_id}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'PRESENT', label: 'Present', color: 'bg-green-500', hover: 'hover:bg-green-600', icon: CheckCircle2 },
                                            { id: 'ABSENT', label: 'Absent', color: 'bg-red-500', hover: 'hover:bg-red-600', icon: XCircle },
                                            { id: 'LATE', label: 'Late', color: 'bg-amber-500', hover: 'hover:bg-amber-600', icon: Clock }
                                        ].map((btn) => (
                                            <button
                                                key={btn.id}
                                                onClick={() => handleStatusChange(student.user_id, btn.id as 'PRESENT' | 'ABSENT' | 'LATE')}
                                                className={cn(
                                                    "py-2 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center gap-1",
                                                    records[student.user_id] === btn.id
                                                        ? `${btn.color} text-white shadow-lg ring-2 ring-offset-1 ring-${btn.color}/30`
                                                        : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
                                                )}
                                            >
                                                <btn.icon size={14} />
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="absolute -bottom-2 -right-2 opacity-[0.03] pointer-events-none transition-opacity group-hover:opacity-[0.07]">
                                        <ClipboardList size={80} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {!loading && students.length === 0 && (
                    <div className="glass-card p-12 text-center border-dashed border-2 border-slate-200">
                        <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-slate-500">No students found</h4>
                        <p className="text-slate-400 text-sm">Please verify the class and section selection.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Attendance;
