import React from 'react';
import './App.css'; // Import custom styles

const App = () => {
  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <ul>
          <li><img src='/assets/home.png' alt="Home" className="sidebar-logo" /></li>
          <li><img src='/assets/live.png' alt="Live Classes" className="sidebar-logo" /></li>
          <li><img src='/assets/records.png' alt="Recordings" className="sidebar-logo" /></li>
          <li><img src='/assets/schedule.png' alt="Schedule" className="sidebar-logo" /></li>
          <li><img src='/assets/site.png' alt="Main Site" className="sidebar-logo" /></li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>Homepage</h1>

        <div className="card-container">
          {/* Card 1 */}
          <div className="card">
            <h3>Live Classes</h3>
            <img src='/assets/live.gif' alt="Live Classes" className="card-img" />
          </div>

          {/* Card 2 */}
          <div className="card">
            <h3>Recordings</h3>
            <img src='/assets/records.gif' alt="Recordings" className="card-img" />
          </div>

          {/* Card 3 */}
          <div className="card">
            <h3>Schedule</h3>
            <img src='/assets/schedule.gif' alt="Schedule" className="card-img" />
          </div>

          {/* Card 4 */}
          <a href='https://www.cybertech242.com' target='_blank' rel="noreferrer">
          <div className="card">
            <h3>Site</h3>
            <img src='/assets/site.gif' alt="Main Site" className="card-img" />
          </div>
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
