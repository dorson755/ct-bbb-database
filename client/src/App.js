// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css'; // Import custom styles
import 'bootstrap/dist/css/bootstrap.min.css';
import LiveClasses from './LiveClasses'; // Import Live Classes component
import RecordingsPage from './RecordingsPage'; // Import Recordings Page component
import SchedulePage from './SchedulePage'; // Import Schedule Page component
import { NotificationProvider } from './NotificationContext'; // Import Notification Provider

const App = () => {
  return (
    <Router>
      <NotificationProvider>
        <div className="app-container">
          {/* Sidebar */}
          <div className="sidebar">
            <ul>
              <li><Link to="/"><img src='/assets/home.png' alt="Home" className="sidebar-logo" /></Link></li>
              <li><Link to="/live-classes"><img src='/assets/live.png' alt="Live Classes" className="sidebar-logo" /></Link></li>
              <li><Link to="/recordings"><img src='/assets/records.png' alt="Recordings" className="sidebar-logo" /></Link></li>
              <li><Link to="/schedule"><img src='/assets/schedule.png' alt="Schedule" className="sidebar-logo" /></Link></li>
              <li><a href='https://www.cybertech242.com' target='_blank' rel="noreferrer">
                <img src='/assets/site.png' alt="Main Site" className="sidebar-logo" />
              </a></li>
            </ul>
          </div>

          {/* Main Content with Routes */}
          <div className="main-content">
            <Routes>
              {/* Home Route */}
              <Route path="/" element={
                <>
                  <h1>Homepage</h1>
                  <div className="card-container">
                    <Link to="/live-classes">
                      <div className="card">
                        <h3>Live Classes</h3>
                        <img src='/assets/live.gif' alt="Live Classes" className="card-img" />
                      </div>
                    </Link>
                    <Link to="/recordings">
                      <div className="card">
                        <h3>Recordings</h3>
                        <img src='/assets/records.gif' alt="Recordings" className="card-img" />
                      </div>
                    </Link>
                    <Link to="/schedule">
                      <div className="card">
                        <h3>Schedule</h3>
                        <img src='/assets/schedule.gif' alt="Schedule" className="card-img" />
                      </div>
                    </Link>
                    <a href='https://www.cybertech242.com' target='_blank' rel="noreferrer">
                      <div className="card">
                        <h3>Site</h3>
                        <img src='/assets/site.gif' alt="Main Site" className="card-img" />
                      </div>
                    </a>
                  </div>
                </>
              } />

              {/* Live Classes Route */}
              <Route path="/live-classes" element={<LiveClasses />} />

              {/* Recordings Page Route */}
              <Route path="/recordings" element={<RecordingsPage />} />

              {/* Schedule Page Route */}
              <Route path="/schedule" element={<SchedulePage />} />
            </Routes>
          </div>
        </div>
      </NotificationProvider>
    </Router>
  );
};

export default App;
