import React, { useState } from 'react';
import Cards from './Cards';
import Card from './Card';
import { useGameLock } from '../context/GameLogicContext';

function PlayerHand({
  cards,
  onSelectCard,
  selectedCardId,
  areMySecrets,
  animatedCards,
  onDiscard,
  canDiscard,
  onRestock,
  canRestock,
  isRestocking,
  onPassTurn,
  isMyTurn,
  canPassTurn,
  canPlaySet,
  canLowerDetective,
  canPlayEvent,
  canPerformPrimary,
  onDetectiveSet,
  hasOliver,
  detectivesSet = [],
  onPlayEventTest,
  onPlayDetective,
  wasPlayedSet,
  isSocialDisgracee
}) {

	const { isLocked, stringLock } = useGameLock();
  const [expandedSetIndex, setExpandedSetIndex] = useState(null);

  return (
    <>
      <div className={`fixed left-0 bottom-14 flex flex-col-reverse scale-80 gap-3 ${expandedSetIndex !== null ? 'z-[100]' : 'z-[40]'}`}>
        {Array.from({ length: Math.ceil(detectivesSet.length / 3) }, (_, rowIndex) => (
          <div key={rowIndex} className="flex gap-3">
            {detectivesSet.slice(rowIndex * 3, rowIndex * 3 + 3).map((set, colIndex) => {
              const index = rowIndex * 3 + colIndex;
              return (
                <div
                  key={index}
                  className={`relative cursor-pointer ${expandedSetIndex === index ? 'z-[100]' : 'z-[40]'}`}
                  onMouseDown={() => setExpandedSetIndex(index)}
                  onMouseUp={() => setExpandedSetIndex(null)}
                  onMouseLeave={() => setExpandedSetIndex(null)}
                >
                  <Card
                    image={set.cards[0]?.image_url}
                    className={`w-20 h-14 rounded-lg shadow-md transition scale-85 opacity-90 hover:scale-80 ${expandedSetIndex === index ? 'opacity-0' : ''}`}
                  />
                  {expandedSetIndex === index && (
                    <div className="absolute bottom-0 left-0 flex gap-1 p-2 bg-yellow-500/70 rounded-lg backdrop-blur-md">
                      <Cards cards={set.cards} isMiniSetView />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-7xl flex flex-col items-center justify-end z-50 pb-4">
        {/* Cartas */}
        <div className="w-full flex justify-center px-4">
          <Cards
            cards={cards}
            onSelect={onSelectCard}
            selectedCardId={selectedCardId}
            areMySecrets={areMySecrets}
            animatedCards={animatedCards}
          />
        </div>

        {/* Botones */}
        {isLocked ? (
          <div className="flex items-center gap-x-1 font-bold text-3xl drop-shadow-md text-green-800 animate-pulse">
            {stringLock || "ESPERANDO ACCIÓN"}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <button
              onClick={onDetectiveSet}
              disabled={!canPlaySet || wasPlayedSet || isSocialDisgracee}
              className={`px-4 py-2 rounded-lg text-white font-semibold transition ${canPerformPrimary && !isSocialDisgracee ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}>
              Jugar Set
            </button>

            <button
              onClick={onPlayDetective}
              disabled={!canLowerDetective || isSocialDisgracee}
              className={`px-4 py-2 rounded-lg text-white font-semibold transition ${canPerformPrimary && !isSocialDisgracee ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}>
              Bajar Detective
            </button>

            <button
              onClick={onPlayEventTest}
              disabled={!canPlayEvent || isSocialDisgracee}
              className={`px-4 py-2 rounded-lg text-white font-semibold transition ${canPerformPrimary && !isSocialDisgracee ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}>
              Jugar Evento
            </button>

            <button
              onClick={onPassTurn}
              disabled={!canPassTurn}
              className={`px-4 py-2 rounded-lg text-white font-semibold transition ${canPassTurn ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}>
              Pasar Turno
            </button>

            <button
              onClick={onDiscard}
              disabled={!canDiscard}
              className={`px-4 py-2 rounded-lg text-white font-semibold
               transition ${canDiscard ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}>
              Descartar carta
            </button>

            <button
              onClick={onRestock}
              disabled={!canRestock || isRestocking}
              className={`px-4 py-2 rounded-lg text-white transition font-semibold ${canRestock && !isRestocking ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}>
              {isRestocking ? 'Reponiendo...' : 'Reponer carta'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default PlayerHand;