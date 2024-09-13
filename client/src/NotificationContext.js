// src/NotificationContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

// Create a context for notifications
const NotificationContext = createContext();

// Notification provider component
export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const triggerNotification = (message, timeout = 5000) => {
    setNotification(message);
    setTimeout(() => setNotification(null), timeout);
  };

  return (
    <NotificationContext.Provider value={{ notification, triggerNotification }}>
      {children}
      {notification && <Notification message={notification} />}
    </NotificationContext.Provider>
  );
};

// Notification component
const Notification = ({ message }) => {
  return (
    <div className="notification">
      {message}
    </div>
  );
};

// Custom hook to use notification context
export const useNotification = () => useContext(NotificationContext);
