import { createHttpService } from "./HttpService";

export const createPlayerCardService = (baseUrl) => {
  const httpService = createHttpService(baseUrl);

  return {
    getPlayerCards: (playerId, queryParams) => httpService.get(`/player/${playerId}/cards`, queryParams),
    createPlayerCard: (playerId, cardId, queryParams) => httpService.post(`/player/${playerId}/${cardId}`, {}, queryParams),
    transferPlayerCard: (oldPlayerId, cardId, newPlayerId, queryParams) => httpService.put(`/player/${oldPlayerId}/cards/${cardId}`, {}, { ...queryParams, new_player_id: newPlayerId }),
    deletePlayerCard: (playerId, cardId, queryParams) => httpService.delete(`/player/${playerId}/cards/${cardId}`, queryParams),
  };
};
