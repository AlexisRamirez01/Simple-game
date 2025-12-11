import { createHttpService } from "./HttpService";

export const createGameService = (baseUrl) => {
  const httpService = createHttpService(baseUrl);

  return {
    getGames: (queryParams) => httpService.get("/game", queryParams),
    getGameById: (id, queryParams) => httpService.get(`/game/${id}`, queryParams),
    createGame: (gameData, queryParams) => httpService.post("/game", gameData, queryParams),
    updateGame: (id, gameData, queryParams) => httpService.put(`/game/${id}`, gameData, queryParams),
    deleteGame: (id, queryParams) => httpService.delete(`/game/${id}`, queryParams),
    startGame: (id, gameData, queryParams) => httpService.put(`/game/start/${id}`, gameData, queryParams),
    startTimer: (id, playerId, cardId, queryParams) => httpService.post(`/game/${id}/event/start`, {player_id: playerId, card_id: cardId}, queryParams),
    cancelTimer: (id, playerId, queryParams) => httpService.post(`/game/${id}/event/cancel`, {player_id: playerId}, queryParams),
  }
}