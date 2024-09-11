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
  const totalPages = Math.ceil(filteredRecordings.length / itemsPerPage);

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

  // Render pagination with custom logic (4 pages ahead and behind current page)
  const renderPagination = () => {
    const paginationItems = [];
    const ellipsis = <span key="dots">...</span>;

    const startPage = Math.max(currentPage - 4, 1);  // 4 pages back
    const endPage = Math.min(currentPage + 4, totalPages);  // 4 pages ahead

    // Always show the first page and ellipsis if necessary
    if (startPage > 1) {
      paginationItems.push(
        <button key={1} onClick={() => handlePageChange(1)} className={currentPage === 1 ? 'active' : ''}>
          1
        </button>
      );
      if (startPage > 2) paginationItems.push(ellipsis);  // Ellipsis between page 1 and startPage
    }

    // Pages within the current range (4 before and 4 after)
    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <button key={i} onClick={() => handlePageChange(i)} className={currentPage === i ? 'active' : ''}>
          {i}
        </button>
      );
    }

    // Show ellipsis before the last page if needed
    if (endPage < totalPages - 1) {
      paginationItems.push(ellipsis);
    }

    // Always show the last page if it's not already included
    if (endPage < totalPages) {
      paginationItems.push(
        <button key={totalPages} onClick={() => handlePageChange(totalPages)} className={currentPage === totalPages ? 'active' : ''}>
          {totalPages}
        </button>
      );
    }

    return paginationItems;
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
        {renderPagination()}
      </div>
    </div>
  );
};

export default RecordingsPage;
