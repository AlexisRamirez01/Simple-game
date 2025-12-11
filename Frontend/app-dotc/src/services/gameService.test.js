import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGameService } from "./gameService.js";

describe("gameService", () => {
  const baseUrl = "http://localhost:8000";
  const gameService = createGameService(baseUrl);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getGames debería lanzar un error si la API responde con un fallo", async () => {
    //MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Not Found" }),
      })
    );

    await expect(gameService.getGames()).rejects.toThrow(
      "Not Found"
    );
  });

  it("getGames debería devolver todos los juegos sin filtros", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, name: "Aventura" },
            { id: 2, name: "Carrera" },
          ]),
      })
    );

    const games = await gameService.getGames();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game",
      expect.any(Object)
    );

    expect(games).toEqual([
      { id: 1, name: "Aventura" },
      { id: 2, name: "Carrera" },
  ]);
  });

  it("getGameById debería devolver un juego por id", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: "Aventura" }),
      })
    );

    const game = await gameService.getGameById(1);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/1",
      expect.any(Object)
    );
    expect(game).toEqual({ id: 1, name: "Aventura" });
  });

  it("createGame debería crear un juego", async () => {
    const newGame = { id: 3, name: "Puzzle" };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(newGame),
      })
    );

    const result = await gameService.createGame(newGame);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game",
      expect.objectContaining({ method: "POST", body: JSON.stringify(newGame) })
    );
    expect(result).toEqual(newGame);
  });

   // PUT /game/:id
  it("updateGame debería actualizar un juego", async () => {
    const updatedGame = { id: 1, name: "Aventura Actualizada" };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(updatedGame),
      })
    );

    const result = await gameService.updateGame(1, updatedGame);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/1",
      expect.objectContaining({ method: "PUT", body: JSON.stringify(updatedGame) })
    );
    expect(result).toEqual(updatedGame);
  });
  
  it("deleteGame debería eliminar un juego", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    const result = await gameService.deleteGame(1);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/1",
      expect.objectContaining({ method: "DELETE" })
    );
    expect(result).toEqual({ success: true });
  });

});