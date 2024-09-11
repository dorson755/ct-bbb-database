import React, { useState, useEffect } from 'react';
import './RecordingsPage.css';

const RecordingsPage = () => {
  const [recordings, setRecordings] = useState([]);
  const [error, setError] = useState(null);
  const [filteredRecordings, setFilteredRecordings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOption, setSortOption] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');

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
        startTime: new Date(parseInt(recording.getElementsByTagName("startTime")[0]?.textContent)),
        endTime: new Date(parseInt(recording.getElementsByTagName("endTime")[0]?.textContent)),
        participantCount: recording.getElementsByTagName("participants")[0]?.textContent || "0",
        playbackUrl: recording.getElementsByTagName("url")[0]?.textContent,
        duration: (parseInt(recording.getElementsByTagName("endTime")[0]?.textContent) - parseInt(recording.getElementsByTagName("startTime")[0]?.textContent)) / 1000, // Duration in seconds
      }));

      setRecordings(recordingsArray);
      setFilteredRecordings(recordingsArray);
      setError(null);
    } catch (err) {
      console.error("Error fetching recordings:", err);
      setError("Error fetching recordings. Please try again later.");
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecordings = filteredRecordings.slice(indexOfFirstItem, indexOfLastItem);

  // Handle pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle sorting
  const handleSortChange = (e) => {
    const option = e.target.value;
    setSortOption(option);

    const sortedRecordings = [...filteredRecordings].sort((a, b) => {
      if (option === 'date') {
        return new Date(b.startTime) - new Date(a.startTime);
      } else if (option === 'duration') {
        return b.duration - a.duration;
      }
      return 0;
    });
    setFilteredRecordings(sortedRecordings);
  };

  // Handle search filtering
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    const searchResults = recordings.filter(recording =>
      recording.bbbContextName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredRecordings(searchResults);
  };

  // Handle date filtering
  const handleDateChange = (e) => {
    const selectedDate = new Date(e.target.value);

    const filteredByDate = recordings.filter(recording => {
      // Compare the selected date and recording date (ignoring the time part)
      return recording.startTime.toDateString() === selectedDate.toDateString();
    });
    setFilteredRecordings(filteredByDate);
  };

  return (
    <div className="recordings-page">
      <h1>All Recordings</h1>

      {error && <p className="error">{error}</p>}

      <div className="filters">
        <input
          type="text"
          placeholder="Search by context name..."
          value={searchQuery}
          onChange={handleSearchChange}
        />

        <input
          type="date"
          onChange={handleDateChange}
        />

        <select onChange={handleSortChange} value={sortOption}>
          <option value="date">Sort by Date</option>
          <option value="duration">Sort by Duration</option>
        </select>

        <select onChange={(e) => setItemsPerPage(parseInt(e.target.value))} value={itemsPerPage}>
          <option value="10">Show 10 per page</option>
          <option value="20">Show 20 per page</option>
        </select>
      </div>

      <div className="card-container">
        {currentRecordings.length > 0 ? (
          currentRecordings.map((recording, index) => (
            <div className="card" key={index}>
              <h3>{recording.bbbContextName}</h3>
              <p><strong>Start Date:</strong> {recording.startTime.toLocaleString()}</p>
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

      {/* Pagination controls */}
      <div className="pagination">
        {[...Array(Math.ceil(filteredRecordings.length / itemsPerPage)).keys()].map(page => (
          <button key={page + 1} onClick={() => handlePageChange(page + 1)}>
            {page + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecordingsPage;
