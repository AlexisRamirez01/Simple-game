import React from 'react';
import FullScreenCardsModal from './Modal'; // Asegúrate que la ruta a Modal.jsx sea correcta

export default function RestockChoiceModal({ isOpen, onClose, onSelect, draftCards = [] }) {
  if (!isOpen) {
    return null;
  }

  const buttonStyle = `
    w-full md:w-auto flex-1 px-6 py-3 rounded-lg text-white font-semibold 
    shadow-md transition-colors duration-200 text-center whitespace-nowrap
  `;

  return (
    <FullScreenCardsModal title="Elegí de dónde reponer" onClose={onClose}>
      <div className="w-full flex flex-col items-center gap-6">
        
          <div className="w-full max-w-md flex flex-row gap-5 mt-2">
          <button
            className={`${buttonStyle} bg-red-600/50 hover:bg-green-700/100`}
            onClick={() => onSelect('deck')}
          >
            Mazo de Robo
          </button>
          
          <button
            className={`${buttonStyle} bg-red-600/50 hover:bg-green-700/100`}
            onClick={() => onSelect('draft')}
            disabled={!draftCards || draftCards.length === 0}
          >
            Mazo de Draft
          </button>
        </div>
      </div>
    </FullScreenCardsModal>
  );
}
