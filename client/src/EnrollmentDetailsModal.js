import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Form } from 'react-bootstrap';

const EnrollmentDetailsModal = ({ student, onClose }) => {
  const [enrolledCourses, setEnrolledCourses] = useState([]); // For enrolled courses
  const [allCourses, setAllCourses] = useState([]); // For all available courses
  const [filteredCourses, setFilteredCourses] = useState([]); // For filtered results
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // For searching courses
  const [enrollLoading, setEnrollLoading] = useState(false); // For enrolling

  useEffect(() => {
    const fetchStudentCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/getStudentCourses?userId=${student.id}`);
        const data = await response.json();
        setEnrolledCourses(data);
      } catch (error) {
        console.error('Error fetching student courses:', error);
        setEnrolledCourses([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchAllCourses = async () => {
      try {
        const response = await fetch('/api/getCourses'); // Adjust this endpoint if needed
        const data = await response.json();
        setAllCourses(data);
      } catch (error) {
        console.error('Error fetching all courses:', error);
      }
    };

    if (student) {
      fetchStudentCourses();
      fetchAllCourses(); // Fetch all courses on student load
    }
  }, [student]);

  // Filter courses based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = allCourses.filter((course) =>
        course.fullname.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCourses(filtered);
      console.log('Filtered courses:', filtered); // Debugging log
    } else {
      setFilteredCourses([]); // Clear results if no search query
    }
  }, [searchQuery, allCourses]);

  // Handle enrolling the student in a course
  const handleEnroll = async (courseId) => {
    setEnrollLoading(true);
    try {
      const response = await fetch('/api/enrollStudent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: student.id, courseId }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Student successfully enrolled!');
        // Optionally refresh the student's enrolled courses
        setEnrolledCourses((prevCourses) => [...prevCourses, { id: courseId, fullname: 'Newly Enrolled Course' }]);
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
        ) : enrolledCourses.length > 0 ? (
          <ul>
            {enrolledCourses.map((course) => (
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
        </Form.Group>

        {filteredCourses.length > 0 && (
          <ul className="mt-3">
            {filteredCourses.map((course) => (
              <li key={course.id}>
                {course.fullname}{' '}
                <Button
                  variant="success"
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrollLoading}
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
