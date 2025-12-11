// cardService.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCardService } from "./cardService.js";

describe("cardService", () => {
  const baseUrl = "http://localhost:8000";
  const cardService = createCardService(baseUrl);

  beforeEach(() => {
    vi.resetAllMocks();
  });



  it("getCards debería buscar cartas con filtros", async () => {
    //Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: "Juan", type: "evento" }]),
      })
    );

    const cards = await cardService.getCards({ tipo: "evento" });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/card?tipo=evento",
      expect.any(Object)
    );
    expect(cards).toEqual([{ id: 1, name: "Juan", type: "evento" }]);
  });



  it("getCards debería buscar cartas con múltiples filtros", async () => {
    //MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: "Juan", type: "evento" }]),
      })
    );

    const filtros = { nombre: "Juan", tipo: "evento" };
    const cards = await cardService.getCards(filtros);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/card?nombre=Juan&tipo=evento",
      expect.any(Object)
    );

    expect(cards).toEqual([{ id: 1, name: "Juan", type: "evento" }]);
  });



  it("getCard debería lanzar un error si la API responde con un fallo", async () => {
    //MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: "Not Found" }),
      })
    );

    await expect(cardService.getCards()).rejects.toThrow(
      "Not Found"
    );
  });



  it("getCards debería devolver todas las cartas sin filtros", async () => {
    // MOCK fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([{ id: 1, name: "Asesino", type: "secreto" },
          { id: 2, name: "Detective", type: "rol" },]),
      })
    );
    const cards = await cardService.getCards();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/card",
      expect.any(Object)
    );

    expect(cards).toEqual([
      { id: 1, name: "Asesino", type: "secreto" },
      { id: 2, name: "Detective", type: "rol" },
    ]);
  });


  it("getCardById debería buscar una carta por id", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 2, name: "Juan" }),
      })
    );

    const card = await cardService.getCardById(2);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/card/2",
      expect.any(Object)
    );
    expect(card).toEqual({ id: 2, name: "Juan" });
  });



  it("createCard debería enviar un POST request con cardData", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Carta creada" }),
      })
    );

    const cardData = { name: "Juan" };
    const newCard = await cardService.createCard(cardData);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/card",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(cardData),
      })
    );
    expect(newCard).toEqual({ message: "Carta creada" });
  });



  it("updateCard debería enviar un PUT request con cardData", async () => {

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Carta actualizada" }),
      })
    );

    const id = 5;
    const cardData = { name: "Nueva carta" };
    const result = await cardService.updateCard(id, cardData);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8000/card/${id}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(cardData),
      })
    );

    expect(result).toEqual({ message: "Carta actualizada" });
  });



  it("deleteCard debería enviar un DELETE request y devolver mensaje de éxito", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Carta eliminada" }),
      })
    );

    const id = 7;
    const result = await cardService.deleteCard(id);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8000/card/${id}`,
      expect.objectContaining({
        method: "DELETE",
      })
    );

    expect(result).toEqual({ message: "Carta eliminada" });
  });


});
