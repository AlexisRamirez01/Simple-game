import { createHttpService } from "./HttpService";

export const createCardService = (baseUrl) => {
  const httpService = createHttpService(baseUrl);

  return {
    getCards: (queryParams) => httpService.get("/card", queryParams),
    getCardById: (id, queryParams) => httpService.get(`/card/${id}`, queryParams),
    createCard: (cardData, queryParams) => httpService.post("/card", cardData, queryParams),
    updateCard: (id, cardData, queryParams) => httpService.put(`/card/${id}`, cardData, queryParams),
    deleteCard: (id, queryParams) => httpService.delete(`/card/${id}`, queryParams),
  };
};
