import { createContext, useState, useContext } from 'react';

const GameLogicContext = createContext();

export const GameLockProvider = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [stringLock, setStringLock] = useState("");

  const lockGame = (message) => {
    setIsLocked(true);
		setStringLock(message);
  }

	const unlockGame = () => {
    setIsLocked(false);
    setStringLock(""); 
  };

  return (
    <GameLogicContext.Provider value={{ isLocked, stringLock, lockGame, unlockGame }}>
      {children}
    </GameLogicContext.Provider>
  );
};

export const useGameLock = () => useContext(GameLogicContext);