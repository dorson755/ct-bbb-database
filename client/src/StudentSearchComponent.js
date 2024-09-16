import React, { useState } from 'react';

const StudentSearchComponent = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  // Fetch students based on email or fullName
  const fetchStudents = async () => {
    try {
      if (!email && !fullName) {
        setWarning('Please enter a student name or email');
        return;
      }
      
      setWarning(null); // Clear warning if query is valid

      let query = '';
      if (email) {
        query = `email=${encodeURIComponent(email)}`;
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
      // If fullName search is provided, apply additional filtering
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
    }
  };

  return (
    <div>
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Search by email"
      />
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Search by full name"
      />
      <button onClick={fetchStudents}>Search</button>

      {warning && <p style={{ color: 'orange' }}>{warning}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ul>
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <li key={student.id}>
              {student.fullname} ({student.email})
              <img src={student.profileimageurl} alt={student.fullname} />
            </li>
          ))
        ) : (
          <p>No students found</p>
        )}
      </ul>
    </div>
  );
};

export default StudentSearchComponent;
