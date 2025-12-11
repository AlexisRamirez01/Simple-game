import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useLookIntoTheAshes } from './useLookIntoTheAshes';

const mockPlayEventCard = vi.fn();
const mockGetGameCardsTopDiscard = vi.fn();

vi.mock('../../../services/eventService', () => ({
  createEventService: () => ({
    playEventCard: mockPlayEventCard,
  }),
}));

vi.mock('../../../services/gameCardService', () => ({
  createGameCardService: () => ({
    getGameCardsTopDiscard: mockGetGameCardsTopDiscard,
  }),
}));

describe('useLookIntoTheAshes', () => {
  const gameId = 1;
  const playerId = 10;
  const playedCardId = 100;
  const setCardsModal = vi.fn();
  const setOnSelectCardsModal = vi.fn();
  const setIsOpenSelectCards = vi.fn();
  const setTitleModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  it('ejecuta playLookIntoTheAshes correctamente y abre el modal', async () => {
    mockGetGameCardsTopDiscard.mockResolvedValue(['c1', 'c2']);

    const { result } = renderHook(() =>
      useLookIntoTheAshes(
        gameId,
        playerId,
        playedCardId,
        setCardsModal,
        setOnSelectCardsModal,
        setIsOpenSelectCards,
        setTitleModal
      )
    );

    await act(async () => {
      result.current.playLookIntoTheAshes(playedCardId);
    });

    expect(mockGetGameCardsTopDiscard).toHaveBeenCalledWith(gameId, { room_id: gameId });
    expect(setCardsModal).toHaveBeenCalledWith(['c1', 'c2']);
    expect(setTitleModal).toHaveBeenCalledWith('Look Into The Ashes');
    expect(setIsOpenSelectCards).toHaveBeenCalledWith(true);
    expect(setOnSelectCardsModal).toHaveBeenCalled();

    const callbackCreator = setOnSelectCardsModal.mock.calls[0][0];
    expect(typeof callbackCreator).toBe('function');
  });

  it('maneja error al obtener top 5', async () => {
    mockGetGameCardsTopDiscard.mockRejectedValue(new Error('Error de red'));

    const { result } = renderHook(() =>
      useLookIntoTheAshes(
        gameId,
        playerId,
        playedCardId,
        setCardsModal,
        setOnSelectCardsModal,
        setIsOpenSelectCards,
        setTitleModal
      )
    );

    await act(async () => {
      result.current.playLookIntoTheAshes(playedCardId);
    });

    expect(console.error).toHaveBeenCalledWith('Error al obtener top 5:', expect.any(Error));
    expect(setCardsModal).toHaveBeenCalledWith([]);
  });

  it('ejecuta handleSelectDraft correctamente', async () => {
    mockPlayEventCard.mockResolvedValue({ ok: true });
    mockGetGameCardsTopDiscard.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useLookIntoTheAshes(
        gameId,
        playerId,
        playedCardId,
        setCardsModal,
        setOnSelectCardsModal,
        setIsOpenSelectCards,
        setTitleModal
      )
    );

    await act(async () => {
      result.current.playLookIntoTheAshes(playedCardId);
    });

    const callbackCreator = setOnSelectCardsModal.mock.calls[0][0];
    expect(typeof callbackCreator).toBe('function');

    // Obtener el handler real desde el creator y ejecutarlo
    const handler = callbackCreator();
    await act(async () => {
      await handler(3, true);
    });

    expect(setIsOpenSelectCards).toHaveBeenCalledWith(true);
    expect(mockPlayEventCard).toHaveBeenCalledWith(
      playedCardId,
      { game_id: gameId, player_id: playerId, selected_card_id: 3 },
      { room_id: gameId }
    );
  });

  it('maneja error al ejecutar handleSelectDraft', async () => {
    mockPlayEventCard.mockRejectedValue(new Error('Error al jugar carta'));
    mockGetGameCardsTopDiscard.mockResolvedValue([]);

    const { result } = renderHook(() =>
      useLookIntoTheAshes(
        gameId,
        playerId,
        playedCardId,
        setCardsModal,
        setOnSelectCardsModal,
        setIsOpenSelectCards,
        setTitleModal
      )
    );

    await act(async () => {
      result.current.playLookIntoTheAshes(playedCardId);
    });

    const callbackCreator = setOnSelectCardsModal.mock.calls[0][0];
    // Obtener el handler real desde el creator y ejecutarlo
    const handler = callbackCreator();
    await act(async () => {
      await handler(5, true);
    });

    expect(setIsOpenSelectCards).toHaveBeenCalledWith(true);
    expect(console.error).toHaveBeenCalledWith('Error al jugar LITA:', expect.any(Error));
  });

  it('puede llamarse múltiples veces sin error', async () => {
    mockGetGameCardsTopDiscard.mockResolvedValue(['x']);

    const { result } = renderHook(() =>
      useLookIntoTheAshes(
        gameId,
        playerId,
        playedCardId,
        setCardsModal,
        setOnSelectCardsModal,
        setIsOpenSelectCards,
        setTitleModal
      )
    );

    await act(async () => {
      result.current.playLookIntoTheAshes(100);
      result.current.playLookIntoTheAshes(200);
    });

    expect(mockGetGameCardsTopDiscard).toHaveBeenCalledTimes(2);
    expect(setTitleModal).toHaveBeenCalledTimes(2);
    expect(setIsOpenSelectCards).toHaveBeenCalledTimes(2);
  });
});
