import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    QrCode,
    Download,
    Search,
    FileText,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { useEffect } from 'react';
import api from '../services/api';

const AcademicDocs = () => {
    const [activeTab, setActiveTab] = useState<'admit' | 'results'>('admit');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'results') {
            const fetchResults = async () => {
                setLoading(true);
                try {
                    const res = await api.get('/exams/results');
                    setResults(res.data);
                } catch (err) {
                    console.error('Failed to fetch results');
                } finally {
                    setLoading(false);
                }
            };
            fetchResults();
        }
    }, [activeTab]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Academic Documents</h1>
                <p className="text-slate-500 font-medium">Auto-generated Admit Cards & Marksheets</p>
            </div>

            <div className="flex gap-4 p-1 bg-slate-100/50 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('admit')}
                    className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'admit' ? 'bg-white shadow-lg text-school-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Admit Cards
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'results' ? 'bg-white shadow-lg text-school-primary' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Result Sheets
                </button>
            </div>

            <div className="glass-card p-8 border border-white shadow-2xl shadow-slate-200/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder={`Search student for ${activeTab}...`}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black 3d-button shadow-xl shadow-slate-900/20">
                            Generate All <FileText className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'admit' ? (
                        <motion.div
                            key="admit-tab"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            <motion.div
                                key="admit-tab"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex items-center justify-center p-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/10"
                            >
                                <div className="text-center">
                                    <QrCode className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                    <h4 className="text-xl font-bold text-slate-400">Search for a Student ID</h4>
                                    <p className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-widest">Enter ID above to generate admit card</p>
                                </div>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results-tab"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="overflow-x-auto"
                        >
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 font-black text-slate-400 text-xs uppercase tracking-widest">
                                        <th className="pb-6">Student</th>
                                        <th className="pb-6">Roll</th>
                                        <th className="pb-6 text-center">GPA</th>
                                        <th className="pb-6 text-center">Status</th>
                                        <th className="pb-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={5} className="py-10 text-center animate-pulse text-slate-400 font-bold">Loading Academic Records...</td></tr>
                                    ) : (
                                        results.map((row, i) => (
                                            <motion.tr
                                                key={row.id || i}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="group"
                                            >
                                                <td className="py-6">
                                                    <span className="font-bold text-slate-900">{row.student?.user?.display_name || row.name}</span>
                                                </td>
                                                <td className="py-6 font-black text-slate-400">{row.exam?.roll || row.roll || 'N/A'}</td>
                                                <td className="py-6 text-center">
                                                    <span className="px-3 py-1 bg-school-primary/5 text-school-primary rounded-lg font-black">
                                                        {row.grade || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-6 text-center">
                                                    {row.grade !== 'F' ? (
                                                        <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-amber-500 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="py-6 text-right">
                                                    <button className="p-3 hover:bg-slate-100 rounded-xl transition-all">
                                                        <Download className="w-5 h-5 text-slate-400" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AcademicDocs;
