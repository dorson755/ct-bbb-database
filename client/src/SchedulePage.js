import React, { useState } from 'react';
import './SchedulePage.css';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const SchedulePage = () => {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false); // Manage form visibility

  return (
    <div className="schedule-page">
      <h1>Class Schedule</h1>

      {/* Button to open the add course form */}
      <button onClick={() => setShowForm(true)}>Add Course</button>

      {/* Lightbox Form for adding a course */}
      {showForm && (
        <div className="lightbox">
          <div className="form-container">
            <h2>Add New Course</h2>
            {/* Form content goes here */}
            <button onClick={() => setShowForm(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Table */}
      <table className="schedule-table">
        <thead>
          <tr>
            {daysOfWeek.map((day) => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {daysOfWeek.map((day) => (
              <td key={day}>
                {courses
                  .filter((course) => course.days.includes(day))
                  .map((course, index) => (
                    <div key={index} className="course">
                      {course.name}
                    </div>
                  ))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default SchedulePage;
