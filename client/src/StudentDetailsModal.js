import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap'; // Bootstrap modal components

const StudentDetailsModal = ({ student, onClose }) => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchStudentCourses = async () => {
      const response = await fetch(`/api/getStudentCourses?userId=${student.id}`);
      const data = await response.json();
      setCourses(data);
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
        {courses.length > 0 ? (
          <ul>
            {courses.map((course) => (
              <li key={course.id}>
                {course.fullname}
                <br />
                <strong>Start Date:</strong> {new Date(course.startdate * 1000).toLocaleDateString()}
                <br />
                <strong>Last Access:</strong> {new Date(course.lastaccess * 1000).toLocaleDateString() || 'N/A'}
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
