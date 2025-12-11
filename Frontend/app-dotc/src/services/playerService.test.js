import { describe, it, expect, vi } from "vitest";
import { createPlayerService } from "./playerService.js";

const playerService = createPlayerService("http://localhost:8000");

describe("PlayerService", () => {
  it("getPlayer debería devolver todos los jugadores", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, name: "Juan", age: 25 },
            { id: 2, name: "Ana", age: 30 },
          ]),
      })
    );

    const players = await playerService.getPlayer();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/player",
      expect.any(Object)
    );
    expect(players).toEqual([
      { id: 1, name: "Juan", age: 25 },
      { id: 2, name: "Ana", age: 30 },
    ]);
  });

  it("getPlayer debería lanzar un error si la API responde con un fallo", async () => {
    //MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Not Found" }),
      })
    );

    await expect(playerService.getPlayer()).rejects.toThrow(
      "Not Found"
    );
  });


  it("getPlayerById debería devolver un jugador por id", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 3, name: "Pedro", age: 28 }),
      })
    );

    const player = await playerService.getPlayerById(3);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/player/3",
      expect.any(Object)
    );
    expect(player).toEqual({ id: 3, name: "Pedro", age: 28 });
  });

  it("createPlayer debería enviar un POST request con playerData", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Jugador creado" }),
      })
    );

    const playerData = { name: "Lucas", age: 22 };
    const newPlayer = await playerService.createPlayer(playerData);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/player",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(playerData),
      })
    );
    expect(newPlayer).toEqual({ message: "Jugador creado" });
  });

  it("updatePlayer debería enviar un PUT request con playerData", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Jugador actualizado" }),
      })
    );

    const id = 5;
    const playerData = { name: "Lucas Updated", age: 23 };
    const result = await playerService.updatePlayer(id, playerData);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8000/player/${id}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(playerData),
      })
    );

    expect(result).toEqual({ message: "Jugador actualizado" });
  });

  it("deletePlayer debería enviar un DELETE request y devolver mensaje de éxito", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Jugador eliminado" }),
      })
    );

    const id = 7;
    const result = await playerService.deletePlayer(id);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8000/player/${id}`,
      expect.objectContaining({
        method: "DELETE",
      })
    );

    expect(result).toEqual({ message: "Jugador eliminado" });
  });
});
