import { useParams, useNavigate } from "react-router-dom";
import { createPlayerService } from "../../services/playerService";
import { createGameService } from "../../services/gameService";
import createWSService from "../../services/WSService";
import { createGamePlayerService } from "../../services/gamePlayerService";
import useLobby from "./useLobby";
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";


vi.mock("react-router-dom", () => ({
	useNavigate: vi.fn(),
	useParams : vi.fn(),
}));

vi.mock("../../services/playerService");
vi.mock("../../services/gameService");
vi.mock("../../services/WSService");
vi.mock("../../services/gamePlayerService");

describe("useLobby", async () => {
	const mockConnect = vi.fn();
	const mockDisconnect = vi.fn();
	const mockOn = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();

		useParams.mockReturnValue({ game_id: "1", player_id: "10"});
		useNavigate.mockReturnValue(vi.fn());

		createGameService.mockReturnValue({
			getGameById: vi.fn().mockResolvedValue({ id: 1, min_players: 2, is_started: false}),
			startGame: vi.fn(),
		});

		createPlayerService.mockReturnValue({ 
			getPlayerById: vi.fn().mockResolvedValue({ id: 10, is_Owner: true}),
		});

		createGamePlayerService.mockReturnValue({
			getGamePlayers: vi.fn().mockResolvedValue([{id: 10, name:"Alexis"}]),
		});

		createWSService.mockReturnValue({
			connect: mockConnect,
			disconnect: mockDisconnect,
			on: mockOn,
		});
	});

	it("Inicializa correctamente el lobby (lógica dentro de useLobby)", async () => {
		const { result } = renderHook(() => useLobby());

		await waitFor(() => {
			expect(result.current.game).not.toBeNull();
		});

		expect(result.current.game).toEqual({ id:1, min_players: 2, is_started: false});
		expect(result.current.players).toEqual([{id: 10, name:"Alexis"}]);
		expect(result.current.isHost).toBe(true);

		expect(mockConnect).toHaveBeenCalled();
		expect(mockOn).toHaveBeenCalledWith("gamePlayerAdd", expect.any(Function));

	});

	it("Llama a navigate cuando recibe gameStartGame", async () => {
		const mockNavigate = vi.fn();
		useNavigate.mockReturnValue(mockNavigate);

		createWSService.mockReturnValue({
			connect: mockConnect,
			disconnect: mockDisconnect,
			on: vi.fn((event, cb) => {
				if(event === "gameStartGame") cb(true);
			}),
		});

		const { result } = renderHook(() => useLobby());

		await waitFor(() => {
			expect(result.current.game).not.toBeNull();
		});

		expect(mockNavigate).toHaveBeenCalledWith("/in_game/1/10");
	});

	it("Limpia la conexión del websocket al desmonstarse", async () => {
		const { unmount, result } = renderHook(() => useLobby());

		await waitFor(() => {
			expect(result.current.game).not.toBeNull();
		});

		unmount();
		expect(mockDisconnect).toHaveBeenCalled();
	});

	it("Llama a startGame correctamente", async () => {
		const mockStart = vi.fn();
		createGameService.mockReturnValue({
			getGameById: vi.fn().mockResolvedValue({ id: 1, is_started: false}),
			startGame: mockStart,
		});

		const { result } = renderHook(() => useLobby());
		await waitFor(() => {
			expect(result.current.game).not.toBeNull();
		});

		await act(async () =>{
			await result.current.startGame();
		});

		expect(mockStart).toHaveBeenCalledWith("1", { id: 1, is_started: true }, { room_id: "1" });
	});

	it("Recibe correctamente a un nuevo jugador entrando al lobby", async () => {
		const { result } = renderHook(() => useLobby());

		await waitFor(() => {
			expect(result.current.players.length).toBe(1);
		});

		const handler = mockOn.mock.calls.find(([event]) => event === "gamePlayerAdd")[1];

		await act(async () =>{
			await handler({ id: 2, name: "Ezuu"});
		});

		await waitFor(() => {
			expect(result.current.players).toEqual(
				expect.arrayContaining([
					{ id: 10, name: "Alexis"},
					{ id: 2, name: "Ezuu"},
				])
			);
		});

	});

	it("No navega si gameStartGame recibe false", async () => {
  	const mockNavigate = vi.fn();
  	useNavigate.mockReturnValue(mockNavigate);

  	createWSService.mockReturnValue({
    	connect: mockConnect,
    	disconnect: mockDisconnect,
    	on: vi.fn((event, cb) => {
      	if(event === "gameStartGame") cb(false);
    	}),
  	});

  	renderHook(() => useLobby());

  	await waitFor(() => {
    	expect(mockNavigate).not.toHaveBeenCalled();
  	});
	});

	it("No agrega jugador duplicado al lobby", async () => {
  	const { result } = renderHook(() => useLobby());
  	await waitFor(() => expect(result.current.players.length).toBe(1));

  	const handler = mockOn.mock.calls.find(([event]) => event === "gamePlayerAdd")[1];

  	await act(async () => {
    	await handler({ id: 10, name: "Alexis" });
  	});

  	await waitFor(() => {
    	expect(result.current.players.length).toBe(1);
  	});
	});

});
