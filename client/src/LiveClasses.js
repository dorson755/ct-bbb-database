import React, { useState, useEffect } from 'react';
import './LiveClasses.css';

const LiveClasses = () => {
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState(null);
  const [fullName, setFullName] = useState(''); // Store the full name entered by the user

  // Fetch live meetings using the getMeetings API call
  const fetchMeetings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/getMeetings'); // Replace with your backend URL
      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');

      // Parse the XML to get meeting details
      const meetingNodes = xmlDoc.getElementsByTagName('meeting');
      const meetingsArray = Array.from(meetingNodes).map((meeting) => ({
        bbbContextName: meeting.getElementsByTagName('bbb-context-name')[0]?.textContent,
        meetingID: meeting.getElementsByTagName('meetingID')[0]?.textContent,
        createTime: meeting.getElementsByTagName('createTime')[0]?.textContent, // Use createTime instead of createDate
        participantCount: meeting.getElementsByTagName('participantCount')[0]?.textContent,
      }));

      setMeetings(meetingsArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Error fetching meetings. Please try again later.');
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

// Handle joining the meeting
const handleJoinMeeting = async (meetingID, role) => {
  if (!fullName) {
    alert('Please enter your full name to join the class');
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/joinMeeting?fullName=${encodeURIComponent(fullName)}&meetingID=${encodeURIComponent(meetingID)}&role=${encodeURIComponent(role)}`
    );
    const data = await response.json();

    if (data.url) {
      window.open(data.url, '_blank'); // Open the generated BBB join URL in a new tab
    }
  } catch (err) {
    console.error('Error joining meeting:', err);
    alert('Error joining the meeting. Please try again.');
  }
};


  // Helper function to format the createTime in the user's timezone
  const formatCreateTime = (timestamp) => {
    const date = new Date(parseInt(timestamp)); // Parse the timestamp
    return date.toLocaleString(); // Converts to the user's local timezone and format
  };

  return (
    <div className="live-classes-container">
      <h1>Live Classes</h1>

      {error && <p className="error">{error}</p>}

      {/* Input field for entering the user's name */}
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

      <div className="card-container">
        {meetings.length > 0 ? (
          meetings.map((meeting, index) => (
            <div className="card" key={index}>
              <h3>{meeting.bbbContextName}</h3>
              <p><strong>Created on:</strong> {formatCreateTime(meeting.createTime)}</p> {/* Display createTime in local timezone */}
              <p><strong>Participants:</strong> {meeting.participantCount}</p>

              {/* Buttons for joining as a Viewer or Moderator */}
              <button
                className="join-btn"
                onClick={() => handleJoinMeeting(meeting.meetingID, 'VIEWER')}
              >
                Join as Viewer
              </button>
              <button
                className="join-btn"
                onClick={() => handleJoinMeeting(meeting.meetingID, 'MODERATOR')}
              >
                Join as Moderator
              </button>
            </div>
          ))
        ) : (
          <p>No live classes available at the moment.</p>
        )}
      </div>
    </div>
  );
};

export default LiveClasses;
