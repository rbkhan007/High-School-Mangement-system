import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    UserSquare2,
    Calendar,
    ClipboardList,
    FileSpreadsheet,
    ShieldAlert,
    Award,
    Bell,
    MessageSquare,
    BookOpen,
    Settings,
    LogOut,
    GraduationCap,
    Database,
    X
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { cn } from '../utils/cn';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { user, logout } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT', 'COMMITTEE'] },
        { name: 'Students', icon: Users, path: '/students', roles: ['HEADMASTER', 'TEACHER'] },
        { name: 'Teachers', icon: UserSquare2, path: '/teachers', roles: ['HEADMASTER'] },
        { name: 'Routine', icon: Calendar, path: '/routine', roles: ['HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT'] },
        { name: 'Attendance', icon: ClipboardList, path: '/attendance', roles: ['TEACHER', 'HEADMASTER'] },
        { name: 'Exams & Results', icon: FileSpreadsheet, path: '/exams', roles: ['HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT'] },
        { name: 'Bilingual Notices', icon: Bell, path: '/notices', roles: ['HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT', 'COMMITTEE'] },
        { name: 'Grievance Desk', icon: ShieldAlert, path: '/grievances', roles: ['STUDENT', 'COMMITTEE'] },
        { name: 'Scouts Unit', icon: Award, path: '/scouts', roles: ['HEADMASTER', 'TEACHER', 'STUDENT'] },
        { name: 'ELMS / Resources', icon: BookOpen, path: '/lms', roles: ['TEACHER', 'STUDENT'] },
        { name: 'Feedback', icon: MessageSquare, path: '/feedback', roles: ['HEADMASTER', 'TEACHER', 'STUDENT', 'PARENT', 'COMMITTEE'] },
        { name: 'Data Hub', icon: Database, path: '/admin/data', roles: ['HEADMASTER'] },
        { name: 'School Settings', icon: Settings, path: '/settings', roles: ['HEADMASTER'] },
    ];

    const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <div className={cn(
                "w-64 min-h-screen glass-card lg:m-4 p-4 flex flex-col fixed left-0 top-0 bottom-0 overflow-y-auto z-50 transition-transform duration-300 lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 px-4 py-6 mb-4">
                    <div className="w-10 h-10 bg-school-primary rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50 transform rotate-12">
                        <GraduationCap className="text-white w-6 h-6 -rotate-12" />
                    </div>
                    <h1 className="font-bold text-xl text-slate-800 tracking-tight leading-tight">Basudebpur<br /><span className="text-xs text-slate-500 uppercase tracking-widest">High School</span></h1>
                </div>

                <nav className="flex-1 space-y-1">
                    {filteredMenu.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => {
                                if (window.innerWidth < 1024) onClose();
                            }}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group",
                                isActive
                                    ? "bg-school-primary text-white shadow-lg shadow-school-primary/30 scale-105"
                                    : "text-slate-600 hover:bg-slate-100 hover:text-school-primary"
                            )}
                        >
                            <item.icon size={20} className={cn("transition-transform group-hover:scale-110")} />
                            <span className="font-medium">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-3 px-4 py-4 mb-2 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                        <div className="w-10 h-10 bg-gradient-to-br from-school-primary to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-school-primary/20">
                            {user?.display_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{user?.display_name || 'System User'}</p>
                            <p className="text-[10px] font-bold text-school-primary uppercase tracking-tighter opacity-80">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-school-error hover:bg-red-50 rounded-2xl transition-colors group"
                    >
                        <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
