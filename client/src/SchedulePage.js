import React, { useState, useEffect } from 'react';
import './SchedulePage.css';
import 'bootstrap/dist/css/bootstrap.min.css';

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

  const handleCourseChange = (e) => {
    const { name, value } = e.target;
    setNewCourse({ ...newCourse, [name]: value });
  };

  const handleDayChange = (day) => {
    setNewCourse((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCourses([...courses, newCourse]);
    setShowForm(false);
    setNewCourse({ name: '', startTime: '', endTime: '', days: [], bbbContextName: '' });
  };

  const isCourseLive = (bbbContextName) => {
    return liveMeetings.some((meeting) => meeting.bbbContextName === bbbContextName);
  };

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
