import { describe, it, expect, vi } from "vitest";

// Mockeamos React antes que nada
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useState: (initializer) => {
      const value = typeof initializer === "function" ? initializer() : initializer;
      return [value, vi.fn()];
    },
    useEffect: vi.fn(),
  };
});

// Definimos mocks vacíos para los servicios
vi.mock("../../services/gameService.js", () => ({
  createGameService: vi.fn(),
}));

vi.mock("../../services/playerService.js", () => ({
  createPlayerService: vi.fn(),
}));

vi.mock("../../services/gamePlayerService.js", () => ({
  createGamePlayerService: vi.fn(),
}));

const gameServiceMock = {
  createGame: vi.fn().mockResolvedValue({ id: 1 }),
  getGameById: vi.fn().mockResolvedValue({ id: 1, current_players: 0 }),
  updateGame: vi.fn().mockResolvedValue({}),
};

const playerServiceMock = {
  createPlayer: vi.fn().mockResolvedValue({ id: 2 }),
};

const gamePlayerServiceMock = {
  createGamePlayer: vi.fn().mockResolvedValue({}),
};

// Configuramos los mocks ANTES de importar el componente
import { createGameService } from "../../services/gameService.js";
import { createPlayerService } from "../../services/playerService.js";
import { createGamePlayerService } from "../../services/gamePlayerService.js";

createGameService.mockReturnValue(gameServiceMock);
createPlayerService.mockReturnValue(playerServiceMock);
createGamePlayerService.mockReturnValue(gamePlayerServiceMock);

// Importamos el componente después de los mocks
import GamePlayerFormContainer from "./FormContainer.jsx";

// Dentro del test configuramos los mocks y luego importamos el componente
describe("GamePlayerFormContainer", () => {

	beforeEach(() => {
		vi.clearAllMocks(); // limpia llamadas entre tests
	});

	
  it("Crea un nuevo juego si no hay game_id y crea un jugador como dueño", async () => {

    const { handleCreate } = GamePlayerFormContainer();

    const gameData = { name: "partida de prueba" };
    const playerData = { username: "eze" };
		const game_id = null;

    const result = await handleCreate({gameData, playerData, game_id});

    // Verificaciones
    expect(gameServiceMock.createGame).toHaveBeenCalledWith(gameData);
    
    expect(playerServiceMock.createPlayer).toHaveBeenCalledWith({
      ...playerData,
      is_Owner: true,
    });
    
    expect(gameServiceMock.getGameById).toHaveBeenCalledWith(1);
    
    expect(gameServiceMock.updateGame).toHaveBeenCalledWith(1, {
      ...{ id: 1, current_players: 0 },
      current_players: 1,
    });
    
    expect(gamePlayerServiceMock.createGamePlayer).toHaveBeenCalledWith(1, 2, { room_id: 1 });
    
    expect(result).toEqual({ game_id: 1, player_id: 2 });
  });


	it("Si el juego está iniciado, se crea un jugador sin ser dueño y se lo une al juego", async () => {
		const { handleCreate } = GamePlayerFormContainer();
	
		const gameData = null;
		const playerData = { username: "juan" };
		const game_id = 10;

		gameServiceMock.getGameById.mockImplementation((id) =>
			Promise.resolve({ id, current_players: 1 })
		);		
	
		const result = await handleCreate({ gameData, playerData, game_id });
	
		// No se crea un nuevo juego
		expect(gameServiceMock.createGame).not.toHaveBeenCalled();
	
		// Se crea el jugador con is_Owner: false
		expect(playerServiceMock.createPlayer).toHaveBeenCalledWith({
			...playerData,
			is_Owner: false,
		});
	
		// Se obtiene la info del juego existente
		expect(gameServiceMock.getGameById).toHaveBeenCalledWith(game_id);
	
		// Se actualiza la cantidad de jugadores
		expect(gameServiceMock.updateGame).toHaveBeenCalledWith(game_id, {
			...{ id: game_id, current_players: 1 },
			current_players: 2,
		});
	
		// Se agrega la relación jugador-juego
		expect(gamePlayerServiceMock.createGamePlayer).toHaveBeenCalledWith(game_id, 2, { room_id: game_id });
	
		expect(result).toEqual({ game_id, player_id: 2 });
	});


	it("Lanza un error si falla createGame", async () => {
		const { handleCreate } = GamePlayerFormContainer();
	
		const gameData = { name: "partida de prueba" };
		const playerData = { username: "eze" };
	
		// Forzamos que createGame falle
		gameServiceMock.createGame.mockRejectedValueOnce(new Error("Fallo creando el juego"));
	
		// Verificamos que handleCreate propaga el error
		await expect(handleCreate({ gameData, playerData, game_id: null }))
			.rejects.toThrow("Fallo creando el juego");
	});
	

	it("Lanza un error si falla createPlayer", async () => {
		const { handleCreate } = GamePlayerFormContainer();
	
		const gameData = { name: "partida de prueba" };
		const playerData = { username: "eze" };
	
		// Forzamos que createPlayer falle
		playerServiceMock.createPlayer.mockRejectedValueOnce(new Error("Fallo creando el jugador"));
	
		// Verificamos que handleCreate propaga el error
		await expect(handleCreate({ gameData, playerData, game_id: null }))
			.rejects.toThrow("Fallo creando el jugador");
	});


	it("Lanza un error si falla getGameById", async () => {
		const { handleCreate } = GamePlayerFormContainer();
	
		const gameData = { name: "partida de prueba" };
		const playerData = { username: "eze" };
	
		// Forzamos que getGameById falle
		gameServiceMock.getGameById.mockRejectedValueOnce(new Error("Fallo obteniendo el juego por su id"));
	
		// Verificamos que handleCreate propaga el error
		await expect(handleCreate({ gameData, playerData, game_id: null }))
			.rejects.toThrow("Fallo obteniendo el juego por su id");
	});


	it("Lanza un error si falla updateGame", async () => {
		const { handleCreate } = GamePlayerFormContainer();
	
		const gameData = { name: "partida de prueba" };
		const playerData = { username: "eze" };
	
		// Forzamos que updateGame falle
		gameServiceMock.updateGame.mockRejectedValueOnce(new Error("Fallo actualizando la partida"));
	
		// Verificamos que handleCreate propaga el error
		await expect(handleCreate({ gameData, playerData, game_id: null }))
			.rejects.toThrow("Fallo actualizando la partida");
	});


	it("Lanza un error si falla createGamePlayer", async () => {
		const { handleCreate } = GamePlayerFormContainer();
	
		const gameData = { name: "partida de prueba" };
		const playerData = { username: "eze" };
	
		// Forzamos que createGamePlayer falle
		gamePlayerServiceMock.createGamePlayer.mockRejectedValueOnce(new Error("Fallo creando la relacion entre el jugador y la partida"));
	
		// Verificamos que handleCreate propaga el error
		await expect(handleCreate({ gameData, playerData, game_id: null }))
			.rejects.toThrow("Fallo creando la relacion entre el jugador y la partida");
	});
});
