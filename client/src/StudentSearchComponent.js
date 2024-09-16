import React, { useState, useEffect } from 'react';

const StudentSearchComponent = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [error, setError] = useState(null);

  // Fetch students based on email or fullName
  const fetchStudents = async () => {
    try {
      let query = '';
      if (email) {
        query = `email=${encodeURIComponent(email)}`;
      } else if (fullName) {
        query = `fullName=${encodeURIComponent(fullName)}`;
      }

      const response = await fetch(`/api/searchStudents?${query}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setStudents(data);
      setFilteredStudents(data); // Initialize filtered list
      setError(null);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch student data. Please try again.');
    }
  };

  // Fetch students when email or fullName changes
  useEffect(() => {
    fetchStudents();
  }, [email, fullName]);

  // Filter students based on full name search
  useEffect(() => {
    const result = students.filter(student =>
      student.fullname.toLowerCase().includes(fullName.toLowerCase())
    );
    setFilteredStudents(result);
  }, [fullName, students]);

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

      {error && <p>{error}</p>}

      <ul>
        {filteredStudents.map((student) => (
          <li key={student.id}>
            {student.fullname} ({student.email})
            <img src={student.profileimageurl} alt={student.fullname} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StudentSearchComponent;
