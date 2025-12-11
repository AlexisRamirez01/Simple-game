import React from "react";

export default function PlayerAvatar({ player, turnPlayerId, onClick, isSelected = false }) {
  const diameter = "72px";
  
  const ringColor = isSelected
    ? "ring-green-500" 
    : player.id === turnPlayerId 
    ? "ring-green-500"
    : "ring-gray-500";

  return (
    <div className="flex flex-col items-center w-24"> 
      <div
        aria-label={player.name}
        title={player.name}
        className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shadow-lg ring-4 ${ringColor} bg-gradient-to-br from-gray-800 to-gray-700 transform transition-transform hover:scale-105`}
        style={{ width: diameter, height: diameter }}
        onClick={onClick}
      >
        
        <img
          src={player.avatar}
          alt={`${player.name} avatar`}
          className="object-cover w-full h-full"
          onError={(e) => { e.currentTarget.style.display = "none"; }}/>
      </div>

      <span className="mt-2 text-white text-sm md:text-base font-semibold text-center drop-shadow-lg">
        {player.name}
      </span>
    </div>
  );
}