import React, { useState } from 'react';
import { createGameCardService } from '../../../services/gameCardService';
import { createEventService } from '../../../services/eventService';

export const useLookIntoTheAshes = (gameId,
	playerId,
	playedCardId,
	setCardsModal,
	setOnSelectCardsModal,
	setIsOpenSelectCards,
	setTitleModal) => {

	const [httpServicesGameCard] = useState(() => createGameCardService());
	const [httpServiceEvent] = useState(() => createEventService());

	const handleSelectDraft = async (playedCardId, cardId, close) => {
		setIsOpenSelectCards(close);

		const payload = {
			game_id: gameId,
			player_id: playerId,
			selected_card_id: cardId,
		};

		try {
			await httpServiceEvent.playEventCard(playedCardId, payload, { room_id: gameId });
		} catch (error) {
			console.error("Error al jugar LITA:", error);
		}
	};

	const getDiscardCards = async () => {
		try {
			const response = await httpServicesGameCard.getGameCardsTopDiscard(gameId, { room_id: gameId });
			setCardsModal(response);
		} catch (error) {
			console.error("Error al obtener top 5:", error);
			setCardsModal([]);
		}
	}

	const playLookIntoTheAshes = (playedCardId) => {
		getDiscardCards();
		setTitleModal("Look Into The Ashes");
		setOnSelectCardsModal(() => (cardId, close) => handleSelectDraft(playedCardId, cardId, close));
		setIsOpenSelectCards(true);
	}
	return {
		playLookIntoTheAshes
	};
}