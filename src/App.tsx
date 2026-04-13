import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminLayout from './components/AdminLayout';
import Events from './pages/Events';
import Attendees from './pages/Attendees';
import CreateEvent from './pages/CreateEvent';
import Categories from './pages/Categories';
import Analytics from './pages/Analytics';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Ads from './pages/Ads';
import Marketing from './pages/Marketing';
import Team from './pages/Team';
import BulkTickets from './pages/BulkTickets';
import SeatMapDesigner from './pages/SeatMapDesigner';
import AdminControl from './pages/AdminControl';

import { AppProvider, useApp, type PermissionRoute } from './context/AppContext';

const ProtectedRoute = ({ route, children }: { route: PermissionRoute, children: React.ReactNode }) => {
  const { currentAdminUser } = useApp();
  
  if (!currentAdminUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (!currentAdminUser.permissions.includes(route)) {
    const fallbackRoute = currentAdminUser.permissions.length > 0 ? currentAdminUser.permissions[0] : '/login';
    return <Navigate to={fallbackRoute} replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AppProvider>
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(30, 32, 44, 0.95)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '16px 24px',
            fontSize: '15px',
            fontWeight: 600,
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#fff',
            },
          }
        }}
      />
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Admin Workspace Routes */}
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<ProtectedRoute route="/dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="events" element={<ProtectedRoute route="/events"><Events /></ProtectedRoute>} />
            <Route path="attendees" element={<ProtectedRoute route="/attendees"><Attendees /></ProtectedRoute>} />
            <Route path="create-event" element={<ProtectedRoute route="/create-event"><CreateEvent /></ProtectedRoute>} />
            <Route path="categories" element={<ProtectedRoute route="/categories"><Categories /></ProtectedRoute>} />
            <Route path="ads" element={<ProtectedRoute route="/ads"><Ads /></ProtectedRoute>} />
            <Route path="marketing" element={<ProtectedRoute route="/marketing"><Marketing /></ProtectedRoute>} />
            <Route path="analytics" element={<ProtectedRoute route="/analytics"><Analytics /></ProtectedRoute>} />
            <Route path="finance" element={<ProtectedRoute route="/finance"><Finance /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute route="/reports"><Reports /></ProtectedRoute>} />
            <Route path="team" element={<ProtectedRoute route="/team"><Team /></ProtectedRoute>} />
            <Route path="bulk-tickets" element={<ProtectedRoute route="/bulk-tickets"><BulkTickets /></ProtectedRoute>} />
            <Route path="seat-map" element={<ProtectedRoute route="/seat-map"><SeatMapDesigner /></ProtectedRoute>} />
            <Route path="admin-control" element={<ProtectedRoute route="/admin-control"><AdminControl /></ProtectedRoute>} />

            <Route path="settings" element={<ProtectedRoute route="/settings"><Settings /></ProtectedRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </AppProvider>
  );
}

export default App;
