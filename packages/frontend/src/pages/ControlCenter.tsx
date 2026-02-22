import { useAuth } from '../context/auth-context';
import HeadmasterDashboard from './dashboards/HeadmasterDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import StudentDashboard from './dashboards/StudentDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import CommitteeDashboard from './dashboards/CommitteeDashboard';

const ControlCenter = () => {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    switch (user.role) {
        case 'HEADMASTER':
        case 'ADMIN':
            return <HeadmasterDashboard />;
        case 'TEACHER':
            return <TeacherDashboard />;
        case 'STUDENT':
            return <StudentDashboard />;
        case 'PARENT':
            return <ParentDashboard />;
        case 'COMMITTEE':
            return <CommitteeDashboard />;
        default:
            return (
                <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-800">Welcome to Basudebpur High School</h2>
                        <p className="text-slate-500 mt-2">Your dashboard is currently being set up.</p>
                    </div>
                </div>
            );
    }
};

export default ControlCenter;
