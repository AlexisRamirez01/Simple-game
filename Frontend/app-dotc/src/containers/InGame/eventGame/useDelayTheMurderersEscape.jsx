import React, { useState } from 'react';
import { createEventService } from '../../../services/eventService';
import { createGameCardService } from '../../../services/gameCardService';

export const useDelayTheMurderersEscape = (
	gameId,
	playerId,
	setIsOpenMultipleCards,
	setTitleModal,
	setCardsModal,
	setOnSelectMultipleCards) => {

	const [httpServiceEvent] = useState(() => createEventService());
	const [httpServicesGameCard] = useState(() => createGameCardService());

	const handleSelect = async (playedCardId, cards, close) => {
		setIsOpenMultipleCards(close);

		const payload = {
			game_id: gameId,
			player_id: playerId,
			cards: cards
		};

		try {
			await httpServiceEvent.playEventCard(playedCardId, payload, { room_id: gameId });
		} catch (error) {
			console.error("Error al jugar Delay The Murderer's Escape:", error);
		}
	};

	const getCardsFromDiscard = async () => {
		try {
			const response = await httpServicesGameCard.getGameCardsTopDiscard(gameId, { room_id: gameId });

			//Seteamos el modal con las cartas obtenidas
			setCardsModal(response);
		} catch (error) {
			console.error("Error al obtener top 5:", error);
			setCardsModal([]);
		}
	}

	const playDelayTheMurderersEscape = (playedCardId) => {
		//Obtenemos las primeras 5 cartas del mazo de descarte
		getCardsFromDiscard();

		//Seteamos cosas para el modal
		setTitleModal("Elige el orden de las cartas");
		setOnSelectMultipleCards(() => (cards, close) => handleSelect(playedCardId, cards, close));
		setIsOpenMultipleCards(true);
	}
	
	return { playDelayTheMurderersEscape };
}