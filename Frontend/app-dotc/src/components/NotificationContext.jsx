import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from './Notification';

const initialState = { title: '', duration: 5000, children: null, type: 'default' };

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children: appChildren }) => {
  const [notification, setNotification] = useState(initialState);

  // options: { disableOverflow, disableHover, noAnimation }
  const showNotification = useCallback(
    (children, title = 'Aviso del Juego', duration, type = 'default', options = {}) => {
      setNotification({ children, title, duration, type, options });
    },
    []
  );

  const clearNotification = useCallback(() => {
    setNotification(initialState);
  }, []);

  const value = { showNotification };

  return (
    <NotificationContext.Provider value={value}>
      {appChildren}
      <Notification
        title={notification.title}
        duration={notification.duration}
        onClose={clearNotification}
        type={notification.type}
        options={notification.options}
      >
        {notification.children}
      </Notification>
    </NotificationContext.Provider>
  );
};