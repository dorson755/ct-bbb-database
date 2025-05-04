import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import LiveClasses from './LiveClasses';
import RecordingsPage from './RecordingsPage';
import SchedulePage from './SchedulePage';
import StudentManager from './StudentManager';
import Enrollments from './Enrollments';
import { NotificationProvider } from './NotificationContext';
import Admin from './Admin';
import Login from './Login';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  const userRole = token ? JSON.parse(atob(token.split('.')[1]))?.role : null;

  if (!token) return <Navigate to="/login" replace />;
  if (requireAdmin && userRole !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const App = () => {
  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <Router>
      <NotificationProvider>
        <div className="app-container">
          <div className="sidebar">
            <ul>
              <li><Link to="/"><img src='/assets/home.png' alt="Home" className="sidebar-logo" /></Link></li>
              <li><Link to="/live-classes"><img src='/assets/live.png' alt="Live Classes" className="sidebar-logo" /></Link></li>
              <li><Link to="/recordings"><img src='/assets/records.png' alt="Recordings" className="sidebar-logo" /></Link></li>
              <li><Link to="/schedule"><img src='/assets/schedule.png' alt="Schedule" className="sidebar-logo" /></Link></li>
              <li><Link to="/student-manager"><img src='/assets/search.png' alt="Student Manager" className="sidebar-logo" /></Link></li>
              <li><Link to="/enrollments"><img src='/assets/enrollments.png' alt="Enrollments" className="sidebar-logo" /></Link></li>
              <li><button onClick={logout} className="logout-button">
                <img src='/assets/logout.png' alt="Logout" className="sidebar-logo" />
              </button></li>
            </ul>
          </div>

          <div className="main-content">
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  {/* Home content */}
                </ProtectedRoute>
              } />

              {/* Protected routes */}
              <Route path="/live-classes" element={<ProtectedRoute><LiveClasses /></ProtectedRoute>} />
              <Route path="/recordings" element={<ProtectedRoute><RecordingsPage /></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
              <Route path="/student-manager" element={<ProtectedRoute><StudentManager /></ProtectedRoute>} />
              <Route path="/enrollments" element={<ProtectedRoute><Enrollments /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            </Routes>
          </div>
        </div>
      </NotificationProvider>
    </Router>
  );
};

export default App;