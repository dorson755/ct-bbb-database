import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Admin() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUsers(await response.json());
    };
    fetchUsers();
  }, []);

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>
      <div className="user-list">
        {users.map(user => (
          <div key={user._id} className="user-card">
            <span>{user.username}</span>
            <span>{user.role}</span>
            <button>Delete</button>
          </div>
        ))}
      </div>
      <Link to="/" className="home-link">Return to Home</Link>
    </div>
  );
}