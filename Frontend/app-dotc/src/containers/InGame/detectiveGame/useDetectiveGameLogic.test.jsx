import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import React from 'react';
import { useDetectiveGameLogic } from './useDetectiveGameLogic';

const mockCreateDetectiveSet = vi.fn();
const mockGetDetectiveSetById = vi.fn();
const mockUpdateDetectiveSet = vi.fn();
const mockPlayDetectiveSet = vi.fn();

vi.mock('../../../services/detectiveSetService', () => ({
  createDetectiveSetService: () => ({
    createDetectiveSet: mockCreateDetectiveSet,
    getDetectiveSetById: mockGetDetectiveSetById,
    updateDetectiveSet: mockUpdateDetectiveSet,
    playDetectiveSet: mockPlayDetectiveSet,
  }),
}));

const mockShowNotification = vi.fn();
vi.mock('../../../components/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
}));

const mockLockGame = vi.fn();
const mockUnlockGame = vi.fn();
vi.mock('../context/GameLogicContext', () => ({
  useGameLock: () => ({
    lockGame: mockLockGame,
    unlockGame: mockUnlockGame,
  }),
}));

const mockDetectiveSetValidator = vi.fn();
const mockValidateOliverAddition = vi.fn();
vi.mock('./detectiveSetValidator', () => ({
  detectiveSetValidator: (cards) => mockDetectiveSetValidator(cards),
  validateOliverAddition: (oliver, set) => mockValidateOliverAddition(oliver, set),
}));

const createMockWs = () => {
  const handlers = {};
  return {
    on: vi.fn((event, cb) => {
      handlers[event] = cb;
    }),
    trigger: (event, data) => {
      if (handlers[event]) handlers[event](data);
    },
  };
};

