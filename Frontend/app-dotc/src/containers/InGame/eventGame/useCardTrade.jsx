import { useState, useEffect } from 'react';
import { createEventService } from '../../../services/eventService';
import { createPlayerService } from '../../../services/playerService';
import { createPlayerCardService } from '../../../services/playerCardService';

export const useCardTrade = (
  gameId,
  playerId,
  playedCardId,
  setPlayersModal,
  setOnSelectPlayer,
  setIsOpenSelectPlayer,
  wsInstance,
  cardsInHand,
  setCardsModal,
  setIsOpenSelectCards,
  setOnSelectCardsModal,
  setTitleModal) => {

  const [httpServiceEvent] = useState(() => createEventService());
  const [httpServicePlayer] = useState(() => createPlayerService());
  const [httpServicesPlayerCard] = useState(() => createPlayerCardService());


  const handleSelectCardForTrade = async (cardToGiveId, otherPlayerId, close) => {
    setIsOpenSelectCards(close);

    try {
      const queryParams = { room_id: gameId };
      await httpServicesPlayerCard.transferPlayerCard(
        playerId,
        cardToGiveId,
        otherPlayerId,
        queryParams
      );
    } catch (error) {
      console.error("Error al transferir la carta en Card Trade:", error);
    }
  };


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
    };

    try {
      await httpServiceEvent.playEventCard(playedCardId, payload, { room_id: gameId });
      console.log("Card Trade ejecutada correctamente");
    } catch (error) {
      console.error("Error al ejecutar Card Trade:", error);
    }
  };

  const playCardTrade = (playedCardId) => {
    getPlayers();
    setOnSelectPlayer(() => (targetPlayerId) => handleSelectPlayer(playedCardId, targetPlayerId));
    setIsOpenSelectPlayer(true);
  };

  useEffect(() => {
    if (!wsInstance) {
      console.warn("[useCardTrade] wsInstance no está listo.");
      return;
    }
    wsInstance.on("card_trade_request", (data) => {
      if (data.target_id === playerId) {
        const tradeableCards = cardsInHand.filter(c =>
          !c.name?.toLowerCase().includes('secret_') &&
          c.id !== data.played_card_id
        );

        setCardsModal(tradeableCards);
        setTitleModal("Intercambio de Cartas: Elige una carta para dar");
        setIsOpenSelectCards(true);
        setOnSelectCardsModal(() => async (cardId, close) => {
          setIsOpenSelectCards(close);

          try {
            const queryParams = { room_id: gameId };
            const oldPlayerId = playerId;
            const newPlayerId = data.other_player_id;
            await httpServicesPlayerCard.transferPlayerCard(
              oldPlayerId,
              cardId,
              newPlayerId,
              queryParams
            );
          } catch (error) {
            console.error("Error al transferir la carta en Card Trade (Fase 2):", error);
          }
        });
      }
    });
  }, [
    wsInstance,
    playerId,
    gameId,
    cardsInHand,
    httpServicesPlayerCard,
    setCardsModal,
    setTitleModal,
    setOnSelectCardsModal,
    setIsOpenSelectCards
  ]);

  return {
    playCardTrade,
  };
};