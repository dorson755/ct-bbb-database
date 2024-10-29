import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap'; // Bootstrap modal components

const StudentDetailsModal = ({ student, onClose }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true); // New loading state

  useEffect(() => {
    const fetchStudentCourses = async () => {
      try {
        setLoading(true); // Set loading to true when fetching starts
        const response = await fetch(`/api/getStudentCourses?userId=${student.id}`);
        const data = await response.json();
        setCourses(data);
      } catch (error) {
        console.error('Error fetching student courses:', error);
        setCourses([]); // Ensure courses array is empty if there's an error
      } finally {
        setLoading(false); // Set loading to false after data is fetched
      }
    };

    if (student) {
      fetchStudentCourses();
    }
  }, [student]);

  return (
    <Modal show onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{student.fullname}'s Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Email:</strong> {student.email || 'N/A'}</p>
        <p><strong>Phone:</strong> {student.phone || 'N/A'}</p>

        <h4>Enrolled Courses</h4>

        {/* Show loading spinner while courses are being fetched */}
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
                <br />
                <strong>Start Date:</strong> {new Date(course.startdate * 1000).toLocaleDateString()}
                <br />
                <strong>Last Access:</strong> {course.lastaccess ? new Date(course.lastaccess * 1000).toLocaleDateString() : 'N/A'}
              </li>
            ))}
          </ul>
        ) : (
          <p>No courses enrolled</p>
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

export default StudentDetailsModal;
