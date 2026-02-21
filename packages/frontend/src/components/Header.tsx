import { Menu, X, GraduationCap } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
    sidebarOpen: boolean;
}

const Header = ({ onMenuClick, sidebarOpen }: HeaderProps) => {
    return (
        <header className="lg:hidden h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-school-primary rounded-lg flex items-center justify-center shadow-md shadow-blue-500/30">
                    <GraduationCap className="text-white w-5 h-5" />
                </div>
                <h1 className="font-bold text-sm text-slate-800 tracking-tight leading-tight">
                    Basudebpur<br />
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">High School</span>
                </h1>
            </div>

            <button
                onClick={onMenuClick}
                className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        </header>
    );
};

export default Header;
