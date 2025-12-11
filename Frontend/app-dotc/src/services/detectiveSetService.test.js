// detectiveSetService.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDetectiveSetService } from "./detectiveSetService.js";

describe("detectiveSetService", () => {
  const baseUrl = "http://localhost:8000";
  const detectiveSetService = createDetectiveSetService(baseUrl);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getDetectiveSetById debe buscar un set por id", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1, action_secret: "hide", is_cancellable: false }),
      })
    );

    const sets = await detectiveSetService.getDetectiveSetById(1);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-set/1",
      expect.any(Object)
    );
    expect(sets).toEqual({ id: 1, action_secret: "hide", is_cancellable: false });
  });

  it("getDetectiveSetById debe lanzar un error si la API responde con un fallo", async () => {
    // MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Not Found" }),
      })
    );

    await expect(detectiveSetService.getDetectiveSetById()).rejects.toThrow("Not Found");
  });

  it("getPlayersWithAtLeastOneSet debe devolver todos los jugadores de la partida con al menos un set", async () => {
    const players = [{ id: 1, name: "jorge" }, { id: 2, name: "josesito" }];

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(players),
      })
    );

    const game_id = 10;

    const playersWithSets = await detectiveSetService.getPlayersWithAtLeastOneSet(game_id);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8000/detective-set/players/with-sets/${game_id}`,
      expect.any(Object)
    );

    expect(playersWithSets).toEqual(players);
  });

  it("getPlayersWithAtLeastOneSet debe devolver lista vacía si no hay jugadores en la partida con al menos un set", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    const game_id = 10;

    const playersWithSets = await detectiveSetService.getPlayersWithAtLeastOneSet(game_id);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8000/detective-set/players/with-sets/${game_id}`,
      expect.any(Object)
    );

    expect(playersWithSets).toEqual([]);
  });

  it("getPlayersWithAtLeastOneSet debe lanzar un error si la API responde con un fallo", async () => {
    // MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            detail: "No se pudo obtener los jugadores con sets de la partida",
          }),
      })
    );

    const game_id = 10;

    await expect(detectiveSetService.getPlayersWithAtLeastOneSet(game_id)).rejects.toThrow(
      "No se pudo obtener los jugadores con sets de la partida"
    );
  });

  it("createDetectiveSet debe enviar un POST request con detectiveSetData", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Set de detectives creado" }),
      })
    );

    const detectiveSetData = { id: 1, action_secret: "hide", is_cancellable: false };
    const newDetectiveSet = await detectiveSetService.createDetectiveSet(detectiveSetData);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-set",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(detectiveSetData),
      })
    );
    expect(newDetectiveSet).toEqual({ message: "Set de detectives creado" });
  });

  it("createDetectiveSet debe lanzar un error si la API responde con un fallo", async () => {
    // MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "No se pudo crear" }),
      })
    );

    await expect(detectiveSetService.createDetectiveSet()).rejects.toThrow("No se pudo crear");
  });

  it("deleteDetectiveSet debe enviar un DELETE request y devolver un mensaje de éxito", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Set de detectives eliminado" }),
      })
    );

    const id = 7;
    const result = await detectiveSetService.deleteDetectiveSet(id);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8000/detective-set/${id}`,
      expect.objectContaining({
        method: "DELETE",
      })
    );

    expect(result).toEqual({ message: "Set de detectives eliminado" });
  });

  it("deleteDetectiveSet debe lanzar un error si la API responde con un fallo", async () => {
    // MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "No se pudo eliminar el set" }),
      })
    );

    await expect(detectiveSetService.deleteDetectiveSet()).rejects.toThrow("No se pudo eliminar el set");
  });

  it("updateDetectiveSet debe actualizar un set", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Set de detectives actualizado" }),
      })
    );

    const body = { id_owner: 3 };
    const result = await detectiveSetService.updateDetectiveSet(5, body);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-set/5",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(body),
      })
    );
    expect(result).toEqual({ message: "Set de detectives actualizado" });
  });

  it("updateDetectiveSet debe lanzar un error si la API responde con un fallo", async () => {
    // MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "No se pudo actualizar el set" }),
      })
    );

    await expect(detectiveSetService.updateDetectiveSet()).rejects.toThrow("No se pudo actualizar el set");
  });

  it("updateDetectiveSet debe enviar query params si se proveen", async () => {
    const mockResponse = { message: "Actualizado" };
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const body = { id_owner: 3 };
    const params = { notify: "false" };
    const result = await detectiveSetService.updateDetectiveSet(5, body, params);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-set/5?notify=false",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(body),
      })
    );

    expect(result).toEqual(mockResponse);
  });

  it("getDetectiveSetByPlayer debe obtener los sets de un jugador", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 1,
            action_secret: "hide",
            is_cancellable: false,
            id_owner: 4,
          }),
      })
    );

    const result = await detectiveSetService.getDetectiveSetByPlayer(4);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-set/owner/4",
      expect.any(Object)
    );

    expect(result).toEqual({
      id: 1,
      action_secret: "hide",
      is_cancellable: false,
      id_owner: 4,
    });
  });

  it("getDetectiveSetByPlayer debe lanzar un error si la API responde con un fallo", async () => {
    // MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "No se pudo obtener los sets del jugador" }),
      })
    );

    await expect(detectiveSetService.updateDetectiveSet()).rejects.toThrow(
      "No se pudo obtener los sets del jugador"
    );
  });

  it("getCardsFromDetectiveSet debe obtener las cartas de un set", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 20, name: "carta de prueba 1", description: "desc", is_murderer_escapes: false },
            { id: 10, name: "carta de prueba 2", description: "desc", is_murderer_escapes: false },
          ]),
      })
    );

    const result = await detectiveSetService.getCardsFromDetectiveSet(4);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-set/4/cards",
      expect.any(Object)
    );

    expect(result).toEqual([
      { id: 20, name: "carta de prueba 1", description: "desc", is_murderer_escapes: false },
      { id: 10, name: "carta de prueba 2", description: "desc", is_murderer_escapes: false },
    ]);
  });

  it("getCardsFromDetectiveSet debe lanzar un error si la API responde con un fallo", async () => {
    // MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "No se pudo obtener las cartas del set" }),
      })
    );

    await expect(detectiveSetService.getCardsFromDetectiveSet()).rejects.toThrow(
      "No se pudo obtener las cartas del set"
    );
  });

  it("addDetectiveCardToSet debe añadir una carta dada a un set", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            message: "Detective added successfully",
            set_id: 4,
            detective_id: 10,
          }),
      })
    );

    const result = await detectiveSetService.addDetectiveCardToSet(4, 10);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-set/4/add/10",
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(result).toEqual({
      message: "Detective added successfully",
      set_id: 4,
      detective_id: 10,
    });
  });

  it("addDetectiveCardToSet debe lanzar un error si la API responde con un fallo", async () => {
    // MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "No se pudo añadir la carta al set" }),
      })
    );

    await expect(detectiveSetService.addDetectiveCardToSet()).rejects.toThrow(
      "No se pudo añadir la carta al set"
    );
  });

  it("changeOwnerOfDetectiveSet debe enviar un POST request y cambiar el dueño del set", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            message: "Owner actualizado exitosamente",
            set_id: 2,
            new_owner_id: 10,
          }),
      })
    );

    const result = await detectiveSetService.changeOwnerOfDetectiveSet(2, 10);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-set/2/change-owner/10",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(result).toEqual({
      message: "Owner actualizado exitosamente",
      set_id: 2,
      new_owner_id: 10,
    });
  });

  it("changeOwnerOfDetectiveSet debe lanzar un error si la API responde con un fallo", async () => {
    // MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "No se pudo cambiar el dueño del set" }),
      })
    );

    await expect(detectiveSetService.changeOwnerOfDetectiveSet()).rejects.toThrow(
      "No se pudo cambiar el dueño del set"
    );
  });

  it("playDetectiveSet debe enviar un POST request para jugar el set", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({ set_id: 2, id_owner: 1, is_cancellable: false }),
      })
    );

    const result = await detectiveSetService.playDetectiveSet(2, 3);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-set/play-set/2/3",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(result).toEqual({
      set_id: 2,
      id_owner: 1,
      is_cancellable: false,
    });
  });

  it("playDetectiveSet debe lanzar un error si la API responde con un fallo", async () => {
    // MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "No se pudo jugar el set" }),
      })
    );

    await expect(detectiveSetService.playDetectiveSet()).rejects.toThrow("No se pudo jugar el set");
  });
});
