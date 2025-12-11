import { createHttpService } from "./HttpService";

export const createSecretCardService = (baseUrl) => {
  const httpService = createHttpService(baseUrl);

  return {
    getSecretCards: (queryParams) =>
      httpService.get("/secret-cards", queryParams),
    getSecretCardById: (id, queryParams) =>
      httpService.get(`/secret-cards/${id}`, queryParams),
    createSecretCard: (cardData, queryParams) =>
      httpService.post("/secret-cards", cardData, queryParams),
    updateSecretCard: (id, cardData, queryParams) =>
      httpService.put(`/secret-cards/${id}`, cardData, queryParams),
    deleteSecretCard: (id, queryParams) =>
      httpService.delete(`/secret-cards/${id}`, queryParams),
    isRevealed: (id, queryParams) =>
      httpService.get(`/secret-cards/${id}/is_revealed`, queryParams),
    revealSecret: (id, revealed = true, queryParams) =>
      httpService.patch(`/secret-cards/${id}/reveal`, revealed , queryParams),
    getSecretCardByPlayer: (id, queryParams) =>
      httpService.get(`/secret-cards/player/${id}`, queryParams),
  };
};
