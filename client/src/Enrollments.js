import React, { useState } from 'react';

const Enrollments = () => {
  // State for student search and search results
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // State for courses and course filter
  const [courses, setCourses] = useState([]);
  const [courseFilter, setCourseFilter] = useState('');

  // Function to search for students by email or full name
  const searchStudents = async () => {
    try {
      const queryParam = searchQuery.includes('@') ? `email=${searchQuery}` : `fullName=${searchQuery}`;
      const response = await fetch(`/api/searchStudents?${queryParam}`);
      const data = await response.json();

      if (data.error) {
        alert(data.error);
      } else {
        setStudents(data); // Store the found students
      }
    } catch (error) {
      console.error('Error searching students:', error);
    }
  };

  // Function to fetch the courses for the selected student
  const fetchStudentCourses = async (userId) => {
    try {
      const response = await fetch(`/api/getStudentCourses?userId=${userId}`);
      const data = await response.json();
      setCourses(data); // Store the student's courses
    } catch (error) {
      console.error('Error fetching student courses:', error);
    }
  };

  // Handle when a student is selected from the list
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    fetchStudentCourses(student.id); // Fetch courses for the selected student
  };

  // Filter the courses based on the input
  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(courseFilter.toLowerCase())
  );

  return (
    <div>
      <h2>Search Students</h2>
      {/* Input for student search */}
      <input 
        type="text" 
        placeholder="Enter student email or name" 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)} 
      />
      <button onClick={searchStudents}>Search</button>

      {/* Render search results */}
      {students.length > 0 && (
        <div>
          <h3>Select a student:</h3>
          <ul>
            {students.map((student) => (
              <li key={student.id}>
                {student.fullname} 
                <button onClick={() => handleStudentSelect(student)}>View Courses</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Display selected student's courses and filter */}
      {selectedStudent && (
        <div>
          <h3>Courses for {selectedStudent.fullname}</h3>
          
          {/* Input for filtering courses */}
          <input 
            type="text" 
            placeholder="Filter courses by name" 
            value={courseFilter} 
            onChange={(e) => setCourseFilter(e.target.value)} 
          />

          {/* Render filtered courses */}
          <ul>
            {filteredCourses.map((course) => (
              <li key={course.id}>{course.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Enrollments;
