import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSecretCardService } from "./secretCardService";

describe("secretCardService", () => {
  const baseUrl = "http://localhost:8000";
  const secretCardService = createSecretCardService(baseUrl);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getSecretCards debería hacer GET a /secret-cards", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    await secretCardService.getSecretCards();
    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/secret-cards`,
      expect.any(Object)
    );
  });

  it("getSecretCardById debería hacer GET a /secret-cards/{id}", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    const id = 1;
    await secretCardService.getSecretCardById(id);
    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/secret-cards/${id}`,
      expect.any(Object)
    );
  });

  it("createSecretCard debería hacer POST a /secret-cards", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      })
    );

    const data = { name: "Secret Card Test" };
    await secretCardService.createSecretCard(data);
    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/secret-cards`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(data),
      })
    );
  });

  it("updateSecretCard debería hacer PUT a /secret-cards/{id}", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 5 }),
      })
    );

    const id = 5;
    const data = { is_revealed: true };
    await secretCardService.updateSecretCard(id, data);
    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/secret-cards/${id}`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(data),
      })
    );
  });
  
  it("revealSecret debería hacer PATCH a /secret-cards/{id}/reveal con body y queryParams", async () => {
    const mockResponse = {
      id: 1,
      name: "Secret Card Test",
      is_revealed: true,
      owner: "Jugador 1",
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
    );

    const id = 1;
    const revealed = true;
    const queryParams = { room_id: "room-abc" };

    const result = await secretCardService.revealSecret(id, revealed, queryParams);
    const queryString = new URLSearchParams(queryParams).toString();

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/secret-cards/${id}/reveal?${queryString}`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(revealed),
      })
    );

    expect(result).toEqual(mockResponse);
  });


  it("deleteSecretCard debería hacer DELETE a /secret-cards/{id}", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    const id = 2;
    await secretCardService.deleteSecretCard(id);
    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/secret-cards/${id}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("isRevealed debería hacer GET a /secret-cards/{id}/is_revealed", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ is_revealed: true }),
      })
    );

    const id = 3;
    await secretCardService.isRevealed(id);
    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/secret-cards/${id}/is_revealed`,
      expect.any(Object)
    );
  });

  it("getSecretCardByPlayer debería hacer GET a /secret-cards/player/{id}", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: "Secret Card for Player" }]),
      })
    );

    const playerId = 7;
    await secretCardService.getSecretCardByPlayer(playerId);

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/secret-cards/player/${playerId}`,
      expect.any(Object)
    );
  });
});
