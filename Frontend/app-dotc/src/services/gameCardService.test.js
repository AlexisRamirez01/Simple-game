// gameCardService.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGameCardService } from "./gameCardService.js";

describe("gameCardService", () => {
  const baseUrl = "http://localhost:8000";
  const service = createGameCardService(baseUrl);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getGameCards debería listar cartas de una partida", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 5, card_position: "Mazo de robo" }]),
      })
    );

    const result = await service.getGameCards(30);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game-cards/30/cards",
      expect.any(Object)
    );
    expect(result).toEqual([{ id: 5, card_position: "Mazo de robo" }]);
  });

  it("getGameCards debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: "Error interno" }),
      })
    );

    await expect(service.getGameCards(30)).rejects.toThrow("Error interno");
  });

  it("getGameCardById debería obtener una carta específica", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 5, name: "Carta X" }),
      })
    );

    const result = await service.getGameCardById(30, 5);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game-cards/30/cards/5",
      expect.any(Object)
    );
    expect(result).toEqual({ id: 5, name: "Carta X" });
  });

  it("getGameCardById debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Carta no encontrada" }),
      })
    );

    await expect(service.getGameCardById(30, 5)).rejects.toThrow("Carta no encontrada");
  });

  it("createGameCard debería añadir carta a una partida", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Carta añadida" }),
      })
    );

    const result = await service.createGameCard(30, 5);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game-cards/30/5",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(result).toEqual({ message: "Carta añadida" });
  });

  it("createGameCard debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: "Datos inválidos" }),
      })
    );

    await expect(service.createGameCard(30, 5)).rejects.toThrow("Datos inválidos");
  });

  it("updateGameCard debería actualizar carta en partida", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Carta actualizada" }),
      })
    );

    const body = { position_id_card: 2 };
    const result = await service.updateGameCard(30, 5, body);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game-cards/30/5",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(body),
      })
    );
    expect(result).toEqual({ message: "Carta actualizada" });
  });

  it("updateGameCard debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Carta no encontrada" }),
      })
    );

    await expect(service.updateGameCard(30, 5, { position_id_card: 1 }))
      .rejects.toThrow("Carta no encontrada");
  });

  it("deleteGameCard debería eliminar carta de partida", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Carta eliminada" }),
      })
    );

    const result = await service.deleteGameCard(30, 5);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game-cards/30/5",
      expect.objectContaining({ method: "DELETE" })
    );
    expect(result).toEqual({ message: "Carta eliminada" });
  });

  it("deleteGameCard debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: "Carta en uso" }),
      })
    );

    await expect(service.deleteGameCard(30, 5)).rejects.toThrow("Carta en uso");
  });

  it("getGameCardsTopDiscard debería obtener las 5 cartas superiores del descarte", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 80, name: "Look into the Ashes" },
            { id: 75, name: "NotSoFast" },
          ]),
      })
    );

    const result = await service.getGameCardsTopDiscard(3); // Usando gameId=3 como ejemplo

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game-cards/game/3/discard-deck/top5",
      expect.any(Object)
    );
    expect(result).toEqual([
      { id: 80, name: "Look into the Ashes" },
      { id: 75, name: "NotSoFast" },
    ]);
  });

  it("getGameCardsTopDiscard debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: "Error de servidor" }),
      })
    );

    await expect(service.getGameCardsTopDiscard(3)).rejects.toThrow(
      "Error de servidor"
    );
  });

  it("getGameCardsTopOneDiscard debería obtener solo la carta del tope del descarte", async () => {
    // Asumimos que el endpoint /top1 devuelve un OBJETO ÚNICO, no un array
    const mockTopCard = { id: 173, name: "Look into the Ashes", card_order: 5 };
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTopCard),
      })
    );

    const result = await service.getGameCardsTopOneDiscard(3); // gameId=3

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game-cards/game/3/discard-deck/top1",
      expect.any(Object)
    );
    expect(result).toEqual(mockTopCard);
  });

  it("getGameCardsTopOneDiscard debería lanzar un error si el mazo está vacío (404)", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Mazo de descarte vacío" }),
      })
    );

    await expect(service.getGameCardsTopOneDiscard(3)).rejects.toThrow(
      "Mazo de descarte vacío"
    );
  });
});
