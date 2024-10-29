import React, { useEffect, useState } from 'react';

const StudentDetailsComponent = ({ selectedStudent }) => {
  const [studentWithCourses, setStudentWithCourses] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/getStudentCourses?userId=${selectedStudent.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }

        setStudentWithCourses({ ...selectedStudent, courses: data });
        setError(null);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setError('Failed to fetch courses for the selected student.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [selectedStudent]);

  return (
    <div>
      {loading ? (
        <p>Loading courses...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : studentWithCourses ? (
        <div>
          <h2>{studentWithCourses.fullname}'s Details</h2>
          <p>Email: {studentWithCourses.email || 'N/A'}</p>
          <p>Phone: {studentWithCourses.phone || 'N/A'}</p>

          <h3>Enrolled Courses</h3>
          {studentWithCourses.courses.length > 0 ? (
            <ul>
              {studentWithCourses.courses.map((course) => (
                <li key={course.id}>{course.fullname}</li>
              ))}
            </ul>
          ) : (
            <p>No courses found for this student.</p>
          )}
        </div>
      ) : (
        <p>No student selected.</p>
      )}
    </div>
  );
};

export default StudentDetailsComponent;
