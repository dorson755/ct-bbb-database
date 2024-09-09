import React from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import ApiTestPage from './ApiTestPage'; // Import the API testing page
import './App.css'; // Import your CSS file

const App = () => {
  return (
    <Router>
      <div className="App">
        {/* Top-right Test API button */}
        <header>
          <Link to="/api-test" className="test-api-button">
            Test API
          </Link>
        </header>

        {/* Define routes */}
        <Switch>
          <Route path="/api-test" component={ApiTestPage} />
          <Route path="/" exact>
            <h1>Welcome to the BigBlueButton API App</h1>
          </Route>
        </Switch>
      </div>
    </Router>
  );
};

export default App;
