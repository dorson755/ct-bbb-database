import React, { useState, useEffect } from 'react';
import { Modal, Button, Spinner, Form } from 'react-bootstrap';

const EnrollmentDetailsModal = ({ student, onClose }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [roleId, setRoleId] = useState(5); // Default to Student role
  const [searchLoading, setSearchLoading] = useState(false);  // For search loading spinner
  const [currentPage, setCurrentPage] = useState(1);  // Current page for pagination
  const resultsPerPage = 5;  // Number of results per page

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

  const handleSearchCourses = async () => {
    setSearchLoading(true);  // Show the loading spinner before making the API call
    try {
      const response = await fetch(`/api/searchCourses?courseName=${searchQuery}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching courses:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);  // Hide the loading spinner after the API call is done
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrollLoading(true);
    try {
      const response = await fetch('/api/enrollStudent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: student.id, courseId, roleId }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Student successfully enrolled!');
        setCourses((prevCourses) => {
          const enrolledCourse = searchResults.find(course => course.id === courseId);
          return [...prevCourses, { id: courseId, fullname: enrolledCourse ? enrolledCourse.fullname : 'Unknown Course' }];
        });        
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      alert('There was an error enrolling the student');
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleUnenroll = async (courseId) => {
    setEnrollLoading(true);
    try {
        const response = await fetch('/api/unenrollStudent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: student.id, courseId }),
        });
        const data = await response.json();
        if (response.ok) {
            alert('Student successfully unenrolled!');
            setCourses(courses.filter(course => course.id !== courseId));
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error unenrolling student:', error);
        alert('There was an error unenrolling the student');
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
                <Button
                  variant="danger"
                  onClick={() => handleUnenroll(course.id)}
                >
                  Unenroll
                </Button>
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

        {/* Loading spinner for course search */}
        {searchLoading ? (
          <div className="d-flex justify-content-center align-items-center mt-3">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Searching courses...</span>
            </Spinner>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <ul className="mt-3">
              {searchResults.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage).map((course) => (
                <li key={course.id}>
                  {course.fullname}{' '}
                  <Form.Select value={roleId} onChange={(e) => setRoleId(Number(e.target.value))} className="d-inline-block w-auto me-2">
                    <option value={5}>Student</option>
                    <option value={3}>Teacher</option>
                  </Form.Select>
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

            {/* Pagination Controls */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Button
                variant="outline-primary"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span>Page {currentPage} of {Math.ceil(searchResults.length / resultsPerPage)}</span>
              <Button
                variant="outline-primary"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === Math.ceil(searchResults.length / resultsPerPage)}
              >
                Next
              </Button>
            </div>
          </>
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

export default EnrollmentDetailsModal;
