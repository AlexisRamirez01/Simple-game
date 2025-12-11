import { useState, useEffect, useCallback, useRef } from "react";
import { createGameService } from "../../../services/gameService";
import { createPlayerCardService } from "../../../services/playerCardService";
import { createEventService } from "../../../services/eventService";
import { createGamePlayerService } from "../../../services/gamePlayerService"
import { useNotification } from '../../../components/NotificationContext';
import { useGameLock } from '../context/GameLogicContext';

import Card from "../components/Card";

export const useNotSoFast = (gameId,
  playerId,
  playedCardId,
  setCardsModal,
  setOnSelectCardsModal,
  setIsOpenSelectCards,
  setTitleModal,
  playEventCard = () => {},
  eventCard = null,

  isDetectiveEffect = false,
  playDetectiveEffect = () => {},
  idDetectiveSet = null,
  targetDetectiveSet = null,
  wsInstance) => {

  const {showNotification} = useNotification()
  const [httpServiceEvent] = useState(() => createEventService());
  const [httpGameService] = useState(() => createGameService());
  const [httpPlayerCardService] = useState(() => createPlayerCardService());
  const [httpGamePlayerService] = useState(() => createGamePlayerService());
  const [hasNotSoFast, setHasNotSoFast] = useState(false);
  const {lockGame, unlockGame} = useGameLock();

  const playedByRef = useRef(null);
  const eventCardRef = useRef(null);

  const detectiveSetByRef = useRef(idDetectiveSet);
  const targetByRef = useRef(targetDetectiveSet);

  useEffect(() => {
    detectiveSetByRef.current = idDetectiveSet;
  }, [idDetectiveSet]);

  useEffect(() => {
    targetByRef.current = targetDetectiveSet;
  }, [targetDetectiveSet]);

  const handleSelectDraft = async (cardId, close) => {

    const payload = {
      game_id: gameId,
      player_id: playerId,
      selected_card_id: cardId,
    };

    try {
      await httpServiceEvent.playEventCard(cardId, payload, { room_id: gameId });
      cancelTimer(playerId, cardId)
    } catch (error) {
      console.error("Error al jugar NSF:", error);
    }
  };

  const startTimer = async (playerId, cardId = null) => {
    try {
      playedByRef.current = playerId;
      if (!isDetectiveEffect) {
        const response = await httpGameService.startTimer(gameId, playerId, cardId, { room_id: gameId });
      } else {
        const response = await httpGameService.startTimer(gameId, playerId, null, { room_id: gameId });
      }
      
    } catch (error) {
      console.error("Error al iniciar el timer:", error);
    }
  }

  const cancelTimer = async (playerId, cardId = null) => {
    try {
      const response = await httpGameService.cancelTimer(gameId, playerId, { room_id: gameId });
      setIsOpenSelectCards(false)
      startTimer(playerId, cardId)
    } catch (error) {
      console.error("Error al cancelar el timer:", error);
    }
  }

  const getPlayerNSFCards = async () => {
    try {
      const response = await httpPlayerCardService.getPlayerCards(playerId, { room_id: gameId });
      const notSoFastCards = response.filter(card => card.name === "Instant_notsofast");
      setCardsModal(notSoFastCards);
      return notSoFastCards
    } catch (error) {
      console.error("Error al obtener cartas", error);
      setCardsModal([]);
    }
  }

  const onTimerStart = useCallback(async () => {
    const notSoFastCards = await getPlayerNSFCards();
    setHasNotSoFast(notSoFastCards.length > 0);
    setOnSelectCardsModal(() => (cardId, close) => handleSelectDraft(cardId, close));
    setIsOpenSelectCards(true);
  }, [getPlayerNSFCards]);

  useEffect(() => {
    if (eventCard) {
        eventCardRef.current = eventCard;
    }
    
    
  }, [eventCard]);

  // EVENTO DE TIMER

  useEffect(() => {    
		wsInstance.on('EVENT_STARTED', (data) => {
			if (data.event_by_player != playerId) {
				onTimerStart()
			} 
      lockGame("Etapa de posible cancelación.")

      if (!isDetectiveEffect) {
        showNotification(
          <Card image={data.card.image_url} />,
          `El jugador ${data.player_name} ha jugado una carta`,
          2000,
          'default',
          { disableOverflow: true, disableHover: true, noAnimation: true }
        )
      }

		})

    wsInstance.on('EVENT_CANCELLED', (data) => {
			setIsOpenSelectCards(false)
      showNotification(
        <p>El jugador <b>{data.player_name}</b> ha jugado un Not So Fast !</p>, 
        "Información",
        2000,
        "info");
		})

    wsInstance.on('COUNTDOWN_END', (data) => {
      setIsOpenSelectCards(false)
      unlockGame()
      if (!isDetectiveEffect) {
        if (playerId == playedByRef.current && data.final_state === "active") {
        playEventCard(eventCardRef.current)
        } else if (playerId == playedByRef.current && data.final_state === "cancelled") {
          httpGamePlayerService.discardCard(gameId, playedByRef.current, eventCardRef.current.id, {room_id: gameId})
        }
      } else {
        if (playerId == playedByRef.current && data.final_state === "active") {
          playDetectiveEffect(detectiveSetByRef.current, targetByRef.current)
        } else {
          showNotification(
            <p>El efecto del set jugado ha sido cancelado</p>,
            "Información",
            2000,
            "info"
        );
        }
      }
      
      if (data.final_state === "cancelled") {
        showNotification(
            <p>El evento será cancelado</p>,
            "Información",
            2000,
            "info"
        );
       

      } else if (data.final_state === "active") {
          showNotification(
              <p>El evento se jugará</p>,
              "Información",
              2000,
              "info"
          );
      }
      playedByRef.current = null;
      eventCardRef.current = (null);
		})

    wsInstance.on('COUNTDOWN_TICK', (data) => {
      if (hasNotSoFast) {
        setTitleModal(`¿Quieres jugar una Not So Fast?  Tiempo: ${data.time}`);
      } else {
        setTitleModal(`No tienes Not So Fast para jugar  Tiempo: ${data.time}`);
      }
    })

    return () => {
      wsInstance.off('EVENT_STARTED');
      wsInstance.off('COUNTDOWN_END');
      wsInstance.off('COUNTDOWN_TICK');
    };

	}, [wsInstance, hasNotSoFast, isDetectiveEffect]);

  return {
    startTimer,
    cancelTimer,
    handleSelectDraft,
    onTimerStart,
    getPlayerNSFCards,
};
}