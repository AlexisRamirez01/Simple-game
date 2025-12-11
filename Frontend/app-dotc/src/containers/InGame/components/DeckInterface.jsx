import React, { useState } from 'react';
import Card from './Card';
import cardBack from '../../../assets/card_back.png';

function DeckInterface({ drawCount, discardCount, imageDiscardTop, draftCards = [], onSelectDraftCard }) {
  
  const [activeDraftCardIndex, setActiveDraftCardIndex] = useState(null);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center translate-y-[-50px]">
      {/* Fila superior: mazo de robo y descarte */}
      <div className="flex justify-center items-start w-full gap-50 z-20">
        {/* Mazo de robo */}
        <div className="flex flex-col items-center text-center translate-x-[-55px]">
          <span className="mb-2 text-white font-bold translate-x-[55px]">Cartas: {drawCount}</span>
          <div className="relative h-[120px] flex items-center justify-center">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="absolute"
                style={{ zIndex: index, top: -index * 3, left: -index * 3 }}
              >
                <Card image={cardBack} />
              </div>
            ))}
          </div>
          <span className="mt-2 text-white font-bold text-center relative translate-x-[60px] translate-y-[35px] z-10">Mazo de robo</span>
        </div>

        {/* Mazo de descarte */}
        <div className="flex flex-col items-center text-center translate-x-[-45px]">
          <span className="mb-2 text-white font-bold translate-x-[55px]">Cartas: {discardCount}</span>
          <div className="relative h-[120px] flex items-center justify-center">
            {discardCount > 0 ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="absolute"
                    style={{ zIndex: index, top: -index * 3, left: -index * 3 }}
                  >
                    <Card image={cardBack} />
                  </div>
                ))}
                <div
                  className="absolute"
                  style={{ zIndex: 3, top: -9, left: -9 }}
                >
                  <Card image={imageDiscardTop} />
                </div>
              </>
            ) : (
              <div className="absolute flex items-center justify-center">
                <Card image={cardBack} className="opacity-30 translate-x-[55px] translate-y-[13px]" />
                <span className="absolute text-sm text-white font-bold translate-x-[55px] translate-y-[6px]">
                  No hay cartas<br />descartadas
                </span>
              </div>
            )}
          </div>
          <span className="mt-2 text-white font-bold text-center relative translate-x-[55px] translate-y-[35px] z-10">Mazo de descarte</span>
        </div>
      </div>


      {/* Mazo de draft */}
      <div className="flex flex-col items-center justify-center mt-16 z-20">
        <div className="flex gap-2 mb-1 justify-center h-[120px]">
          {draftCards && draftCards.length > 0 ? (
            draftCards.slice(0, 3).map((card, index) => (
              <div
                key={card.id ?? `draft-${index}`}
                onClick={() => onSelectDraftCard && onSelectDraftCard(card, index)}
              >
                <Card
                  image={card.image_url ?? cardBack}
                  isActive={activeDraftCardIndex === index}
                  onActivate={() => setActiveDraftCardIndex(index)}
                  onDeactivate={() => setActiveDraftCardIndex(null)}
                  
                  activeClass="scale-300 z-50"

                  className="w-full h-full object-contain cursor-pointer"
                />
              </div>
            ))
          ) : (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="relative flex items-center justify-center"
                style={{ width: '80px', height: '110px' }}
              >
                <Card
                  image={cardBack}
                  className="opacity-30 w-full h-full object-contain"
                />
              </div>
            ))
          )}
        </div>
        <span className="text-white font-bold text-center mt-0">Mazo de draft</span>
      </div>
    </div>
  );
}

export default DeckInterface;
