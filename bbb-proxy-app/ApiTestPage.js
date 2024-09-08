import React, { useState } from 'react';

const ApiTestPage = () => {
  const [contextId, setContextId] = useState('');
  const [recordings, setRecordings] = useState([]);
  const [error, setError] = useState(null);

  // Function to fetch recordings
  const fetchRecordings = async () => {
    if (!contextId) {
      setError('Please enter a BBB Context ID.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/getRecordings?bbbContextId=${contextId}`);
      const data = await response.json();
      setRecordings(data.recordings); // Assuming the response contains recordings
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError('Error fetching recordings.');
    }
  };

  return (
    <div className="api-test-page">
      <h2>Test API: Get Recordings</h2>

      {/* Input for bbb-context-id */}
      <input
        type="text"
        placeholder="Enter BBB Context ID"
        value={contextId}
        onChange={(e) => setContextId(e.target.value)}
      />
      <button onClick={fetchRecordings}>Search</button>

      {error && <p className="error">{error}</p>}

      <div className="recordings-list">
        {recordings.length === 0 ? (
          <p>No recordings found.</p>
        ) : (
          recordings.map((recording, index) => (
            <RecordingCard key={index} recording={recording} />
          ))
        )}
      </div>
    </div>
  );
};

// Helper function to calculate duration from start and end time
const calculateDuration = (startTime, endTime) => {
  const durationMs = endTime - startTime;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes} min ${seconds} sec`;
};

// Component for rendering individual recordings
const RecordingCard = ({ recording }) => {
  const startTime = new Date(parseInt(recording.startTime)).toLocaleString();
  const duration = calculateDuration(recording.startTime, recording.endTime);

  return (
    <div className="recording-card">
      <h3>Recording</h3>
      <p>Start Date: {startTime}</p>
      <p>Duration: {duration}</p>
      <p>Participants: {recording.participants}</p>
      <a href={recording.playback.url} target="_blank" rel="noopener noreferrer">
        <button>Play Recording</button>
      </a>
    </div>
  );
};

export default ApiTestPage;
