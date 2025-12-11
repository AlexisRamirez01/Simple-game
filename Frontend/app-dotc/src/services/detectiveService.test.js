import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDetectiveService } from "./detectiveService.js";

describe("detectiveService", () => {
  const baseUrl = "http://localhost:8000";
  const detectiveService = createDetectiveService(baseUrl);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getDetectiveCards debería buscar cartas de detective con filtros", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: "Sherlock", type: "detective" }]),
      })
    );

    const cards = await detectiveService.getDetectiveCards({ tipo: "detective" });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-cards?tipo=detective",
      expect.any(Object)
    );
    expect(cards).toEqual([{ id: 1, name: "Sherlock", type: "detective" }]);
  });

  it("getDetectiveCardById debería buscar una carta por id", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 5, name: "Watson" }),
      })
    );

    const card = await detectiveService.getDetectiveCardById(5);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-cards/5",
      expect.any(Object)
    );
    expect(card).toEqual({ id: 5, name: "Watson" });
  });

  it("createDetectiveCard debería enviar un POST con los datos de la carta", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Detective creado" }),
      })
    );

    const cardData = { name: "Poirot" };
    const result = await detectiveService.createDetectiveCard(cardData);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-cards",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(cardData),
      })
    );
    expect(result).toEqual({ message: "Detective creado" });
  });

  it("updateDetectiveCard debería enviar un PUT con los datos actualizados", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Detective actualizado" }),
      })
    );

    const id = 3;
    const data = { name: "Nuevo Detective" };
    const result = await detectiveService.updateDetectiveCard(id, data);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8000/detective-cards/${id}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(data),
      })
    );
    expect(result).toEqual({ message: "Detective actualizado" });
  });

  it("deleteDetectiveCard debería enviar un DELETE y devolver mensaje de éxito", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Detective eliminado" }),
      })
    );

    const id = 10;
    const result = await detectiveService.deleteDetectiveCard(id);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8000/detective-cards/${id}`,
      expect.objectContaining({
        method: "DELETE",
      })
    );
    expect(result).toEqual({ message: "Detective eliminado" });
  });

  it("getDetectiveCardAmount debería buscar cantidad de cartas por id", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ count: 2 }),
      })
    );

    const result = await detectiveService.getDetectiveCardAmount(4);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-cards/4",
      expect.any(Object)
    );
    expect(result).toEqual({ count: 2 });
  });

  it("getPlayerDetectiveCards debería devolver las cartas de detective de un jugador", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: "Sherlock" }]),
      })
    );

    const result = await detectiveService.getPlayerDetectiveCards(99);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/detective-cards/99",
      expect.any(Object)
    );
    expect(result).toEqual([{ id: 1, name: "Sherlock" }]);
  });

  it("debería lanzar un error si la API devuelve error", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: "Bad Request" }),
      })
    );

    await expect(detectiveService.getDetectiveCards()).rejects.toThrow("Bad Request");
  });
});

