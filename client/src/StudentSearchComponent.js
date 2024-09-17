import React, { useState } from 'react';
import './StudentSearchComponent.css'; // Assuming you will put the CSS in this file

const StudentSearchComponent = ({ onStudentSelect }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      if (!email && !fullName) {
        setWarning('Please enter a student name or email');
        return;
      }

      setWarning(null);
      setLoading(true);

      let query = '';
      if (email) {
        query += `email=${encodeURIComponent(email)}`;
      }
      if (fullName) {
        if (query) query += '&';
        query += `fullName=${encodeURIComponent(fullName)}`;
      }

      const response = await fetch(`/api/searchStudents?${query}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setStudents(data);

      if (fullName) {
        const result = data.filter(student =>
          student.fullname.toLowerCase().includes(fullName.toLowerCase())
        );
        setFilteredStudents(result);
      } else {
        setFilteredStudents(data);
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch student data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-search-container">
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Search by email"
        className="search-input"
      />
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Search by full name"
        className="search-input"
      />
      <button onClick={fetchStudents}>Search</button>

      {warning && <p style={{ color: 'orange' }}>{warning}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <div className="loader"></div>
      ) : (
        <ul className="student-list">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <li 
                key={student.id} 
                onClick={() => onStudentSelect(student)} // Pass selected student to parent
                className="student-item"
              >
                {student.fullname} ({student.email})
              </li>
            ))
          ) : (
            <p>No students found</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default StudentSearchComponent;
