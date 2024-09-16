import React, { useState } from 'react';
import StudentSearchComponent from './StudentSearchComponent';
import StudentDetailsComponent from './StudentDetailsComponent';
import './StudentManager.css';

const StudentManager = () => {
  const [selectedStudents, setSelectedStudents] = useState([]);

  // Handle adding selected students
  const handleAddStudents = (students) => {
    setSelectedStudents(students);
  };

  return (
    <div className='student-manager-page'>
      <h1>Student Search</h1>
      <StudentSearchComponent onAddStudents={handleAddStudents} />

      {selectedStudents.length > 0 && (
        <StudentDetailsComponent selectedStudents={selectedStudents} />
      )}
    </div>
  );
};

export default StudentManager;