import { createHttpService } from "./HttpService";

export const createEventService = (baseUrl) => {
  const httpService = createHttpService(baseUrl);

  return {
    getEventCardById: (cardId, queryParams) => httpService.get(`/event-cards/${cardId}`, queryParams),
    createEventCard: (cardData, queryParams) => httpService.post(`/event-cards`, cardData, queryParams),
    updateEventCard: (cardId, cardData, queryParams) => httpService.put(`/event-cards/${cardId}`,cardData, queryParams),
    deleteEventCard: (cardId, queryParams) => httpService.delete(`/event-cards/${cardId}`, queryParams),
    playEventCard: (cardId, cardData, queryParams) => httpService.put(`/event-cards/play/${cardId}`,cardData, queryParams),
    isCancellabeCard: (cardId, queryParams) => httpService.get(`/event-cards/${cardId}/is-cancellable`, queryParams),
  };
};