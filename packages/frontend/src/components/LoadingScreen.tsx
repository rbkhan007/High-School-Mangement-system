import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-school-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-school-secondary/10 rounded-full blur-[120px] animate-pulse delay-700" />

            <div className="relative text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative"
                >
                    {/* Glowing Ring */}
                    <motion.div
                        animate={{
                            rotate: 360,
                            scale: [1, 1.05, 1]
                        }}
                        transition={{
                            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="w-32 h-32 border-4 border-dashed border-school-primary/30 rounded-full mx-auto"
                    />

                    {/* Central Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                            animate={{
                                y: [0, -8, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="w-20 h-20 bg-school-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-school-primary/40 transform rotate-12"
                        >
                            <GraduationCap className="text-white w-12 h-12 -rotate-12" />
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mt-12 space-y-4"
                >
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                        Basudebpur High School
                    </h2>
                    <div className="flex items-center justify-center gap-2">
                        <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.3, 1, 0.3]
                                    }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        delay: i * 0.2
                                    }}
                                    className="w-1.5 h-1.5 bg-school-primary rounded-full"
                                />
                            ))}
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em] ml-2">
                            Initializing System
                        </span>
                    </div>
                </motion.div>

                {/* System Status Decorative Bar */}
                <div className="mt-12 w-48 h-1 bg-slate-200/50 rounded-full mx-auto overflow-hidden relative">
                    <motion.div
                        animate={{
                            left: ["-100%", "100%"]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-school-primary to-transparent"
                    />
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
