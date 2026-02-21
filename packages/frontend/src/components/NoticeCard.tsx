
import { Bell, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

import { Notice } from '@school/shared';

interface NoticeProps {
    notice: Notice;
    language: 'en' | 'bn';
}

const NoticeCard = ({ notice, language }: NoticeProps) => {
    const title = language === 'en' ? notice.title_en : (notice.title_bn || notice.title_en);
    const content = language === 'en' ? notice.content_en : (notice.content_bn || notice.content_en);

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={cn(
                "glass-card p-6 relative overflow-hidden group border-l-8",
                notice.urgent ? "border-l-red-500 bg-red-50/30" : "border-l-school-primary"
            )}
        >
            <div className="flex justify-between items-start mb-4 text-sm">
                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform",
                    notice.urgent ? "bg-red-500 shadow-red-500/30" : "bg-school-primary shadow-school-primary/30"
                )}>
                    <Bell className="text-white w-6 h-6" />
                </div>
                <div className="flex flex-col items-end text-xs font-bold text-slate-500 uppercase tracking-widest gap-1">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(notice.created_at).toLocaleDateString()}</span>
                    {notice.urgent && <span className="text-red-500 animate-pulse bg-red-100 px-2 py-0.5 rounded-full">Urgent</span>}
                </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2 truncate group-hover:text-school-primary transition-colors">{title}</h3>
            <p className="text-slate-600 line-clamp-3 mb-6 font-medium leading-relaxed">
                {content}
            </p>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                <div className="flex items-center gap-2 text-slate-500">
                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-[10px] text-slate-400">HM</div>
                    <span className="text-xs font-bold uppercase tracking-wider">Office of Headmaster</span>
                </div>
                <button className="text-school-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Details <ArrowRight size={16} />
                </button>
            </div>
        </motion.div>
    );
};

export default NoticeCard;
