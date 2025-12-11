import { createHttpService } from "./HttpService";

export const createDetectiveService = (baseUrl) => {
  const httpService = createHttpService(baseUrl);

  return {
    getDetectiveCards: (queryParams) => httpService.get(`/detective-cards`, queryParams),
    getDetectiveCardById: (cardId, queryParams) => httpService.get(`/detective-cards/${cardId}`, queryParams),
    getDetectiveCardAmount: (cardId, queryParams) => httpService.get(`/detective-cards/${cardId}`, queryParams),
    createDetectiveCard: (cardData, queryParams) => httpService.post(`/detective-cards`, cardData, queryParams),
    getPlayerDetectiveCards: (playerId, queryParams) => httpService.get(`/detective-cards/${playerId}`, queryParams),
    updateDetectiveCard: (cardId, cardData, queryParams) => httpService.put(`/detective-cards/${cardId}`,cardData, queryParams),
    deleteDetectiveCard: (cardId, queryParams) => httpService.delete(`/detective-cards/${cardId}`, queryParams),
  };
};