describe('useDetectiveGameLogic', () => {
  const playerId = 1;
  const gameId = 99;
  const setDetectiveSetPlayed = vi.fn();
  let wsInstance;

  beforeEach(() => {
    wsInstance = createMockWs();
    vi.clearAllMocks();
  });

  it('valida correctamente un set válido', async () => {
    mockDetectiveSetValidator.mockReturnValue({
      isValid: true,
      action_secret: 'secret',
      is_cancellable: true,
      wildcard_effects: [],
    });

    const { result } = renderHook(() =>
      useDetectiveGameLogic(playerId, gameId, setDetectiveSetPlayed, wsInstance)
    );

    const cards = [{ id: 10 }, { id: 20 }];
    const validated = result.current.validateDetectiveSet(cards);

    expect(validated).toEqual({
      id_owner: playerId,
      action_secret: 'secret',
      is_cancellable: true,
      wildcard_effects: [],
      detective_card_ids: [10, 20],
    });
  });

  it('lanza error al validar set inválido', () => {
    mockDetectiveSetValidator.mockReturnValue({
      isValid: false,
      error: 'no válido',
    });

    const { result } = renderHook(() =>
      useDetectiveGameLogic(playerId, gameId, setDetectiveSetPlayed, wsInstance)
    );

    const res = result.current.validateDetectiveSet([{ id: 1 }]);
    expect(res).toBeNull();
    expect(mockShowNotification).toHaveBeenCalledWith(
      <p>No es un set válido</p>,
      'Error',
      2000,
      'error'
    );
  });

  it('crea un nuevo detective set exitosamente', async () => {
    mockCreateDetectiveSet.mockResolvedValue({ data: 'ok' });

    const { result } = renderHook(() =>
      useDetectiveGameLogic(playerId, gameId, setDetectiveSetPlayed, wsInstance)
    );

    const response = await act(() =>
      result.current.newDetectiveSet({ id_owner: 1 })
    );

    expect(response).toEqual({ data: 'ok' });
    expect(mockCreateDetectiveSet).toHaveBeenCalled();
  });

  it('maneja error al crear detective set', async () => {
    mockCreateDetectiveSet.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() =>
      useDetectiveGameLogic(playerId, gameId, setDetectiveSetPlayed, wsInstance)
    );

    const response = await act(() =>
      result.current.newDetectiveSet({ id_owner: 1 })
    );

    expect(response).toBeInstanceOf(Error);
  });

  it('añade Oliver a un set existente correctamente', async () => {
    mockGetDetectiveSetById.mockResolvedValue({
      data: { id_owner: 1, action_secret: 'a', is_cancellable: true, detective_card_ids: [1] },
    });
    mockValidateOliverAddition.mockReturnValue({ isValid: true, wildcard_effects: [] });
    mockUpdateDetectiveSet.mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useDetectiveGameLogic(playerId, gameId, setDetectiveSetPlayed, wsInstance)
    );

    const res = await act(() =>
      result.current.addOliverToExistingSet({ id: 2 }, 123)
    );

    expect(mockUpdateDetectiveSet).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ detective_card_ids: [1, 2] }),
      { room_id: gameId }
    );
    expect(res).toEqual({ ok: true });
  });

  it('lanza error si la validación de Oliver falla', async () => {
    mockGetDetectiveSetById.mockResolvedValue({ data: {} });
    mockValidateOliverAddition.mockReturnValue({ isValid: false, error: 'invalid' });

    const { result } = renderHook(() =>
      useDetectiveGameLogic(playerId, gameId, setDetectiveSetPlayed, wsInstance)
    );

    const res = await act(() =>
      result.current.addOliverToExistingSet({ id: 5 }, 9)
    );

    expect(res).toBe('Error de validación en el set');
  });

  it('ejecuta playDetectiveSet correctamente', async () => {
    mockPlayDetectiveSet.mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useDetectiveGameLogic(playerId, gameId, setDetectiveSetPlayed, wsInstance)
    );

    const res = await act(() =>
      result.current.playDetectiveSet({ id_owner: 1 }, { id: 2 })
    );

    expect(res).toEqual({ ok: true });
  });

  it('maneja error en playDetectiveSet', async () => {
    mockPlayDetectiveSet.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() =>
      useDetectiveGameLogic(playerId, gameId, setDetectiveSetPlayed, wsInstance)
    );

    const res = await act(() =>
      result.current.playDetectiveSet({}, {})
    );

    expect(res).toBeInstanceOf(Error);
  });

  it('responde correctamente a los eventos de websocket', () => {
    const { result } = renderHook(() =>
      useDetectiveGameLogic(playerId, gameId, setDetectiveSetPlayed, wsInstance)
    );

    act(() => {
      wsInstance.trigger('revealTheirSecret', {
        target_id: playerId,
        secret_cards: [1],
      });
    });
    expect(result.current.showSecretModal).toBe(true);
    expect(mockLockGame).toHaveBeenCalled();

    act(() => {
      wsInstance.trigger('revealYourSecret', {
        player_id: playerId,
        secret_cards: [2],
      });
    });
    expect(result.current.secretCards).toEqual([2]);

    act(() => {
      wsInstance.trigger('revealYourSecret', {
        target_id: playerId,
        player_id: 999,
      });
    });
    expect(mockShowNotification).toHaveBeenCalledWith(
      <div></div>,
      'Te van a revelar un secreto',
      3000,
      'default'
    );

    act(() => {
      wsInstance.trigger('hideYourSecret', {
        player_id: playerId,
        secret_cards: [3],
      });
    });
    expect(result.current.secretCards).toEqual([3]);

    act(() => {
      wsInstance.trigger('hideYourSecret', {
        target_id: playerId,
        player_id: 999,
      });
    });
    expect(mockShowNotification).toHaveBeenCalledWith(
      <div></div>,
      'Te van a ocultar un secreto',
      3000,
      'default'
    );

    act(() => {
      wsInstance.trigger('gameUnlock', {});
    });
    expect(mockUnlockGame).toHaveBeenCalled();
  });
});
