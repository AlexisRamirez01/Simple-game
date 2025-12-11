import { createGameCardService } from '../../services/gameCardService';
import { createGameService } from '../../services/gameService';
import { createCardService } from '../../services/cardService';


export const getCardOnDiscardTop = async (gameId) => {
  const httpGameCardService = createGameCardService();
  const httpGameService = createGameService();
  const httpCardService = createCardService();

  try {
    const game = await httpGameService.getGameById(gameId, { room_id: gameId });
    const discardTop = game.discard_top;
    const cardOnDiscardTop = await httpGameCardService.getGameCardsTopOneDiscard(gameId, { room_id: gameId });
    const cardTop = cardOnDiscardTop
    const card = await httpCardService.getCardById(cardTop.card_id, { room_id: gameId });
    return card.image_url;
  } catch (error) {
    console.error(error);
  }
};


export const getAmountCardsOnDeck = async (gameId) => {
  const httpGameService = createGameService();

  try {
    const game = await httpGameService.getGameById(gameId, { room_id: gameId });
    const discardTop = game.discard_top;
    const drawTop = game.draw_top;

    return { drawTop, discardTop };

  } catch (error) {
    console.error(error);
  }
};


export const getDraftCards = async (gameId) => {
  const httpGameCardService = createGameCardService();
  const httpCardService = createCardService();

  try {
    const draftCards = await httpGameCardService.getGameCardsByDeck(
      gameId,
      "mazo_draft",
      { room_id: gameId }
    );

    const cardsWithImages = await Promise.all(
      draftCards.map(async (draftCard) => {
        try {
          const fullCard = await httpCardService.getCardById(draftCard.card_id, { room_id: gameId });
          return {
            ...draftCard,
            image_url: fullCard.image_url,
            name: fullCard.name,
            type: fullCard.type,
          };
        } catch (error) {
          console.warn(`Error al obtener carta ${draftCard.card_id}:`, error);
          return draftCard;
        }
      })
    );

    return cardsWithImages;
  } catch (error) {
    console.error("Error al obtener las cartas del draft:", error);
    return [];
  }
};
