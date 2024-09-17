import React, { useState } from 'react';
import StudentSearchComponent from './StudentSearchComponent';
import StudentDetailsComponent from './StudentDetailsComponent';

const StudentManager = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Handle student selection
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  return (
    <div>
      {/* Pass handleStudentSelect to the search component */}
      <StudentSearchComponent onStudentSelect={handleStudentSelect} />
      
      {/* Pass selected student to the details component */}
      {selectedStudent && <StudentDetailsComponent selectedStudent={selectedStudent} />}
    </div>
  );
};

export default StudentManager;
