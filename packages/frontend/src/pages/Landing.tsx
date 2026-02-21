
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap,
    ArrowRight,
    Users,
    BookOpen,
    ShieldCheck,
    Bell,
    Globe,
    Award
} from 'lucide-react';
import Footer from '../components/Footer';
import { useState, useEffect } from 'react';
import api from '../services/api';

const Landing = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/public/stats');
                setStats(res.data);
            } catch (err) {
                console.error('Failed to fetch public stats');
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-school-background overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass-card px-8 py-4 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-school-primary rounded-xl 3d-button">
                        <GraduationCap className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold text-school-primary tracking-tight">BASUDEVPUR HS</span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/feedback')}
                        className="px-4 py-2 text-sm font-semibold text-school-primary hover:bg-white/20 rounded-lg transition-all"
                    >
                        Public Feedback
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2 bg-school-primary text-white rounded-xl font-bold 3d-button shadow-lg shadow-blue-900/20"
                    >
                        Portal Login
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-8 flex flex-col items-center text-center max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative"
                >
                    {/* Decorative Elements */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-school-primary/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-school-secondary/10 rounded-full blur-3xl animate-pulse delay-700" />

                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-6 leading-tight">
                        The Future of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-school-primary to-blue-500">
                            Education
                        </span> is Here.
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                        Welcome to Basudebpur High School's fully computerized Management System.
                        Real-time tracking, AI-powered communication, and elite-grade administration.
                    </p>

                    <div className="flex flex-wrap justify-center gap-6">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-10 py-5 bg-school-primary text-white rounded-2xl font-black text-lg 3d-button flex items-center gap-3 shadow-2xl shadow-blue-900/40"
                        >
                            Enter Dashboard <ArrowRight className="w-6 h-6" />
                        </button>
                        <button className="px-10 py-5 bg-white text-school-primary border-2 border-school-primary/10 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all flex items-center gap-3">
                            Explore Features
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* Stats Section */}
            <section className="px-8 py-20 bg-slate-50/50">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { label: 'Students', value: stats?.students || '1,200+', icon: Users, color: 'text-blue-600' },
                        { label: 'Classes', value: stats?.classes || '45+', icon: BookOpen, color: 'text-amber-600' },
                        { label: 'Security', value: '100%', icon: ShieldCheck, color: 'text-green-600' },
                        { label: 'Bilingual', value: 'EN/BN', icon: Globe, color: 'text-indigo-600' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-8 flex flex-col items-center text-center shadow-xl shadow-slate-200/50 border border-white"
                        >
                            <stat.icon className={`w-10 h-10 mb-4 ${stat.color}`} />
                            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                            <p className="text-slate-500 font-bold uppercase tracking-wider text-xs mt-1">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Feature Highlight */}
            <section className="px-8 py-24 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Institutional Excellence.</h2>
                    <p className="text-slate-500 font-medium">Equipping Basudebpur with world-class digital infrastructure.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {[
                        {
                            title: 'AI Translation',
                            desc: 'Seamless English-Bangla notices powered by Google Gemini Pro.',
                            icon: Globe,
                            accent: 'bg-blue-500'
                        },
                        {
                            title: 'Real-time Sync',
                            desc: 'Instant attendance alerts and live score broadcasts via Socket.IO.',
                            icon: Bell,
                            accent: 'bg-amber-500'
                        },
                        {
                            title: 'Scouts Section',
                            desc: 'Comprehensive management for the school Scouts unit and activities.',
                            icon: Award,
                            accent: 'bg-green-500'
                        }
                    ].map((feature, i) => (
                        <div key={i} className="group p-10 rounded-3xl bg-white border border-slate-100 hover:border-school-primary/20 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                            <div className={`w-16 h-16 ${feature.accent} rounded-2xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform shadow-lg shadow-${feature.accent}/20`}>
                                <feature.icon className="text-white w-8 h-8" />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h4>
                            <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default Landing;
