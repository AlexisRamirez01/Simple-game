import Card from "./Card";
import { useState } from "react";
import secret_front from "../../../assets/secret_front.png";

function Cards({
  cards,
  onSelect,
  selectedCardId,
  areMySecrets = false,
  selectable = false,
  isModalView = false,
  isMiniSetView = false,
}) {
  const normalCards = cards.filter(
    (c) => !c.name?.toLowerCase().includes("secret")
  );
  const secretCards = cards.filter((c) =>
    c.name?.toLowerCase().includes("secret")
  );
  const areDraftCards = cards.some(
    (c) => c.card_position?.toLowerCase() === "mazo_draft"
  );

  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [activeIndex, setActiveIndex] = useState(null);

  const handleToggleSecret = (id) => {
    if (!areMySecrets) return;
    setRevealedSecrets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectCard = (cardId) => {
    if (selectable && onSelect) onSelect(cardId);
  };

  if (isMiniSetView) {
    return (
      <div className="flex justify-center items-center gap-1">
        {cards.map((card, index) => (
          <Card
            key={card.id || index}
            image={card.image_url}
            className="w-8 h-14 rounded-md shadow-sm hover:scale-105 transition-transform duration-150"
            disableScale={false}
          />
        ))}
      </div>
    );
  }
  
  return isModalView ? (
    <div className="flex justify-center items-center h-full w-full p-4">
      <div className="flex flex-col w-full max-w-6xl items-center gap-8 relative">
        {/* Cartas normales */}
        {!areDraftCards && (
          <div className="flex justify-center flex-wrap gap-10">
            {normalCards.map((card, index) => (
              <Card
                key={card.id}
                image={card.image_url}
                isActive={activeIndex === index}
                onActivate={() => setActiveIndex(index)}
                onDeactivate={() => setActiveIndex(null)}
                onClick={() => handleSelectCard(card.id)}
                disableScale={isModalView}
                className={`relative ${
                  selectable &&
                  (
                    Array.isArray(selectedCardId)
                      ? selectedCardId.includes(card.id)
                      : selectedCardId === card.id
                  )
                    ? "outline-4 outline-yellow-400 outline-offset-[-4px]"
                    : ""
                }`}
                style={{ zIndex: index }}
              />
            ))}
          </div>
        )}

        {/* Cartas secretas */}
        {secretCards.length > 0 && (
          <div className="flex justify-center gap-6 mt-4">
            {secretCards.map((card) => {
              const isRevealed = areMySecrets || card.is_revealed || revealedSecrets[card.id];
              const imgSrc = isRevealed ? card.image_url : secret_front;

              const handleClick = selectable
                ? () => handleSelectCard(card.id)
                : () => handleToggleSecret(card.id);

              return (
                <Card
                  key={card.id}
                  image={imgSrc}
                  onClick={handleClick}
                  disableScale={isModalView}
                  className={`w-20 h-28 rounded-2xl shadow-lg overflow-hidden
                    transition-all duration-200 ease-in-out
                    hover:scale-105 hover:brightness-110
                    ${
                      selectable && selectedCardId === card.id
                        ? "outline-4 outline-yellow-400 outline-offset-[-4px]"
                        : ""
                    }
                    ${areMySecrets || selectable ? "cursor-pointer" : ""}
                  `}
                />
              );
            })}
          </div>
        )}

        {/* Cartas del draft */}
        {areDraftCards && (
          <div className="flex justify-center gap-6 mt-4">
            {cards.map((card, index) => (
              <Card
                key={card.card_id}
                image={card.image_url}
                onClick={() => handleSelectCard(card.card_id)}
                disableScale={isModalView}
                className={`w-20 h-28 rounded-2xl shadow-lg overflow-hidden
                  transition-all duration-200 ease-in-out
                  hover:scale-105 hover:brightness-110
                  ${
                    selectable && selectedCardId === card.card_id
                      ? "outline-4 outline-yellow-400 outline-offset-[-4px]"
                      : ""
                  }
                  ${areMySecrets || selectable ? "cursor-pointer" : ""}
                `}
                style={{ zIndex: index }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="flex justify-center items-end h-full w-full p-4">
      <div className="flex w-full max-w-6xl items-end gap-8 relative">
        <div className="flex justify-center flex-1 relative">
          {normalCards.map((card, index) => (
            <div key={card.id} onClick={() => onSelect(card.id)}>
              <Card
                key={card.id}
                image={card.image_url}
                isActive={activeIndex === index}
                onActivate={() => setActiveIndex(index)}
                onDeactivate={() => setActiveIndex(null)}
                disableScale={isModalView}
                className={`relative -ml-12 first:ml-0 ${
                  selectedCardId === card.id ? "ring-4 ring-yellow-400" : ""
                }`}
                style={{ zIndex: index }}
              />
            </div>
          ))}
        </div>

        {secretCards.length > 0 && (
          <div className="flex gap-2 ml-auto scale-90">
            {secretCards.map((card) => {
              const isRevealed = card.is_revealed || revealedSecrets[card.id];
              return (
                <Card
                  key={card.id}
                  image={isRevealed ? card.image_url : secret_front}
                  onClick={() => handleToggleSecret(card.id)}
                  disableScale={isModalView}
                  className={`w-16 h-24 rounded-2xl shadow-lg 
                    overflow-hidden transition-all duration-200 
                    ease-in-out hover:scale-105 hover:brightness-110
                    ${areMySecrets ? "cursor-pointer hover:scale-105" : ""}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Cards;
