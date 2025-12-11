import { useState } from 'react';
import { createEventService } from '../../../services/eventService';
import { createPlayerService } from '../../../services/playerService';

export const useCardsOffTheTable = (
  gameId,
  playerId,
  playedCardId,
  setPlayersModal,
  setOnSelectPlayer,
	setIsOpenSelectPlayer) => {

  const [httpServiceEvent] = useState(() => createEventService());
  const [httpServicePlayer] = useState(() => createPlayerService());
  

  const getPlayers = async () => {
		try {
			const response = await httpServicePlayer.getPlayersByGame(gameId, { room_id: gameId });
			const filteredPlayers = response.filter(player => player.id !== playerId);
			setPlayersModal(filteredPlayers);
		} catch (error) {
			console.error("Error al obtener los jugadores:", error);
			setPlayersModal([]);
		}
	}

  const handleSelectPlayer = async (playedCardId, targetPlayerId) => {
    setIsOpenSelectPlayer(false);

    const payload = {
      game_id: gameId,
      player_id: playerId,
      target_player_id: targetPlayerId,
      played_card_id: playedCardId,
    };

    try {
      await httpServiceEvent.playEventCard(playedCardId, payload, { room_id: gameId });
      console.log("Cards Off The Table ejecutada correctamente");
    } catch (error) {
      console.error("Error al ejecutar Cards Off The Table:", error);
    }
  };

  const playCardsOffTheTable = (playedCardId) => {
    getPlayers();
    setOnSelectPlayer(() => (targetPlayerId) => handleSelectPlayer(playedCardId, targetPlayerId));
    setIsOpenSelectPlayer(true);
  };

  return {
    playCardsOffTheTable,
  };
};