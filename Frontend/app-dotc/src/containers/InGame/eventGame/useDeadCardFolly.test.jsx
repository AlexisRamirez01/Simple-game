import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeadCardFolly } from './useDeadCardFolly';

const mockPlayEventCard = vi.fn();
const mockTransferPlayerCard = vi.fn();

vi.mock('../../../services/eventService', () => ({
  createEventService: () => ({ playEventCard: mockPlayEventCard }),
}));

vi.mock('../../../services/playerCardService', () => ({
  createPlayerCardService: () => ({ transferPlayerCard: mockTransferPlayerCard }),
}));

describe('useDeadCardFolly', () => {
  const gameId = 1;
  const playerId = 42;
  let wsMock;

  beforeEach(() => {
    wsMock = { on: vi.fn(), off: vi.fn() };
    mockPlayEventCard.mockReset();
    mockTransferPlayerCard.mockReset();
  });

  it('exposes playDeadCardFolly and sets direction modal callbacks (happy path)', async () => {
    let onSelectDirectionHolder = null;
    const setIsOpenDirectionModal = vi.fn();
    const setOnSelectDirection = vi.fn((fn) => { onSelectDirectionHolder = fn; });
    const setTitleDirectionModal = vi.fn();

    const { result } = renderHook(() =>
      useDeadCardFolly(
        gameId,
        playerId,
        setIsOpenDirectionModal,
        setOnSelectDirection,
        setTitleDirectionModal,
        wsMock,
        [],
        vi.fn(),
        vi.fn(),
        vi.fn(),
        vi.fn(),
      )
    );

    expect(result.current.playDeadCardFolly).toBeDefined();

    await act(async () => {
      result.current.playDeadCardFolly(555);
    });

    expect(setTitleDirectionModal).toHaveBeenCalledWith('Seleccionar sentido del intercambio');
    expect(typeof onSelectDirectionHolder).toBe('function');

    mockPlayEventCard.mockResolvedValueOnce({});
    await act(async () => {
      const handler = onSelectDirectionHolder();
      await handler('left');
    });

    expect(mockPlayEventCard).toHaveBeenCalledWith(555, {
      game_id: gameId,
      player_id: playerId,
      trade_direction: 'left',
    }, { room_id: gameId });
  });

  it('handleSelectDirection handles playEventCard error gracefully', async () => {
    let onSelectDirectionHolder = null;
    const setIsOpenDirectionModal = vi.fn();
    const setOnSelectDirection = vi.fn((fn) => { onSelectDirectionHolder = fn; });
    const setTitleDirectionModal = vi.fn();

    renderHook(() =>
      useDeadCardFolly(
        gameId,
        playerId,
        setIsOpenDirectionModal,
        setOnSelectDirection,
        setTitleDirectionModal,
        wsMock,
        [],
        vi.fn(),
        vi.fn(),
        vi.fn(),
        vi.fn(),
      )
    );

    mockPlayEventCard.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() =>
      useDeadCardFolly(
        gameId,
        playerId,
        setIsOpenDirectionModal,
        setOnSelectDirection,
        setTitleDirectionModal,
        wsMock,
        [],
        vi.fn(),
        vi.fn(),
        vi.fn(),
        vi.fn(),
      )
    );

    await act(async () => {
      result.current.playDeadCardFolly(777);
      const handler = onSelectDirectionHolder();
      await handler('right');
    });

    expect(mockPlayEventCard).toHaveBeenCalled();
  });

  it('handles ws card_trade_request and transfers card (happy path)', async () => {
    const setCardsModal = vi.fn();
    const setIsOpenSelectCards = vi.fn();
    const setOnSelectCardsModal = vi.fn((fn) => { /* capture via mock.calls */ });
    const setTitleModal = vi.fn();

    const cardsInHand = [
      { id: 1, name: 'normal_card' },
      { id: 2, name: 'secret_thing' },
      { id: 3, name: 'other_card' },
    ];

    renderHook(() =>
      useDeadCardFolly(
        gameId,
        playerId,
        vi.fn(),
        vi.fn(),
        vi.fn(),
        wsMock,
        cardsInHand,
        setCardsModal,
        setIsOpenSelectCards,
        setOnSelectCardsModal,
        setTitleModal,
      )
    );

    const call = wsMock.on.mock.calls.find(c => c[0] === 'card_trade_request');
    expect(call).toBeTruthy();
    const callback = call[1];

    const data = { target_id: playerId, played_card_id: 1, other_player_id: 99 };
    await act(async () => callback(data));

    expect(setCardsModal).toHaveBeenCalledWith([{ id: 3, name: 'other_card' }]);
    expect(setTitleModal).toHaveBeenCalledWith('Intercambio: Elige una carta para pasar');
    expect(setIsOpenSelectCards).toHaveBeenCalledWith(true);

    const onSelectCallFactory = setOnSelectCardsModal.mock.calls[0][0];
    expect(typeof onSelectCallFactory).toBe('function');

    mockTransferPlayerCard.mockResolvedValueOnce({});
    await act(async () => {
      const handler = onSelectCallFactory();
      await handler(3, false);
    });

    expect(mockTransferPlayerCard).toHaveBeenCalledWith(playerId, 3, 99, { room_id: gameId });
  });

  it('handles transferPlayerCard error gracefully', async () => {
    const setCardsModal = vi.fn();
    const setIsOpenSelectCards = vi.fn();
    const setOnSelectCardsModal = vi.fn((fn) => { /* capture via mock.calls */ });
    const setTitleModal = vi.fn();

    const cardsInHand = [ { id: 5, name: 'cardX' } ];

    renderHook(() =>
      useDeadCardFolly(
        gameId,
        playerId,
        vi.fn(),
        vi.fn(),
        vi.fn(),
        wsMock,
        cardsInHand,
        setCardsModal,
        setIsOpenSelectCards,
        setOnSelectCardsModal,
        setTitleModal,
      )
    );

    const call = wsMock.on.mock.calls.find(c => c[0] === 'card_trade_request');
    const callback = call[1];

    const data = { target_id: playerId, played_card_id: 999, other_player_id: 100 };
    await act(async () => callback(data));

    const onSelectCallFactory = setOnSelectCardsModal.mock.calls[0][0];
    mockTransferPlayerCard.mockRejectedValueOnce(new Error('boom'));

    await act(async () => {
      const handler = onSelectCallFactory();
      await handler(5, false);
    });

    expect(mockTransferPlayerCard).toHaveBeenCalled();
  });

  it('does not crash when wsInstance is not provided', () => {
    const { result } = renderHook(() =>
      useDeadCardFolly(
        gameId,
        playerId,
        vi.fn(),
        vi.fn(),
        vi.fn(),
        null,
        [],
        vi.fn(),
        vi.fn(),
        vi.fn(),
        vi.fn(),
      )
    );

    expect(result.current.playDeadCardFolly).toBeDefined();
  });
});
