import React, { useState } from 'react';
import { createEventService } from '../../../services/eventService';

export const useEarlyTrainToPaddington = (gameId, playerId) => {

	const [httpServiceEvent] = useState(() => createEventService());

	const handleSelect = async (playedCardId) => {
		const payload = {
			game_id: gameId,
			player_id: playerId
		};

		try {
			await httpServiceEvent.playEventCard(playedCardId, payload, { room_id: gameId });
		} catch (error) {
			console.error("Error al jugar Early Train To Paddington:", error);
		}
	};

	const playEarlyTrainToPaddington = (playedCardId) => {
		handleSelect(playedCardId);
	}
	
	return { playEarlyTrainToPaddington };
}