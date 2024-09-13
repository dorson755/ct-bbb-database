import React, { useState, useEffect, useCallback } from 'react';
import './SchedulePage.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// List of days for the schedule
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const SchedulePage = () => {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newCourse, setNewCourse] = useState({
    name: '',
    startTime: '',
    endTime: '',
    days: [],
    bbbContextName: '',
  });
  const [liveMeetings, setLiveMeetings] = useState([]);
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState('VIEWER');
  const [notification, setNotification] = useState(null);

  // Fetch live meetings
  const fetchLiveMeetings = async () => {
    try {
      const response = await fetch('https://ct-bbb-dashboard-256f58650ed0.herokuapp.com/api/getMeetings');
      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');

      const meetingNodes = xmlDoc.getElementsByTagName('meeting');
      const meetingsArray = Array.from(meetingNodes).map((meeting) => ({
        bbbContextName: meeting.getElementsByTagName('bbb-context-name')[0]?.textContent,
        meetingID: meeting.getElementsByTagName('meetingID')[0]?.textContent,
      }));

      setLiveMeetings(meetingsArray);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    }
  };

  useEffect(() => {
    fetchLiveMeetings();
  }, []);

  // Notification logic
  const checkForUpcomingClasses = useCallback(() => {
    const now = new Date();
    const offset = -now.getTimezoneOffset() / 60; // Offset in hours
    const easternOffset = -4; // Eastern Time is UTC-4 or UTC-5

    // Adjust for Eastern Time
    const nowEastern = new Date(now.getTime() + (easternOffset - offset) * 60 * 60 * 1000);

    courses.forEach(course => {
      course.days.forEach(day => {
        if (nowEastern.getDay() === daysOfWeek.indexOf(day)) {
          const courseStart = new Date(`${nowEastern.toDateString()} ${course.startTime}`);
          const timeDifference = courseStart - nowEastern;

          if (timeDifference > 0 && timeDifference <= 5 * 60 * 1000) {
            setNotification(`Your class "${course.name}" is about to start in 5 minutes.`);
          }
        }
      });
    });
  }, [courses]);

  useEffect(() => {
    const interval = setInterval(() => {
      checkForUpcomingClasses();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkForUpcomingClasses]);

  // Handle course change
  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setNewCourse({ ...newCourse, [name]: value });
  };

  // Handle day change
  const handleDayChange = (day) => {
    setNewCourse((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setCourses([...courses, newCourse]);
    setShowForm(false);
    setNewCourse({ name: '', startTime: '', endTime: '', days: [], bbbContextName: '' });
  };

  // Check if course is live
  const isCourseLive = (bbbContextName) => {
    return liveMeetings.some((meeting) => meeting.bbbContextName === bbbContextName);
  };

  // Handle joining meeting
  const handleJoinMeeting = async (bbbContextName) => {
    if (!fullName) {
      alert('Please enter your full name to join the class');
      return;
    }

    const meeting = liveMeetings.find((meeting) => meeting.bbbContextName === bbbContextName);

    if (!meeting) {
      alert('Meeting not found');
      return;
    }

    try {
      const response = await fetch(
        `https://ct-bbb-dashboard-256f58650ed0.herokuapp.com/api/joinMeeting?fullName=${encodeURIComponent(fullName)}&meetingID=${encodeURIComponent(meeting.meetingID)}&role=${selectedRole}`
      );
      const data = await response.json();

      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        alert('Error joining the meeting.');
      }
    } catch (error) {
      console.error('Error joining the meeting:', error);
      alert('Error joining the meeting. Please try again.');
    }
  };

  return (
    <div className="schedule-page">
      <h1>Class Schedule</h1>

      {notification && <div className="notification">{notification}</div>}

      <div className="name-input-container">
        <label htmlFor="fullName">Enter your full name:</label>
        <input
          type="text"
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full Name"
        />
      </div>

      <div className="role-selection">
        <label htmlFor="role">Select your role:</label>
        <select
          id="role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="VIEWER">Viewer</option>
          <option value="MODERATOR">Moderator</option>
        </select>
      </div>

      <button onClick={() => setShowForm(true)} className="add-course-btn">Add Course</button>

      {showForm && (
        <div className="lightbox">
          <div className="form-container">
            <h2>Add New Course</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Class Name"
                value={newCourse.name}
                onChange={handleCourseChange}
                required
                className="form-input"
              />
              <input
                type="text"
                name="bbbContextName"
                placeholder="BBB Context Name"
                value={newCourse.bbbContextName}
                onChange={handleCourseChange}
                required
                className="form-input"
              />
              <input
                type="time"
                name="startTime"
                placeholder="Start Time"
                value={newCourse.startTime}
                onChange={handleCourseChange}
                required
                className="form-input"
              />
              <input
                type="time"
                name="endTime"
                placeholder="End Time"
                value={newCourse.endTime}
                onChange={handleCourseChange}
                required
                className="form-input"
              />

              <div className="day-selection">
                {daysOfWeek.map((day) => (
                  <label key={day}>
                    <input
                      type="checkbox"
                      checked={newCourse.days.includes(day)}
                      onChange={() => handleDayChange(day)}
                    />
                    {day}
                  </label>
                ))}
              </div>

              <button type="submit" className="submit-btn">Add Course</button>
              <button type="button" onClick={() => setShowForm(false)} className="cancel-btn">Close</button>
            </form>
          </div>
        </div>
      )}

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
                      {course.name} ({course.bbbContextName})
                      <span
                        className={`status-indicator ${isCourseLive(course.bbbContextName) ? 'green' : 'red'}`}
                      ></span>
                      {isCourseLive(course.bbbContextName) && (
                        <button className="join-btn" onClick={() => handleJoinMeeting(course.bbbContextName)}>
                          Join as {selectedRole}
                        </button>
                      )}
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
