import { createHttpService } from "./HttpService";

export const createGamePlayerService = (baseUrl) => {
  const httpService = createHttpService(baseUrl);

  return {
    getGamePlayers: (gameId, queryParams) =>
      httpService.get(`/game/${gameId}/players`, queryParams),
    createGamePlayer: (gameId, playerId, queryParams) =>
      httpService.post(`/game/${gameId}/${playerId}`, {}, queryParams),
    deleteGamePlayer: (gameId, playerId, queryParams) =>
      httpService.delete(`/game/${gameId}/${playerId}`, queryParams),
    getPlayerRole: (gameId, playerId, queryParams) =>
      httpService.get(`/game/${gameId}/${playerId}/role`, queryParams),
    restockCard: (gameId, playerId, cardsData, queryParams) =>
      httpService.post(`/game/${gameId}/${playerId}/restock`, cardsData, queryParams),
    getGameCardsByDeck: (gameId, deckName, queryParams) =>
      httpService.get(`/game/${gameId}/cards/${deckName}`, queryParams),
    discardCard: (gameId, playerId, cardId, queryParams) =>
      httpService.put(`/game/${gameId}/${playerId}/${cardId}/discard`, {}, queryParams),
    passTurn: (gameId, playerId, queryParams) =>
      httpService.post(`/game/${gameId}/${playerId}/pass`, {}, queryParams),
    registerVotes: (gameId, playerId, voteInfo, queryParams) => 
      httpService.post(`/game/${gameId}/${playerId}/vote`, { vote: voteInfo }, queryParams),
    startVotation: (gameId, playerId, cardId, queryParams) =>
      httpService.get(`/game/${gameId}/${playerId}/${cardId}/start-votation`, queryParams)
  };
};
