import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useDelayTheMurderersEscape } from './useDelayTheMurderersEscape';

// 🧩 Mocks
vi.mock('../../../services/eventService', () => ({
  createEventService: vi.fn(),
}));

vi.mock('../../../services/gameCardService', () => ({
  createGameCardService: vi.fn(),
}));

import { createEventService } from '../../../services/eventService';
import { createGameCardService } from '../../../services/gameCardService';

describe('useDelayTheMurderersEscape', () => {
  const mockPlayEventCard = vi.fn();
  const mockGetGameCardsTopDiscard = vi.fn();

  const setIsOpenMultipleCards = vi.fn();
  const setTitleModal = vi.fn();
  const setCardsModal = vi.fn();
  const setOnSelectMultipleCards = vi.fn();

  const gameId = 1;
  const playerId = 2;

  beforeEach(() => {
    vi.clearAllMocks();

    createEventService.mockReturnValue({
      playEventCard: mockPlayEventCard,
    });

    createGameCardService.mockReturnValue({
      getGameCardsTopDiscard: mockGetGameCardsTopDiscard,
    });
  });

  it('ejecuta correctamente playDelayTheMurderersEscape con éxito', async () => {
    const response = [{ id: 1 }, { id: 2 }];
    mockGetGameCardsTopDiscard.mockResolvedValue(response);

    const { result } = renderHook(() =>
      useDelayTheMurderersEscape(
        gameId,
        playerId,
        setIsOpenMultipleCards,
        setTitleModal,
        setCardsModal,
        setOnSelectMultipleCards
      )
    );

    // Ejecuta la función principal
    await act(async () => {
      result.current.playDelayTheMurderersEscape(99);
    });

    // Verifica configuración del modal
    expect(setTitleModal).toHaveBeenCalledWith('Elige el orden de las cartas');
    expect(setCardsModal).toHaveBeenCalledWith(response);
    expect(setIsOpenMultipleCards).toHaveBeenCalledWith(true);
    expect(setOnSelectMultipleCards).toHaveBeenCalled();

    // 👇 Corrección clave: ejecutar las dos capas de la función
    const wrapperFn = setOnSelectMultipleCards.mock.calls[0][0];
    const selectFn = wrapperFn(); // ejecuta la capa externa
    const cards = [{ id: 1 }];

    await act(async () => {
      await selectFn(cards, false);
    });

    expect(mockPlayEventCard).toHaveBeenCalledWith(
      99,
      {
        game_id: gameId,
        player_id: playerId,
        cards,
      },
      { room_id: gameId }
    );
  });

  it('maneja error al obtener las cartas del descarte', async () => {
    mockGetGameCardsTopDiscard.mockRejectedValue(new Error('Error de red'));

    const { result } = renderHook(() =>
      useDelayTheMurderersEscape(
        gameId,
        playerId,
        setIsOpenMultipleCards,
        setTitleModal,
        setCardsModal,
        setOnSelectMultipleCards
      )
    );

    await act(async () => {
      result.current.playDelayTheMurderersEscape(50);
    });

    expect(setCardsModal).toHaveBeenCalledWith([]);
  });

  it('maneja error al jugar Delay The Murderer\'s Escape', async () => {
    mockGetGameCardsTopDiscard.mockResolvedValue([{ id: 1 }]);
    mockPlayEventCard.mockRejectedValue(new Error('Error jugando carta'));

    const { result } = renderHook(() =>
      useDelayTheMurderersEscape(
        gameId,
        playerId,
        setIsOpenMultipleCards,
        setTitleModal,
        setCardsModal,
        setOnSelectMultipleCards
      )
    );

    await act(async () => {
      result.current.playDelayTheMurderersEscape(77);
    });

    const wrapperFn = setOnSelectMultipleCards.mock.calls[0][0];
    const selectFn = wrapperFn();
    const cards = [{ id: 1 }];

    await act(async () => {
      await selectFn(cards, false);
    });

    expect(mockPlayEventCard).toHaveBeenCalled();
  });
});