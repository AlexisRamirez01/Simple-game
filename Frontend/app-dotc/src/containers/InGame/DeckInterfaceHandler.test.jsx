import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  getCardOnDiscardTop,
  getAmountCardsOnDeck,
  getDraftCards,
} from "./DeckInterfaceHandler";

// Mock de los servicios
vi.mock("../../services/gameCardService", () => ({
  createGameCardService: vi.fn(),
}));
vi.mock("../../services/gameService", () => ({
  createGameService: vi.fn(),
}));
vi.mock("../../services/cardService", () => ({
  createCardService: vi.fn(),
}));

import { createGameCardService } from "../../services/gameCardService";
import { createGameService } from "../../services/gameService";
import { createCardService } from "../../services/cardService";

describe("DeckInterfaceHandler", () => {
  let mockGameCardService;
  let mockGameService;
  let mockCardService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGameCardService = {
      getGameCardsByDeck: vi.fn(),
    };
    mockGameService = {
      getGameById: vi.fn(),
    };
    mockCardService = {
      getCardById: vi.fn(),
    };

    createGameCardService.mockReturnValue(mockGameCardService);
    createGameService.mockReturnValue(mockGameService);
    createCardService.mockReturnValue(mockCardService);
  });

  it("Debe obtener correctamente la imagen de la carta superior del descarte", async () => {
    const gameId = 1;
    const fakeGame = { discard_top: "card10" };
    const fakeCardOnDiscardTop = { card_id: 10 }; 
    const fakeCard = { image_url: "img.jpg" };

    mockGameService.getGameById.mockResolvedValue(fakeGame);
    mockGameCardService.getGameCardsTopOneDiscard = vi.fn().mockResolvedValue(fakeCardOnDiscardTop);
    mockCardService.getCardById.mockResolvedValue(fakeCard);

    createGameCardService.mockReturnValue({
      ...mockGameCardService,
      getGameCardsTopOneDiscard: mockGameCardService.getGameCardsTopOneDiscard,
    });

    const result = await getCardOnDiscardTop(gameId);
    expect(result).toBe("img.jpg");

    expect(mockGameService.getGameById).toHaveBeenCalledWith(gameId, { room_id: gameId });
    expect(mockGameCardService.getGameCardsTopOneDiscard).toHaveBeenCalledWith(gameId, { room_id: gameId });
    expect(mockCardService.getCardById).toHaveBeenCalledWith(10, { room_id: gameId });
  });

  it("Debe manejar errores en getCardOnDiscardTop correctamente", async () => {
    const error = new Error("Fallo getCardOnDiscardTop");
    mockGameService.getGameById.mockRejectedValue(error);
    console.error = vi.fn();

    const result = await getCardOnDiscardTop(1);
    expect(result).toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(error);
  });


  it("Debe devolver drawTop y discardTop correctamente", async () => {
    const fakeGame = { discard_top: "d1", draw_top: "d2" };
    mockGameService.getGameById.mockResolvedValue(fakeGame);

    const result = await getAmountCardsOnDeck(1);
    expect(result).toEqual({ discardTop: "d1", drawTop: "d2" });

    expect(mockGameService.getGameById).toHaveBeenCalledWith(1, { room_id: 1 });
  });


  it("Debe manejar error en getAmountCardsOnDeck correctamente", async () => {
    const error = new Error("Fallo en getAmountCardsOnDeck");
    mockGameService.getGameById.mockRejectedValue(error);
    console.error = vi.fn();

    const result = await getAmountCardsOnDeck(1);
    expect(result).toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(error);
  });

  it("Debe devolver las cartas con imagen, nombre y tipo", async () => {
    const gameId = 1;
    const fakeDraftCards = [{ card_id: 5 }, { card_id: 6 }];
    const fakeFullCards = [
      { image_url: "img5.png", name: "Card5" },
      { image_url: "img6.png", name: "Card6" },
    ];

    mockGameCardService.getGameCardsByDeck.mockResolvedValue(fakeDraftCards);
    mockCardService.getCardById
      .mockResolvedValueOnce(fakeFullCards[0])
      .mockResolvedValueOnce(fakeFullCards[1]);

    const result = await getDraftCards(gameId);

    expect(result).toEqual([
      { card_id: 5, image_url: "img5.png", name: "Card5" },
      { card_id: 6, image_url: "img6.png", name: "Card6" },
    ]);
  });


  it("Debe manejar error interno en una carta dentro de getDraftCards", async () => {
    const gameId = 1;
    const fakeDraftCards = [{ card_id: 7 }];
    const error = new Error("Fallo carta");
    console.warn = vi.fn();

    mockGameCardService.getGameCardsByDeck.mockResolvedValue(fakeDraftCards);
    mockCardService.getCardById.mockRejectedValue(error);

    const result = await getDraftCards(gameId);
    expect(result).toEqual(fakeDraftCards);
    expect(console.warn).toHaveBeenCalledWith("Error al obtener carta 7:", error);
  });


  it("Debe manejar error general en getDraftCards", async () => {
    const error = new Error("Fallo general");
    mockGameCardService.getGameCardsByDeck.mockRejectedValue(error);
    console.error = vi.fn();

    const result = await getDraftCards(1);
    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalledWith("Error al obtener las cartas del draft:", error);
  }); 
});
