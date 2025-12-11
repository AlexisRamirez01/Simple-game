import { createHttpService } from "./HttpService";

export const createPlayerService = (baseUrl) => {
  const httpService = createHttpService(baseUrl);

  return {
    getPlayer: (queryParams) => httpService.get("/player", queryParams),
    getPlayerById: (id, queryParams) => httpService.get(`/player/${id}`, queryParams),
    getPlayersByGame: (gameId, queryParams) => httpService.get(`/player/game/${gameId}/players`, queryParams),
    getPlayersWithRevealedSecrets: (gameId, queryParams) => httpService.get(`/player/game/${gameId}/players-with-revealed-secrets`, queryParams),
    getRevealedSecretsByPlayer: (playerId, queryParams) => httpService.get(`/player/${playerId}/revealed-secrets`, queryParams),
    createPlayer: (playerData, queryParams) => httpService.post("/player", playerData, queryParams),
    updatePlayer: (id, playerData, queryParams) => httpService.put(`/player/${id}`, playerData, queryParams),
    deletePlayer: (id, queryParams) => httpService.delete(`/player/${id}`, queryParams),
  };
};