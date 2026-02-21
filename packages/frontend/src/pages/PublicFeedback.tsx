import React, { useState } from 'react';
import api from '../services/api';
import { MessageSquare, Star, Send, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const PublicFeedback = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '', rating: 5 });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/feedback', formData);
            setSubmitted(true);
        } catch (error) {
            console.error('Feedback failed');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-12 text-center max-w-md">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30">
                        <Send className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-4">Thank You!</h1>
                    <p className="text-slate-600 font-medium">Your feedback has been submitted successfully. We appreciate your input on the Basudebpur High School Management System.</p>
                    <button onClick={() => setSubmitted(false)} className="mt-8 btn-3d-primary w-full">Submit Another</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-mesh py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-school-primary rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-4 floating transform rotate-12">
                        <MessageSquare className="text-white w-8 h-8 -rotate-12" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-800 tracking-tight leading-tight">System Feedback</h1>
                    <p className="text-slate-500 mt-2 font-medium">Your thoughts help us improve the school ecosystem</p>
                </div>

                <form onSubmit={handleSubmit} className="glass-card p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Name (Optional)</label>
                            <input
                                type="text"
                                className="input-3d"
                                placeholder="Your Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email (Optional)</label>
                            <input
                                type="email"
                                className="input-3d"
                                placeholder="email@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Message</label>
                        <textarea
                            required
                            rows={4}
                            className="input-3d resize-none"
                            placeholder="What do you think about the system?"
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-4 ml-1">Overall Rating</label>
                        <div className="flex justify-between gap-2 max-w-sm">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:translate-y-1",
                                        formData.rating >= star
                                            ? "bg-school-secondary text-white shadow-yellow-500/30 scale-110"
                                            : "bg-white text-slate-300 border-2 border-slate-100 shadow-slate-200/20"
                                    )}
                                >
                                    <Star size={24} fill={formData.rating >= star ? "currentColor" : "none"} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-3d-primary py-4 flex items-center justify-center gap-2 group text-lg"
                    >
                        {loading ? 'Submitting...' : 'Send Feedback'}
                        {!loading && <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    </button>
                </form>

                <div className="mt-12 text-center text-slate-400 font-medium flex items-center justify-center gap-2">
                    <GraduationCap size={20} />
                    <span className="text-xs uppercase tracking-widest font-bold">Basudebpur High School © 2026</span>
                </div>
            </div>
        </div>
    );
};

export default PublicFeedback;
