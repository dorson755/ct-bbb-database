import React, { useState } from 'react';
import StudentSearchComponent from './StudentSearchComponent';
import EnrollmentDetailsModal from './EnrollmentsDetailsModal'; // Import the modal component

const Enrollments = () => {
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
    <div className="enrollments-container">
        <h1>Enrollments</h1>
      {/* Pass the handleStudentSelect function to the search component */}
      <StudentSearchComponent onStudentSelect={handleStudentSelect} />
      
      {/* Render the modal when a student is selected */}
      {selectedStudent && (
        <EnrollmentDetailsModal
          student={selectedStudent}
          onClose={handleCloseModal} // Pass the close handler to the modal
        />
      )}
    </div>
  );
};

export default Enrollments;
