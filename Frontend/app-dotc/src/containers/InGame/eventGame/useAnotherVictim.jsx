import React, { useState } from 'react';
import { createDetectiveSetService } from '../../../services/detectiveSetService';
import { createGamePlayerService } from '../../../services/gamePlayerService';
import { createPlayerService } from '../../../services/playerService';
import { createEventService } from '../../../services/eventService';
import { useNotification } from '../../../components/NotificationContext';

export const useAnotherVictim = (
	gameId,
	playerId,
	setIsOpenSelectPlayer,
	setOnSelectPlayer,
	setPlayersModal,
	setAnotherDetectiveSet,
	setOnSelectSetModal,
	setShowDetectivesSet,
) => {
	const { showNotification } = useNotification()
	const [httpServicesDetectiveSet] = useState(() => createDetectiveSetService());
	const [httpServiceEvent] = useState(() => createEventService());
	const [httpServicesPlayerService] = useState(() => createPlayerService());
	const [httpGamePlayerService] = useState(() => createGamePlayerService());

	const handlePlayerSelectionSets = async (selectedPlayerId) => {
		const setsFromPlayer = await httpServicesDetectiveSet.getDetectiveSetByPlayer(selectedPlayerId);
		setPlayersModal([]);
		setIsOpenSelectPlayer(false),
		setOnSelectPlayer(null);
		setShowDetectivesSet(true);
		setAnotherDetectiveSet(setsFromPlayer);
	};

	const handleOnselectSet = async (playedCardId, detectiveSetId) => {
		setShowDetectivesSet(false);
		try {
			const payload = {
			game_id: gameId,
			player_id: playerId,
			selected_set_id: detectiveSetId,
			};
			await httpServiceEvent.playEventCard(playedCardId, payload, { room_id: gameId });
			setAnotherDetectiveSet(null);
		} catch (error) {
			console.error("Error al jugar LITA:", error);
		}
	};
	
	const playAnotherVictim = async (playedcardId) => {
		const playersWithSets = await httpServicesDetectiveSet.getPlayersWithAtLeastOneSet(gameId);
		const playersRoom = await httpServicesPlayerService.getPlayersByGame(gameId);
    const idsSet = new Set(playersWithSets.map(id => String(id)));

		const filteredPlayers = playersRoom
		.filter(p => p && idsSet.has(String(p.id)) && String(p.id) !== String(playerId));

		if (!filteredPlayers || filteredPlayers.length == 0) {
			showNotification(
						`Juege otra carta`,
						'No hay jugadores con sets jugados',
						3000
					);
			console.log("No hay jugadores con sets disponibles. Se cancela playAnotherVictim.");
			httpGamePlayerService.discardCard(gameId, playerId, playedcardId, { room_id: gameId });
			return;
		}

		setPlayersModal(filteredPlayers);
		setOnSelectPlayer(() => (targetPlayerId) => handlePlayerSelectionSets(targetPlayerId));
		setIsOpenSelectPlayer(true);
		setOnSelectSetModal(() => (detectiveSetId, close) => handleOnselectSet(playedcardId, detectiveSetId, close));
	};

	return {
		playAnotherVictim
	};
};
