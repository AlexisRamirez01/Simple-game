// playerCardService.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPlayerCardService } from "./playerCardService.js";

describe("playerCardService", () => {
  const baseUrl = "http://localhost:8000";
  const service = createPlayerCardService(baseUrl);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getPlayerCards debería devolver un arreglo con solo los IDs de las cartas", async () => {
    // Simulamos que la API devuelve directamente un arreglo de IDs
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([5, 7]),
      })
    );

    const result = await service.getPlayerCards(10);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/player/10/cards",
      expect.any(Object)
    );

    expect(result).toEqual([5, 7]);
  });

  it("getPlayerCards debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Not Found" }),
      })
    );

    await expect(service.getPlayerCards(10)).rejects.toThrow("Not Found");
  });

  it("createPlayerCard debería asignar una carta a un jugador", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Carta asignada" }),
      })
    );

    const result = await service.createPlayerCard(10, 5);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/player/10/5",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({}),
      })
    );
    expect(result).toEqual({ message: "Carta asignada" });
  });

  it("createPlayerCard debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: "No se puede asignar" }),
      })
    );

    await expect(service.createPlayerCard(10, 5)).rejects.toThrow("No se puede asignar");
  });

  it("transferPlayerCard debería transferir una carta entre jugadores", async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: "Carta transferida" }),
    })
  );

  const result = await service.transferPlayerCard(1, 42, 2, { room_id: "room-abc" });

  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:8000/player/1/cards/42?room_id=room-abc&new_player_id=2",
    expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({}), // porque en tu service usás {}
    })
  );

  expect(result).toEqual({ message: "Carta transferida" });
});

it("transferPlayerCard debería lanzar error si la API falla", async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: "No se pudo transferir" }),
    })
  );

  await expect(
    service.transferPlayerCard(1, 42, 2, { room_id: "room-abc" })
  ).rejects.toThrow("No se pudo transferir");
});

it("deletePlayerCard debería eliminar la carta de un jugador", async () => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: "Carta eliminada" }),
    })
  );

  const result = await service.deletePlayerCard(10, 5);

  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:8000/player/10/cards/5",
    expect.objectContaining({ method: "DELETE" })
  );
  expect(result).toEqual({ message: "Carta eliminada" });
});

  it("deletePlayerCard debería lanzar error si la API falla", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Carta no encontrada" }),
      })
    );

    await expect(service.deletePlayerCard(10, 5)).rejects.toThrow("Carta no encontrada");
  });
});
