import { useState } from 'react';
import { createEventService } from '../../../services/eventService';
import { createPlayerService } from '../../../services/playerService';
import { useNotification } from '../../../components/NotificationContext';

export const useAndThenThereWasOneMore = (
  gameId,
  playerId,
  playedCardId,
  setPlayersModal,
  setOnSelectPlayer,
  setIsOpenSelectPlayer,
  setCardsModal,
  setOnSelectCardsModal,
  setIsOpenSelectCards,
  setTitleModal,
  setAreMySecrets
) => {
  const [httpServiceEvent] = useState(() => createEventService());
  const [httpServicePlayer] = useState(() => createPlayerService());
  const { showNotification } = useNotification();
  
  const [selectedPlayerWithSecret, setSelectedPlayerWithSecret] = useState(null);
  const [selectedSecretCardId, setSelectedSecretCardId] = useState(null);

  const getPlayersWithRevealedSecrets = async () => {
    try {
      const response = await httpServicePlayer.getPlayersWithRevealedSecrets(gameId, { room_id: gameId });
      if (response.length === 0) {
        console.log("No hay jugadores con secretos revelados. La carta se descartará sin efecto.");
        return false;
      }
      setPlayersModal(response);
      return true;
    } catch (error) {
      console.error("Error al obtener jugadores con secretos revelados:", error);
      setPlayersModal([]);
      return false;
    }
  };

  const getRevealedSecretsFromPlayer = async (playerIdWithSecret) => {
    try {
      const response = await httpServicePlayer.getRevealedSecretsByPlayer(playerIdWithSecret);
      if (response.length === 0) {
        console.error("El jugador no tiene secretos revelados");
        return false;
      }
      setCardsModal(response);
      return true;
    } catch (error) {
      console.error("Error al obtener secretos revelados del jugador:", error);
      setCardsModal([]);
      return false;
    }
  };

  const getAllPlayers = async () => {
    try {
      const response = await httpServicePlayer.getPlayersByGame(gameId, { room_id: gameId });
      setPlayersModal(response);
    } catch (error) {
      console.error("Error al obtener todos los jugadores:", error);
      setPlayersModal([]);
    }
  };

  const handleSelectPlayerWithSecret = async (playedCardId, playerIdWithSecret) => {
    setIsOpenSelectPlayer(false);
    setSelectedPlayerWithSecret(playerIdWithSecret);
    
    const success = await getRevealedSecretsFromPlayer(playerIdWithSecret);
    
    if (success) {
      setTitleModal("Selecciona un secreto revelado");
      setAreMySecrets(true);
      setOnSelectCardsModal(() => (cardId) => handleSelectSecret(playedCardId, cardId));
      setIsOpenSelectCards(true);
    }
  };

  const handleSelectSecret = async (playedCardId, secretCardId) => {
    setIsOpenSelectCards(false);
    setAreMySecrets(false);
    setSelectedSecretCardId(secretCardId);

    await getAllPlayers();
    
    setOnSelectPlayer(() => (targetPlayerId) => handleSelectTargetPlayer(playedCardId, secretCardId, targetPlayerId));
    setIsOpenSelectPlayer(true);
  };

  const handleSelectTargetPlayer = async (playedCardId, secretCardId, targetPlayerId) => {
    setIsOpenSelectPlayer(false);

    const payload = {
      game_id: gameId,
      player_id: playerId,
      revealed_secret_card_id: secretCardId,
      target_player_id: targetPlayerId,
    };

    try {
      await httpServiceEvent.playEventCard(playedCardId, payload, { room_id: gameId });
      console.log("And Then There Was One More ejecutada correctamente");
      setSelectedPlayerWithSecret(null);
      setSelectedSecretCardId(null);
    } catch (error) {
      console.error("Error al ejecutar And Then There Was One More:", error);
      setSelectedPlayerWithSecret(null);
      setSelectedSecretCardId(null);
    }
  };

  const playAndThenThereWasOneMore = async (playedCardId) => {
    const hasPlayers = await getPlayersWithRevealedSecrets();
    
    if (hasPlayers) {
      setOnSelectPlayer(() => (playerIdWithSecret) => handleSelectPlayerWithSecret(playedCardId, playerIdWithSecret));
      setIsOpenSelectPlayer(true);
    } else {
      console.log("La carta se jugó pero no tuvo efecto.");
      
      const payload = {
        game_id: gameId,
        player_id: playerId,
      };

      try {
        await httpServiceEvent.playEventCard(playedCardId, payload, { room_id: gameId });
        console.log("And Then There Was One More descartada sin efecto");

        showNotification(
          <p>No hay secretos revelados actualmente</p>,
          "Información",
          2000,
          "info"
        );
      } catch (error) {
        console.error("Error al descartar And Then There Was One More:", error);
      }
    }
  };

  return {
    playAndThenThereWasOneMore,
  };
};
