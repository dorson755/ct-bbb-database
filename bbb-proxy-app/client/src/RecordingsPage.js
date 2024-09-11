import React, { useState, useEffect } from 'react';
import './RecordingsPage.css'

const RecordingsPage = () => {
  const [recordings, setRecordings] = useState([]);
  const [error, setError] = useState(null);

  // Fetch recordings using the getRecordings API
  const fetchRecordings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/getRecordings'); // Replace with your backend URL
      const data = await response.text(); // Get the raw XML response

      console.log("Raw XML Response:", data); // Log raw response for debugging

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, "text/xml");

      // Parse XML response to extract recordings
      const recordingNodes = xmlDoc.getElementsByTagName("recording");
      const recordingsArray = Array.from(recordingNodes).map((recording) => ({
        bbbContextName: recording.getElementsByTagName("bbb-context-name")[0]?.textContent || "N/A",
        startTime: new Date(parseInt(recording.getElementsByTagName("startTime")[0]?.textContent)).toLocaleString(),
        endTime: new Date(parseInt(recording.getElementsByTagName("endTime")[0]?.textContent)).toLocaleString(),
        participantCount: recording.getElementsByTagName("participants")[0]?.textContent || "0",
        playbackUrl: recording.getElementsByTagName("url")[0]?.textContent,
        duration: (parseInt(recording.getElementsByTagName("endTime")[0]?.textContent) - parseInt(recording.getElementsByTagName("startTime")[0]?.textContent)) / 1000, // Duration in seconds
      }));

      setRecordings(recordingsArray);
      setError(null);
    } catch (err) {
      console.error("Error fetching recordings:", err);
      setError("Error fetching recordings. Please try again later.");
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  return (
    <div className="recordings-page">
      <h1>All Recordings</h1>

      {error && <p className="error">{error}</p>}

      <div className="card-container">
        {recordings.length > 0 ? (
          recordings.map((recording, index) => (
            <div className="card" key={index}>
              <h3>{recording.bbbContextName}</h3>
              <p><strong>Start Date:</strong> {recording.startTime}</p>
              <p><strong>Duration:</strong> {Math.floor(recording.duration / 60)} minutes</p>
              <p><strong>Participants:</strong> {recording.participantCount}</p>
              {recording.playbackUrl ? (
                <a href={recording.playbackUrl} target="_blank" rel="noreferrer">
                  <button className="playback-btn">Play Recording</button>
                </a>
              ) : (
                <p>No playback available</p>
              )}
            </div>
          ))
        ) : (
          <p>No recordings found.</p>
        )}
      </div>
    </div>
  );
};

export default RecordingsPage;
