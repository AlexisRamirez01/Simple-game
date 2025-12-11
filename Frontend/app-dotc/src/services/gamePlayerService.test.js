import { describe, it, expect, vi, beforeEach } from "vitest";
import { createGamePlayerService } from "./gamePlayerService.js";

describe("gamePlayerService", () => {
  const baseUrl = "http://localhost:8000";
  const service = createGamePlayerService(baseUrl);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getGamePlayers debería listar jugadores de una partida", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, position_id_player: 2 },
        { id: 2, position_id_player: 5 }]),
      })
    );

    const result = await service.getGamePlayers(20);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/20/players",
      expect.any(Object)
    );
    expect(result).toEqual([{ id: 1, position_id_player: 2 },
    { id: 2, position_id_player: 5 }]);
  });

  it("getGamePlayers debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: "Error interno" }),
      })
    );

    await expect(service.getGamePlayers(20)).rejects.toThrow("Error interno");
  });

  it("createGamePlayer debería añadir jugador a la partida", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Jugador añadido" }),
      })
    );

    const result = await service.createGamePlayer(20, 10);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/20/10",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(result).toEqual({ message: "Jugador añadido" });
  });

  it("createGamePlayer debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: "Jugador ya en partida" }),
      })
    );

    await expect(service.createGamePlayer(20, 10)).rejects.toThrow("Jugador ya en partida");
  });

  it("deleteGamePlayer debería eliminar jugador de la partida", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Jugador eliminado" }),
      })
    );

    const result = await service.deleteGamePlayer(20, 10);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/20/10",
      expect.objectContaining({ method: "DELETE" })
    );
    expect(result).toEqual({ message: "Jugador eliminado" });
  });

  it("deleteGamePlayer debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Jugador no encontrado" }),
      })
    );

    await expect(service.deleteGamePlayer(20, 10)).rejects.toThrow("Jugador no encontrado");
  });

  it("getPlayerRole debería obtener el rol de un jugador en la partida", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ role: "impostor" }),
      })
    );

    const result = await service.getPlayerRole(20, 10);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/20/10/role",
      expect.any(Object)
    );
    expect(result).toEqual({ role: "impostor" });
  });

  it("getPlayerRole debería lanzar un error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Rol no encontrado" }),
      })
    );

    await expect(service.getPlayerRole(20, 10)).rejects.toThrow("Rol no encontrado");
  });

  it("restockCard debería reponer una carta para el jugador", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Carta repuesta" }),
      })
    );

    const result = await service.restockCard(20, 10);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/20/10/restock",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({ message: "Carta repuesta" });
  });

  it("restockCard debería lanzar un error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: "No se puede reponer" }),
      })
    );

    await expect(service.restockCard(20, 10)).rejects.toThrow("No se puede reponer");
  });

  it("discardCard debería descartar una carta del jugador", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Carta descartada" }),
      })
    );

    const result = await service.discardCard(20, 10, 5); // gameId, playerId, cardId

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/20/10/5/discard",
      expect.objectContaining({ method: "PUT" })
    );
    expect(result).toEqual({ message: "Carta descartada" });
  });

  it("discardCard debería lanzar un error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Carta no encontrada" }),
      })
    );

    await expect(service.discardCard(20, 10, 5)).rejects.toThrow("Carta no encontrada");
  });

  it("passTurn debería ejecutar la acción de pasar el turno", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Turno pasado con éxito" }),
      })
    );

    const result = await service.passTurn(20, 10); // gameId, playerId

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/20/10/pass",
      expect.objectContaining({ method: "POST" })
    );
    expect(result).toEqual({ message: "Turno pasado con éxito" });
  });

  it("passTurn debería lanzar un error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 403, // Forbidden (ej. no es el turno del jugador)
        json: () => Promise.resolve({ detail: "No es tu turno para jugar" }),
      })
    );

    await expect(service.passTurn(20, 10)).rejects.toThrow("No es tu turno para jugar");
  });

  it("registerVotes debería registrar un voto correctamente", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ end_votation: false }),
      })
    );

    const result = await service.registerVotes(20, 10, [10, 5]); // gameId, playerId, voteTuple

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/20/10/vote",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ vote: [10, 5] }),
      })
    );
    expect(result).toEqual({ end_votation: false });
  });

  it("registerVotes debería lanzar un error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: "Error al registrar voto" }),
      })
    );

    await expect(service.registerVotes(20, 10, [10, 5])).rejects.toThrow("Error al registrar voto");
  });

  it("registerVotes debería manejar correctamente los queryParams", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ end_votation: true }),
      })
    );

    const result = await service.registerVotes(30, 7, [7, 9], { test: "true" });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/30/7/vote?test=true",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ vote: [7, 9] }),
      })
    );
    expect(result).toEqual({ end_votation: true });
  });

  it("startVotation debería iniciar la votación correctamente", async () => {
    const mockResponse = {
      card_id: 5,
      initiator_id: 10,
      current_voter_id: 2,
      players: [
        { id: 1, name: "Alexis" },
        { id: 2, name: "Lucía" },
      ],
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await service.startVotation(20, 10, 5);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/20/10/5/start-votation",
      expect.any(Object)
    );
    expect(result).toEqual(mockResponse);
  });

  it("startVotation debería lanzar un error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Partida no encontrada" }),
      })
    );

    await expect(service.startVotation(20, 10, 5)).rejects.toThrow("Partida no encontrada");
  });

  it("startVotation debería manejar correctamente los queryParams", async () => {
    const mockResponse = {
      card_id: 7,
      initiator_id: 3,
      current_voter_id: 4,
      players: [
        { id: 1, name: "Alexis" },
        { id: 2, name: "Lucía" },
      ],
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const result = await service.startVotation(30, 7, 2, { room_id: "123" });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/game/30/7/2/start-votation?room_id=123",
      expect.any(Object)
    );
    expect(result).toEqual(mockResponse);
  });

});