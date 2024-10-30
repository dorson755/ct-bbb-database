import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, FormControl } from 'react-bootstrap'; // Bootstrap components

const StudentDetailsModal = ({ student, onClose }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // State to store the filter string

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

  // Filter courses based on the filter string
  const filteredCourses = courses.filter((course) =>
    course.fullname.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Modal show onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{student.fullname}'s Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p><strong>Email:</strong> {student.email || 'N/A'}</p>
        <p><strong>Phone:</strong> {student.phone || 'N/A'}</p>

        <h4>Enrolled Courses</h4>

        {/* Filter Input */}
        <FormControl
          type="text"
          placeholder="Filter courses by name..."
          className="mb-3"
          value={filter}
          onChange={(e) => setFilter(e.target.value)} // Update filter string on change
        />

        {/* Show loading spinner while courses are being fetched */}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading courses...</span>
            </Spinner>
          </div>
        ) : filteredCourses.length > 0 ? (
          <ul>
            {filteredCourses.map((course) => (
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
          <p>No courses found</p>
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
