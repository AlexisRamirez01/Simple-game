import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useCardsOffTheTable } from './useCardsOffTheTable';

const mockPlayEventCard = vi.fn();
const mockGetPlayersByGame = vi.fn();

vi.mock('../../../services/eventService', () => ({
  createEventService: () => ({
    playEventCard: mockPlayEventCard,
  }),
}));

vi.mock('../../../services/playerService', () => ({
  createPlayerService: () => ({
    getPlayersByGame: mockGetPlayersByGame,
  }),
}));

describe('useCardsOffTheTable', () => {
  const gameId = 1;
  const playerId = 10;
  const playedCardId = 100;
  const setPlayersModal = vi.fn();
  const setOnSelectPlayer = vi.fn();
  const setIsOpenSelectPlayer = vi.fn();

  const mockPlayers = [
    { id: 10, name: 'Player 1', avatar: 'avatar1.png', rol: 'innocent' },
    { id: 20, name: 'Player 2', avatar: 'avatar2.png', rol: 'murderer' },
    { id: 30, name: 'Player 3', avatar: 'avatar3.png', rol: 'accomplice' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  it('obtiene jugadores y filtra el jugador actual correctamente', async () => {
    mockGetPlayersByGame.mockResolvedValue(mockPlayers);

    const { result } = renderHook(() =>
      useCardsOffTheTable(
        gameId,
        playerId,
        playedCardId,
        setPlayersModal,
        setOnSelectPlayer,
        setIsOpenSelectPlayer
      )
    );

    await act(async () => {
      result.current.playCardsOffTheTable(playedCardId);
    });

    // Verifica que se llamó al servicio con los parámetros correctos
    expect(mockGetPlayersByGame).toHaveBeenCalledWith(gameId, { room_id: gameId });

    // Verifica que se filtró el jugador actual (playerId = 10)
    const expectedFilteredPlayers = [
      { id: 20, name: 'Player 2', avatar: 'avatar2.png', rol: 'murderer' },
      { id: 30, name: 'Player 3', avatar: 'avatar3.png', rol: 'accomplice' },
    ];
    expect(setPlayersModal).toHaveBeenCalledWith(expectedFilteredPlayers);
  });

  it('maneja error al obtener jugadores', async () => {
    const errorMessage = 'Error de red';
    mockGetPlayersByGame.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() =>
      useCardsOffTheTable(
        gameId,
        playerId,
        playedCardId,
        setPlayersModal,
        setOnSelectPlayer,
        setIsOpenSelectPlayer
      )
    );

    await act(async () => {
      result.current.playCardsOffTheTable(playedCardId);
    });

    // Verifica que se llamó a setPlayersModal con array vacío
    expect(setPlayersModal).toHaveBeenCalledWith([]);
    
    // Verifica que se registró el error en consola
    expect(console.error).toHaveBeenCalledWith(
      'Error al obtener los jugadores:',
      expect.any(Error)
    );
  });

  it('configura el modal correctamente al jugar la carta', async () => {
    mockGetPlayersByGame.mockResolvedValue(mockPlayers);

    const { result } = renderHook(() =>
      useCardsOffTheTable(
        gameId,
        playerId,
        playedCardId,
        setPlayersModal,
        setOnSelectPlayer,
        setIsOpenSelectPlayer
      )
    );

    await act(async () => {
      result.current.playCardsOffTheTable(playedCardId);
    });

    // Verifica que se abre el modal
    expect(setIsOpenSelectPlayer).toHaveBeenCalledWith(true);

    // Verifica que se configuró el callback de selección
    expect(setOnSelectPlayer).toHaveBeenCalled();
    const callbackWrapper = setOnSelectPlayer.mock.calls[0][0];
    expect(typeof callbackWrapper).toBe('function');
  });

  it('ejecuta handleSelectPlayer correctamente cuando se selecciona un jugador', async () => {
    mockGetPlayersByGame.mockResolvedValue(mockPlayers);
    mockPlayEventCard.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useCardsOffTheTable(
        gameId,
        playerId,
        playedCardId,
        setPlayersModal,
        setOnSelectPlayer,
        setIsOpenSelectPlayer
      )
    );

    // Primero, jugar la carta para configurar el callback
    await act(async () => {
      result.current.playCardsOffTheTable(playedCardId);
    });

    // Verifica que se abre el modal
    expect(setIsOpenSelectPlayer).toHaveBeenCalledWith(true);

    // Obtener el callback configurado (es una función que retorna otra función)
    const outerCallback = setOnSelectPlayer.mock.calls[0][0];
    const innerCallback = outerCallback();
    const targetPlayerId = 20;

    // Ejecutar el callback interno (simular selección de jugador)
    await act(async () => {
      await innerCallback(targetPlayerId);
    });

    // Verifica que se cierra el modal
    expect(setIsOpenSelectPlayer).toHaveBeenCalledWith(false);

    // Verifica que se llamó al servicio de evento con el payload correcto
    expect(mockPlayEventCard).toHaveBeenCalledWith(
      playedCardId,
      {
        game_id: gameId,
        player_id: playerId,
        target_player_id: targetPlayerId,
        played_card_id: playedCardId,
      },
      { room_id: gameId }
    );

    // Verifica que se registró el mensaje de éxito
    expect(console.log).toHaveBeenCalledWith('Cards Off The Table ejecutada correctamente');
  });

  it('maneja error al ejecutar la carta de evento', async () => {
    mockGetPlayersByGame.mockResolvedValue(mockPlayers);
    const errorMessage = 'Error al jugar carta';
    mockPlayEventCard.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() =>
      useCardsOffTheTable(
        gameId,
        playerId,
        playedCardId,
        setPlayersModal,
        setOnSelectPlayer,
        setIsOpenSelectPlayer
      )
    );

    // Jugar la carta
    await act(async () => {
      result.current.playCardsOffTheTable(playedCardId);
    });

    // Obtener el callback configurado (es una función que retorna otra función)
    const outerCallback = setOnSelectPlayer.mock.calls[0][0];
    const innerCallback = outerCallback();
    
    await act(async () => {
      await innerCallback(20);
    });

    // Verifica que se cierra el modal
    expect(setIsOpenSelectPlayer).toHaveBeenCalledWith(false);

    // Verifica que se registró el error
    expect(console.error).toHaveBeenCalledWith(
      'Error al ejecutar Cards Off The Table:',
      expect.any(Error)
    );
  });

  it('filtra correctamente cuando el jugador actual no está en la lista', async () => {
    const playersWithoutCurrent = [
      { id: 20, name: 'Player 2', avatar: 'avatar2.png', rol: 'murderer' },
      { id: 30, name: 'Player 3', avatar: 'avatar3.png', rol: 'accomplice' },
    ];
    mockGetPlayersByGame.mockResolvedValue(playersWithoutCurrent);

    const { result } = renderHook(() =>
      useCardsOffTheTable(
        gameId,
        playerId,
        playedCardId,
        setPlayersModal,
        setOnSelectPlayer,
        setIsOpenSelectPlayer
      )
    );

    await act(async () => {
      result.current.playCardsOffTheTable(playedCardId);
    });

    // Verifica que la lista no cambia si el jugador actual no está presente
    expect(setPlayersModal).toHaveBeenCalledWith(playersWithoutCurrent);
  });

  it('maneja lista vacía de jugadores', async () => {
    mockGetPlayersByGame.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useCardsOffTheTable(
        gameId,
        playerId,
        playedCardId,
        setPlayersModal,
        setOnSelectPlayer,
        setIsOpenSelectPlayer
      )
    );

    await act(async () => {
      result.current.playCardsOffTheTable(playedCardId);
    });

    expect(setPlayersModal).toHaveBeenCalledWith([]);
  });

  it('maneja correctamente cuando solo existe el jugador actual', async () => {
    const onlyCurrentPlayer = [
      { id: 10, name: 'Player 1', avatar: 'avatar1.png', rol: 'innocent' },
    ];
    mockGetPlayersByGame.mockResolvedValue(onlyCurrentPlayer);

    const { result } = renderHook(() =>
      useCardsOffTheTable(
        gameId,
        playerId,
        playedCardId,
        setPlayersModal,
        setOnSelectPlayer,
        setIsOpenSelectPlayer
      )
    );

    await act(async () => {
      result.current.playCardsOffTheTable(playedCardId);
    });

    // Verifica que la lista queda vacía después de filtrar
    expect(setPlayersModal).toHaveBeenCalledWith([]);
  });

  it('puede llamarse playCardsOffTheTable múltiples veces', async () => {
    mockGetPlayersByGame.mockResolvedValue(mockPlayers);

    const { result } = renderHook(() =>
      useCardsOffTheTable(
        gameId,
        playerId,
        playedCardId,
        setPlayersModal,
        setOnSelectPlayer,
        setIsOpenSelectPlayer
      )
    );

    await act(async () => {
      result.current.playCardsOffTheTable(100);
    });

    await act(async () => {
      result.current.playCardsOffTheTable(200);
    });

    // Verifica que se llamó dos veces
    expect(mockGetPlayersByGame).toHaveBeenCalledTimes(2);
    expect(setIsOpenSelectPlayer).toHaveBeenCalledTimes(2);
    expect(setOnSelectPlayer).toHaveBeenCalledTimes(2);
  });
});
