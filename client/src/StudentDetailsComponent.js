import React, { useEffect, useState } from 'react';

const StudentDetailsComponent = ({ selectedStudents }) => {
  const [studentsWithCourses, setStudentsWithCourses] = useState([]);

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

  return (
    <div>
      {studentsWithCourses.length > 0 ? (
        studentsWithCourses.map((student) => (
          <div key={student.id}>
            <h2>{student.fullname}</h2>
            <p>Email: {student.email}</p>
            <p>Phone: {student.phone}</p>

            <h3>Enrolled Courses</h3>
            <ul>
              {student.courses.map((course) => (
                <li key={course.id}>{course.fullname}</li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No students selected</p>
      )}
    </div>
  );
};

export default StudentDetailsComponent;
