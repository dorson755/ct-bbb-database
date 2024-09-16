import React, { useState } from 'react';

const StudentSearchComponent = ({ onAddStudents }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Search students from backend
  const searchStudents = async () => {
    const response = await fetch(`/api/searchStudents?name=${searchQuery}`);
    const data = await response.json();
    setStudents(data);
  };

  // Handle selecting a student
  const toggleStudentSelection = (student) => {
    if (selectedStudents.find((s) => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter((s) => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  // Submit selected students
  const handleAddStudents = () => {
    onAddStudents(selectedStudents);
  };

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search by name"
      />
      <button onClick={searchStudents}>Search</button>
      
      <ul>
        {students.map((student) => (
          <li key={student.id}>
            <input
              type="checkbox"
              checked={selectedStudents.some((s) => s.id === student.id)}
              onChange={() => toggleStudentSelection(student)}
            />
            {student.fullname}
          </li>
        ))}
      </ul>
      
      {selectedStudents.length > 0 && (
        <button onClick={handleAddStudents}>Add Selected Students</button>
      )}
    </div>
  );
};

export default StudentSearchComponent;
