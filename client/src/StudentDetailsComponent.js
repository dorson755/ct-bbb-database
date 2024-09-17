import React, { useEffect, useState } from 'react';

const StudentDetailsComponent = ({ selectedStudents }) => {
  const [studentsWithCourses, setStudentsWithCourses] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null); // State for the selected student

  // Fetch courses for each selected student
  useEffect(() => {
    const fetchCourses = async (student) => {
      const response = await fetch(`/api/getStudentCourses?userId=${student.id}`);
      const data = await response.json();
      return { ...student, courses: data };
    };

    const loadStudentsWithCourses = async () => {
      const studentsData = await Promise.all(
        selectedStudents.map((student) => fetchCourses(student))
      );
      setStudentsWithCourses(studentsData);
    };

    loadStudentsWithCourses();
  }, [selectedStudents]);

  // Handle clicking a student to show detailed information
  const handleStudentClick = (student) => {
    setActiveStudent(student);
  };

  return (
    <div>
      <h2>Studenzts</h2>
      {studentsWithCourses.length > 0 ? (
        <ul>
          {studentsWithCourses.map((student) => (
            <li 
              key={student.id} 
              style={{ cursor: 'pointer', color: 'blue' }}
              onClick={() => handleStudentClick(student)}
            >
              {student.fullname}
            </li>
          ))}
        </ul>
      ) : (
        <p>No students selected</p>
      )}

      {activeStudent && (
        <div>
          <h2>{activeStudent.fullname}</h2>
          <p>Email: {activeStudent.email || 'N/A'}</p>
          <p>Phone: {activeStudent.phone || 'N/A'}</p>

          <h3>Enrolled Courses</h3>
          {activeStudent.courses && activeStudent.courses.length > 0 ? (
            <ul>
              {activeStudent.courses.map((course) => (
                <li key={course.id}>{course.fullname}</li>
              ))}
            </ul>
          ) : (
            <p>No enrolled courses</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDetailsComponent;
