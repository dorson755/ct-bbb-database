import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Form } from 'react-bootstrap';

const EnrollmentDetailsModal = ({ student, onClose }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('5'); // Default to 'Student'

  // Fetch student's enrolled courses
  useEffect(() => {
    const fetchStudentCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/getStudentCourses?userId=${student.id}`);
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Error fetching student courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    if (student) {
      fetchStudentCourses();
    }
  }, [student]);

  // Handle searching courses
  const handleSearchCourses = async () => {
    try {
      const response = await fetch(`/api/searchCourses?courseName=${searchQuery}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching courses:', error);
      setSearchResults([]);
    }
  };

  // Handle enrolling the student in a course
  const handleEnroll = async (courseId) => {
    setEnrollLoading(true);
    try {
      const response = await fetch('/api/enrollStudent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: student.id, courseId, roleId: selectedRole }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Student successfully enrolled!');
        // Refresh the list of enrolled courses
        setCourses((prevCourses) => [...prevCourses, { id: courseId, fullname: 'Newly Enrolled Course' }]);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      alert('There was an error enrolling the student');
    } finally {
      setEnrollLoading(false);
    }
  };

  return (
    <Modal show onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{student.fullname}'s Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Email:</strong> {student.email || 'N/A'}</p>
        <p><strong>Phone:</strong> {student.phone || 'N/A'}</p>

        <h4>Enrolled Courses</h4>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading courses...</span>
            </Spinner>
          </div>
        ) : courses.length > 0 ? (
          <ul>
            {courses.map((course) => (
              <li key={course.id}>
                {course.fullname}
              </li>
            ))}
          </ul>
        ) : (
          <p>No courses enrolled</p>
        )}

        <h4>Enroll in a Course</h4>
        <Form.Group controlId="courseSearch">
          <Form.Label>Search for Courses</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter course name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="primary" onClick={handleSearchCourses} className="mt-2">
            Search
          </Button>
        </Form.Group>

        {searchResults.length > 0 && (
          <ul className="mt-3">
            {searchResults.map((course) => (
              <li key={course.id}>
                {course.fullname}{' '}
                <Form.Control
                  as="select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="d-inline w-auto"
                >
                  <option value="5">Student</option>
                  <option value="3">Teacher</option>
                </Form.Control>
                <Button
                  variant="success"
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrollLoading}
                  className="ms-2"
                >
                  Enroll
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EnrollmentDetailsModal;
