import React from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import './App.css'; // Import custom styles
import LiveClasses from './LiveClasses'; // Import Live Classes component

const App = () => {
  return (
    <Router>
      <div className="app-container">
        {/* Sidebar */}
        <div className="sidebar">
          <ul>
            <li><Link to="/"><img src='/assets/home.png' alt="Home" className="sidebar-logo" /></Link></li>
            <li><Link to="/live-classes"><img src='/assets/live.png' alt="Live Classes" className="sidebar-logo" /></Link></li>
            <li><img src='/assets/records.png' alt="Recordings" className="sidebar-logo" /></li>
            <li><img src='/assets/schedule.png' alt="Schedule" className="sidebar-logo" /></li>
            <li><a href='https://www.cybertech242.com' target='_blank' rel="noreferrer">
              <img src='/assets/site.png' alt="Main Site" className="sidebar-logo" />
            </a></li>
          </ul>
        </div>

        {/* Main Content with Routes */}
        <div className="main-content">
          <Switch>
            {/* Home Route */}
            <Route path="/" exact>
              <h1>Homepage</h1>
              <div className="card-container">
                <div className="card">
                  <h3>Live Classes</h3>
                  <img src='/assets/live.gif' alt="Live Classes" className="card-img" />
                </div>
                <div className="card">
                  <h3>Recordings</h3>
                  <img src='/assets/records.gif' alt="Recordings" className="card-img" />
                </div>
                <div className="card">
                  <h3>Schedule</h3>
                  <img src='/assets/schedule.gif' alt="Schedule" className="card-img" />
                </div>
                <a href='https://www.cybertech242.com' target='_blank' rel="noreferrer">
                  <div className="card">
                    <h3>Site</h3>
                    <img src='/assets/site.gif' alt="Main Site" className="card-img" />
                  </div>
                </a>
              </div>
            </Route>

            {/* Live Classes Route */}
            <Route path="/live-classes">
              <LiveClasses />
            </Route>
          </Switch>
        </div>
      </div>
    </Router>
  );
};

export default App;
