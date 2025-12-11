import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEventService } from "./eventService.js";

describe("eventService", () => {
  const baseUrl = "http://localhost:8000";
  const eventService = createEventService(baseUrl);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getEventCardById debería buscar una carta por id", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 5, name: "Watson" }),
      })
    );

    const card = await eventService.getEventCardById(5);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/event-cards/5",
      expect.any(Object)
    );
    expect(card).toEqual({ id: 5, name: "Watson" });
  });

  it("createEventCard debería enviar un POST con los datos de la carta", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Event creado" }),
      })
    );

    const cardData = { name: "Poirot" };
    const result = await eventService.createEventCard(cardData);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/event-cards",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(cardData),
      })
    );
    expect(result).toEqual({ message: "Event creado" });
  });

  it("updateEventCard debería enviar un PUT con los datos actualizados", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Evento actualizado" }),
      })
    );

    const id = 3;
    const data = { name: "Nuevo Evento" };
    const result = await eventService.updateEventCard(id, data);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8000/event-cards/${id}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(data),
      })
    );
    expect(result).toEqual({ message: "Evento actualizado" });
  });

  it("deleteEventCard debería enviar un DELETE y devolver mensaje de éxito", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Evento eliminado" }),
      })
    );

    const id = 10;
    const result = await eventService.deleteEventCard(id);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8000/event-cards/${id}`,
      expect.objectContaining({
        method: "DELETE",
      })
    );
    expect(result).toEqual({ message: "Evento eliminado" });
  });

  it("debería lanzar un error si la API devuelve error", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: "Bad Request" }),
      })
    );

    await expect(eventService.getEventCardById()).rejects.toThrow("Bad Request");
  });
});

