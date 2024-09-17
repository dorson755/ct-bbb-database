import React, { useState } from 'react';
import StudentSearchComponent from './StudentSearchComponent';
import StudentDetailsModal from './StudentDetailsModal'; // Import the modal component

const StudentManager = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Handle student selection from the search component
  const handleStudentSelect = (student) => {
    setSelectedStudent(student); // This will open the modal
  };

  // Close the modal by clearing the selected student
  const handleCloseModal = () => {
    setSelectedStudent(null);
  };

  return (
    <div>
      {/* Pass the handleStudentSelect function to the search component */}
      <StudentSearchComponent onStudentSelect={handleStudentSelect} />
      
      {/* Render the modal when a student is selected */}
      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          onClose={handleCloseModal} // Pass the close handler to the modal
        />
      )}
    </div>
  );
};

export default StudentManager;
