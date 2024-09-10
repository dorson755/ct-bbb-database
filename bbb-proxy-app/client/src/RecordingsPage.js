import React, { useState, useEffect } from 'react';
import './RecordingsPage.css'

const RecordingsPage = () => {
  const [recordings, setRecordings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10); // Default to 10 records per page
  const [error, setError] = useState(null);

  // Fetch recordings using the getRecordings API
  const fetchRecordings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/getRecordings'); // Replace with your backend URL
      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, "text/xml");

      // Parse XML response to extract recordings
      const recordingNodes = xmlDoc.getElementsByTagName("recording");
      const recordingsArray = Array.from(recordingNodes).map((recording) => ({
        bbbContextName: recording.getElementsByTagName("bbb-context-name")[0]?.textContent, // Use bbb-context-name
        startTime: new Date(parseInt(recording.getElementsByTagName("startTime")[0]?.textContent)).toLocaleString(),
        endTime: new Date(parseInt(recording.getElementsByTagName("endTime")[0]?.textContent)).toLocaleString(),
        participantCount: recording.getElementsByTagName("participants")[0]?.textContent,
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

  // Get current recordings for pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = recordings.slice(indexOfFirstRecord, indexOfLastRecord);

  // Handle page change
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="recordings-page">
      <h1>Recordings</h1>

      {error && <p className="error">{error}</p>}

      <div className="pagination-controls">
        <label>Show records per page:</label>
        <select value={recordsPerPage} onChange={(e) => setRecordsPerPage(parseInt(e.target.value))}>
          <option value="10">10</option>
          <option value="20">20</option>
        </select>
      </div>

      <div className="card-container">
        {currentRecords.length > 0 ? (
          currentRecords.map((recording, index) => (
            <div className="card" key={index}>
              <h3>{recording.bbbContextName}</h3> {/* bbb-context-name */}
              <p><strong>Start Date:</strong> {recording.startTime}</p>
              <p><strong>Duration:</strong> {Math.floor(recording.duration / 60)} minutes</p>
              <p><strong>Participants:</strong> {recording.participantCount}</p>
              <a href={recording.playbackUrl} target="_blank" rel="noreferrer">
                <button className="playback-btn">Play Recording</button>
              </a>
            </div>
          ))
        ) : (
          <p>No recordings found.</p>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        recordsPerPage={recordsPerPage}
        totalRecords={recordings.length}
        paginate={paginate}
        currentPage={currentPage}
      />
    </div>
  );
};

// Pagination Component
const Pagination = ({ recordsPerPage, totalRecords, paginate, currentPage }) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalRecords / recordsPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <nav>
      <ul className="pagination">
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${number === currentPage ? 'active' : ''}`}>
            <button onClick={() => paginate(number)} className="page-link">
              {number}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default RecordingsPage;
