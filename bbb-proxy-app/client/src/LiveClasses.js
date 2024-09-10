import React, { useState, useEffect } from 'react';
import './LiveClasses.css'

const LiveClasses = () => {
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState(null);

  // Fetch live meetings using the getMeetings API call
  const fetchMeetings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/getMeetings'); // Replace with your backend URL
      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, "text/xml");
      
      // Parse the XML to get meeting details
      const meetingNodes = xmlDoc.getElementsByTagName("meeting");
      const meetingsArray = Array.from(meetingNodes).map((meeting) => ({
        meetingName: meeting.getElementsByTagName("meetingName")[0]?.textContent,
        meetingID: meeting.getElementsByTagName("meetingID")[0]?.textContent,
        createDate: meeting.getElementsByTagName("createDate")[0]?.textContent,
        participantCount: meeting.getElementsByTagName("participantCount")[0]?.textContent,
      }));
      
      setMeetings(meetingsArray);
      setError(null);
    } catch (err) {
      console.error("Error fetching meetings:", err);
      setError("Error fetching meetings. Please try again later.");
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  return (
    <div className="live-classes-container">
      <h1>Live Classes</h1>

      {error && <p className="error">{error}</p>}

      <div className="card-container">
        {meetings.length > 0 ? (
          meetings.map((meeting, index) => (
            <div className="card" key={index}>
              <h3>{meeting.meetingName}</h3>
              <p><strong>Created on:</strong> {meeting.createDate}</p>
              <p><strong>Participants:</strong> {meeting.participantCount}</p>
              <button className="join-btn" onClick={() => handleJoinMeeting(meeting.meetingID)}>Join</button>
            </div>
          ))
        ) : (
          <p>No live classes available at the moment.</p>
        )}
      </div>
    </div>
  );
};

const handleJoinMeeting = (meetingID) => {
  const joinUrl = `http://your-bbb-server.com/bigbluebutton/api/join?meetingID=${meetingID}`;
  window.location.href = joinUrl; // Redirect to the meeting join URL
};

export default LiveClasses;
