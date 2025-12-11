import React, { useState } from "react";
import Cards from "./Cards";

export const SelectCardsModal = ({ cards, title, onSelect, multiple = false, areMySecrets = false, goBack = false, onBack = null, delay = false}) => {
  const [selectedCards, setSelectedCards] = useState([]);

  const handleSelectCard = (cardId) => {
    if (multiple) {
      setSelectedCards((prev) =>
        prev.includes(cardId)
          ? prev.filter((id) => id !== cardId)
          : [...prev, cardId]
      );
    } else {
      setSelectedCards([cardId]);
    }
  };

  const hasSelection = delay
  ? selectedCards.length === cards.length
  : (selectedCards.length > 0 || cards.length === 0);


  const handleConfirm = () => {
    if (multiple) {
      const cardsObject = selectedCards.map((id) =>
				cards.find((c) => c.id === id)
			);
			onSelect(cardsObject, false);
    } else {
      onSelect(selectedCards[0], false);
    }
  };

	const handleClose = () => {
    onBack(false);
  };


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative bg-white/10 border border-white/20 backdrop-blur-md text-white rounded-2xl p-6 flex flex-col items-center w-11/12 max-w-3xl shadow-2xl transition-all duration-300">
        <h3 className="text-2xl font-bold mb-4 text-center">{title}</h3>

        <div className="flex justify-center w-full overflow-x-auto px-2">
          {cards?.length ? (
            <Cards
              cards={cards}
              onSelect={handleSelectCard}
              selectedCardId={multiple ? selectedCards : selectedCards[0]}
              areMySecrets={areMySecrets}
              selectable={true}
              isModalView={true}
            />
          ) : (
            <p className="text-white/70 text-center my-6">
              No hay cartas para seleccionar
            </p>
          )}
        </div>

        {hasSelection ? (
          <button
            onClick={handleConfirm}
            className="mt-6 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-semibold shadow-md transition-colors duration-200"
          >
            {multiple ? "Elegir cartas" : "Elegir carta"}
          </button>
        ) : (
          delay ? (
						<p className="mt-6 text-white/70">
							Debes seleccionar todas las cartas
						</p>
					) : (
						<p className="mt-6 text-white/70">
							{multiple ? "Debes seleccionar al menos una carta" : "Debes seleccionar una carta"}
						</p>
					)
        )}

				{goBack && (
					<button
						onClick={handleClose}
						className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md transition transform hover:bg-red-800 hover:scale-110 focus:outline-none"
					>
						Volver
					</button>
				)}
      </div>
    </div>
  );
};
