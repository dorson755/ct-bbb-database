// components/LogoutButton.js
import { useNavigate } from 'react-router-dom';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Remove the token
    localStorage.removeItem('token');
    
    // 2. Redirect to login
    navigate('/login');
    
    // 3. Optional: Refresh the app state
    window.location.reload();
  };

  return (
    <button onClick={handleLogout} className="logout-button">
      Logout
    </button>
  );
}