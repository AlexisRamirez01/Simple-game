import { createHttpService } from "./HttpService";

export const createDetectiveSetService = (baseUrl) => {
  const httpService = createHttpService(baseUrl);

  return {
    getDetectiveSetById: (set_id, queryParams) => httpService.get(`/detective-set/${set_id}`, queryParams),
    getDetectiveSetByPlayer: (owner_id, queryParams) => httpService.get(`/detective-set/owner/${owner_id}`, queryParams),
    getCardsFromDetectiveSet: (set_id, queryParams) => httpService.get(`/detective-set/${set_id}/cards`, queryParams),
    getPlayersWithAtLeastOneSet: (game_id, queryParams) => httpService.get(`/detective-set/players/with-sets/${game_id}`),
    createDetectiveSet: (detectiveSetData, queryParams) => httpService.post("/detective-set", detectiveSetData, queryParams),
    changeOwnerOfDetectiveSet: (set_id, owner_id, queryParams) => httpService.post(`/detective-set/${set_id}/change-owner/${owner_id}`, {},queryParams),
    addDetectiveCardToSet: (set_id, detective_id, queryParams) => httpService.post(`/detective-set/${set_id}/add/${detective_id}`, {}, queryParams),
    updateDetectiveSet: (set_id, detectiveSetData, queryParams) => httpService.put(`/detective-set/${set_id}`, detectiveSetData, queryParams),
    deleteDetectiveSet: (id, queryParams) => httpService.delete(`/detective-set/${id}`, queryParams),
    playDetectiveSet: (set_id, target_id, queryParams) => httpService.post(`/detective-set/play-set/${set_id}/${target_id}`, {}, queryParams),
  };
};