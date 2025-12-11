import { createHttpService } from "./HttpService";

export const createGameCardService = (baseUrl) => {
  const httpService = createHttpService(baseUrl);

  return {
    createGameCard: (gameId, cardId, queryParams) => httpService.post(`/game-cards/${gameId}/${cardId}`, {}, queryParams),
    getGameCards: (gameId, queryParams) => httpService.get(`/game-cards/${gameId}/cards`, queryParams),
    getGameCardById: (gameId, cardId, queryParams) => httpService.get(`/game-cards/${gameId}/cards/${cardId}`, queryParams),
    updateGameCard: (gameId, cardId, body, queryParams) => httpService.put(`/game-cards/${gameId}/${cardId}`, body, queryParams),
    deleteGameCard: (gameId, cardId, queryParams) => httpService.delete(`/game-cards/${gameId}/${cardId}`, queryParams),
    getGameCardsByDeck: (gameId, deck, queryParams) => httpService.get(`/game-cards/game/${gameId}/cards/${deck}`, queryParams),
    getGameCardsTopDiscard: (gameId, queryParams) => httpService.get(`/game-cards/game/${gameId}/discard-deck/top5`, queryParams),
    getGameCardsTopOneDiscard: (gameId, queryParams) => httpService.get(`/game-cards/game/${gameId}/discard-deck/top1`, queryParams),
  };
};

