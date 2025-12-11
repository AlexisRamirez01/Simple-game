import React, { useState } from "react";
import PlayerAvatar from "./PlayerAvatar"; 

export function SelectPlayer({ players = [], onSelectPlayer, isOpen }) {
  
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  if (!isOpen) {
    return null;
  }
  
  const handleSelectInModal = (playerId) => {
    setSelectedPlayerId(playerId);
  };
  
  const handleConfirmSelection = () => {
    onSelectPlayer(selectedPlayerId);
    setSelectedPlayerId(null);
  };
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Elige un jugador"
    >
      <div className="absolute inset-0 bg-black/50"/>
      
      <div className="relative bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-2xl p-6 flex flex-col items-center  max-w-3xl shadow-2xl transition-all duration-300">
        
        <h3 className="text-2xl font-bold mb-4 text-center">Elige un jugador</h3>
      
        <div className="flex flex-row gap-5 w-full justify-center p-3">
          
          {players.map((player) => {
            const isThisOneSelected = selectedPlayerId === player.id;
            const isAnySelected = selectedPlayerId !== null;

            return (
              <div 
                key={player.id} 
                className={`
                  w-24 
                  transition-all duration-300 ease-in-out
                  ${isAnySelected && !isThisOneSelected ? 'opacity-40' : 'opacity-100'}
                  ${isThisOneSelected ? 'transform scale-110' : 'transform scale-100'}
                `}
              >
                <PlayerAvatar
                  player={player}
                  onClick={() => handleSelectInModal(player.id)}
                  isSelected={isThisOneSelected}
                />
              </div>
            );
          })}
        </div>  
        
        {selectedPlayerId ? (
          <button
            onClick={handleConfirmSelection}
            className="mt-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-semibold shadow-md transition-colors duration-200"
          >
            Elegir jugador
          </button>
        ) : (
          <p className="mt-4 text-white/70"> Debes seleccionar un jugador </p>
        )}
      </div>
    </div>
  );
}
