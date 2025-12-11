import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import { createGameService } from "../../../services/gameService.js";
import GameListContainer from "./GameListContainer.jsx";


const mockHttpService = {
  getGames: vi.fn().mockResolvedValue([{ id: 1, name: "Partida 1" }]),
};

const mockWsService = {
  on: vi.fn(),
  off: vi.fn(),
};


vi.mock("../../../services/gameService", () => ({
  createGameService: vi.fn(() => mockHttpService),
}));

describe("GameListContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Carga y muestra la lista inicial de juegos", async () => {
    render(
      <MemoryRouter>
        <GameListContainer wsService={mockWsService} />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockHttpService.getGames).toHaveBeenCalled());

    expect(screen.getByText("Partida 1")).toBeInTheDocument();

    expect(mockWsService.on).toHaveBeenCalledWith("gameAdd", expect.any(Function));
    expect(mockWsService.on).toHaveBeenCalledWith("gameRemove", expect.any(Function));
    expect(mockWsService.on).toHaveBeenCalledWith("gameUpdate", expect.any(Function));
  });

  it("Agrega un nuevo juego cuando llega un evento 'gameAdd'", async () => {
    render(
      <MemoryRouter>
        <GameListContainer wsService={mockWsService} />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockWsService.on).toHaveBeenCalledWith("gameAdd", expect.any(Function)));

    const addHandler = mockWsService.on.mock.calls.find(
      ([event]) => event === "gameAdd"
    )[1];

    await act(async () => {
      addHandler({ id: 2, name: "Partida 2" });
    });

    expect(await screen.findByText("Partida 2")).toBeInTheDocument();
  });

  it("Elimina un juego cuando llega un evento 'gameRemove'", async () => {
    render(
      <MemoryRouter>
        <GameListContainer wsService={mockWsService} />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockWsService.on).toHaveBeenCalledWith("gameRemove", expect.any(Function)));

    const removeHandler = mockWsService.on.mock.calls.find(
      ([event]) => event === "gameRemove"
    )[1];

    await act(async () => {
      removeHandler(1);
    });

    await waitFor(() => expect(screen.queryByText("Partida 1")).not.toBeInTheDocument());
  });

  it("Actualiza un juego cuando llega un evento 'gameUpdate'", async () => {
  	render(
    	<MemoryRouter>
      	<GameListContainer wsService={mockWsService} />
    	</MemoryRouter>
  	);

  	await waitFor(() => expect(mockWsService.on).toHaveBeenCalledWith("gameUpdate", expect.any(Function)));

  	const updateHandler = mockWsService.on.mock.calls.find(
    	([event]) => event === "gameUpdate"
  	)[1];

  	await act(async () => {
    	updateHandler({ id: 1, name: "Partida 1 - Actualizada" });
  	});

  	expect(await screen.findByText("Partida 1 - Actualizada")).toBeInTheDocument();
	});

  it("Desuscribe los eventos al desmontar", async () => {
    const { unmount } = render(
      <MemoryRouter>
        <GameListContainer wsService={mockWsService} />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockHttpService.getGames).toHaveBeenCalled());

    unmount();

    expect(mockWsService.off).toHaveBeenCalledWith("gameAdd");
    expect(mockWsService.off).toHaveBeenCalledWith("gameDelete");
    expect(mockWsService.off).toHaveBeenCalledWith("gameUpdate");
  });

  it("Muestra el catch si falla la carga de juegos", async () => {
  	mockHttpService.getGames.mockRejectedValueOnce(new Error("Fallo intencional"));

  	render(
    	<MemoryRouter>
      	<GameListContainer wsService={mockWsService} />
    	</MemoryRouter>
  	);

  	await waitFor(() => expect(mockHttpService.getGames).toHaveBeenCalled());
  
	});
});
