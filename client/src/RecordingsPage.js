// src/RecordingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import './RecordingsPage.css';

const RecordingsPage = ({ showNotification }) => {
  const [recordings, setRecordings] = useState([]);
  const [error, setError] = useState(null);
  const [filteredRecordings, setFilteredRecordings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [sortOption, setSortOption] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const fetchRecordings = async () => {
    try {
      const response = await fetch('https://ct-bbb-dashboard-256f58650ed0.herokuapp.com/api/getRecordings');
      const data = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data, 'text/xml');

      const recordingNodes = xmlDoc.getElementsByTagName('recording');
      const recordingsArray = Array.from(recordingNodes).map((recording) => ({
        bbbContextName: recording.getElementsByTagName('bbb-context-name')[0]?.textContent || 'N/A',
        startTime: new Date(parseInt(recording.getElementsByTagName('startTime')[0]?.textContent)),
        endTime: new Date(parseInt(recording.getElementsByTagName('endTime')[0]?.textContent)),
        participantCount: recording.getElementsByTagName('participants')[0]?.textContent || '0',
        playbackUrl: recording.getElementsByTagName('url')[0]?.textContent,
        duration: (parseInt(recording.getElementsByTagName('endTime')[0]?.textContent) - parseInt(recording.getElementsByTagName('startTime')[0]?.textContent)) / 1000,
        recordID: recording.getElementsByTagName('recordID')[0]?.textContent,
      }));

      const sortedRecordings = [...recordingsArray].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      setRecordings(sortedRecordings);
      setFilteredRecordings(sortedRecordings);
      setError(null);
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError('Error fetching recordings. Please try again later.');
    }
  };

  useEffect(() => {
    fetchRecordings();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...recordings];

    if (searchQuery) {
      filtered = filtered.filter((recording) =>
        recording.bbbContextName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDate) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + 1);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      filtered = filtered.filter((recording) =>
        recording.startTime >= startOfDay && recording.endTime <= endOfDay
      );
    }

    setFilteredRecordings(filtered);
  }, [recordings, searchQuery, selectedDate]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecordings = filteredRecordings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecordings.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleDelete = async (recordID) => {
    try {
      const response = await fetch(`https://ct-bbb-dashboard-256f58650ed0.herokuapp.com/api/deleteRecordings?recordID=${recordID}`);
      if (response.ok) {
        showNotification('Recording deleted successfully.');
        fetchRecordings();
      } else {
        showNotification('Error deleting recording.');
      }
    } catch (err) {
      console.error('Error deleting recording:', err);
      showNotification('Error deleting recording. Please try again.');
    }
  };

  const renderPagination = () => {
    const paginationItems = [];
    const ellipsis = <span key="dots">...</span>;

    const startPage = Math.max(currentPage - 4, 1);
    const endPage = Math.min(currentPage + 4, totalPages);

    if (startPage > 1) {
      paginationItems.push(
        <button key={1} onClick={() => handlePageChange(1)} className={currentPage === 1 ? 'active' : ''}>
          1
        </button>
      );
      if (startPage > 2) paginationItems.push(ellipsis);
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <button key={i} onClick={() => handlePageChange(i)} className={currentPage === i ? 'active' : ''}>
          {i}
        </button>
      );
    }

    if (endPage < totalPages - 1) {
      paginationItems.push(ellipsis);
    }

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
          <option value="12">Show 12 per page</option>
          <option value="24">Show 24 per page</option>
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
              <div className="button-container">
                {recording.playbackUrl ? (
                  <a href={recording.playbackUrl} target="_blank" rel="noreferrer">
                    <button className="playback-btn">Play Recording</button>
                  </a>
                ) : (
                  <p>No playback available</p>
                )}
                <button className="delete-btn" onClick={() => handleDelete(recording.recordID)}>Delete Recording</button>
              </div>
            </div>
          ))
        ) : (
          <p>No recordings found.</p>
        )}
      </div>

      <div className="pagination">
        {renderPagination()}
      </div>
    </div>
  );
};

export default RecordingsPage;
