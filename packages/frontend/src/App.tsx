import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/auth-context';
import { SocketProvider } from './context/socket-context';
import LoadingScreen from './components/LoadingScreen';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Notices from './pages/Notices';
import Attendance from './pages/Attendance';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Routine from './pages/Routine';
import Grievances from './pages/Grievances';
import AcademicDocs from './pages/AcademicDocs';
import ControlCenter from './pages/ControlCenter';
import ScoutsPortal from './pages/ScoutsPortal';
import CourseMaterials from './pages/ELMS';
import AdminDataOverview from './pages/AdminDataOverview';
import PublicFeedback from './pages/PublicFeedback';
import Landing from './pages/Landing';

const ProtectedRoute = ({ children, roles }: { children?: React.ReactNode, roles?: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return children ? <>{children}</> : null;
};

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="min-h-screen font-sans selection:bg-school-primary/10 selection:text-school-primary">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/feedback" element={<PublicFeedback />} />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<ControlCenter />} />
              <Route path="/students" element={<Students />} />
              <Route path="/teachers" element={<Teachers />} />
              <Route path="/routine" element={<Routine />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/exams" element={<AcademicDocs />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/grievances" element={<Grievances />} />
              <Route path="/scouts" element={<ScoutsPortal />} />
              <Route path="/lms" element={<CourseMaterials />} />
              <Route path="/admin/data" element={<ProtectedRoute roles={['HEADMASTER']}><AdminDataOverview /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
