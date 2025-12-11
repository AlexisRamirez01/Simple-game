import { useState, useEffect } from 'react';
import { createEventService } from '../../../services/eventService';
import { createPlayerCardService } from '../../../services/playerCardService';

export const useDeadCardFolly = (
    gameId,
    playerId,
    setIsOpenDirectionModal,
    setOnSelectDirection,
    setTitleDirectionModal,
    wsInstance,
    cardsInHand,
    setCardsModal,
    setIsOpenSelectCards,
    setOnSelectCardsModal,
    setTitleModal
) => {
    const [httpServiceEvent] = useState(() => createEventService());
    const [httpServicesPlayerCard] = useState(() => createPlayerCardService());
    const handleSelectDirection = async (playedCardId, direction) => {
        setIsOpenDirectionModal(false);

        const payload = {
            game_id: gameId,
            player_id: playerId,
            trade_direction: direction
        };

        try {
            await httpServiceEvent.playEventCard(playedCardId, payload, { room_id: gameId });
        } catch (error) {
            console.error("Error al ejecutar Dead Card Folly (Fase 1):", error);
        }
    };

    const playDeadCardFolly = (playedCardId) => {

        setTitleDirectionModal("Seleccionar sentido del intercambio");
        setOnSelectDirection(() =>
            (direction) => handleSelectDirection(playedCardId, direction)
        );
        setIsOpenDirectionModal(true);
    };

    useEffect(() => {
        if (!wsInstance) {
            console.warn("[useDeadCardFolly] wsInstance no está listo.");
            return;
        }

        const eventName = "card_trade_request";

        wsInstance.on(eventName, (data) => {
            if (data.target_id === playerId) {
                const tradeableCards = cardsInHand.filter(c =>
                    !c.name?.toLowerCase().includes('secret_') &&
                    c.id !== data.played_card_id
                );
                setCardsModal(tradeableCards);
                setTitleModal("Intercambio: Elige una carta para pasar");
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
                        console.error("Error al transferir la carta en Dead Card Folly (Fase 2):", error);
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
        playDeadCardFolly,
    };
};