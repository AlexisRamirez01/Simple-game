import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useEarlyTrainToPaddington } from './useEarlyTrainToPaddington';
import { createEventService } from '../../../services/eventService';

vi.mock('../../../services/eventService', () => ({
  createEventService: vi.fn()
}));

describe('useEarlyTrainToPaddington', () => {

  const mockPlayEventCard = vi.fn();

  beforeEach(() => {
    mockPlayEventCard.mockClear();

    createEventService.mockReturnValue({
      playEventCard: mockPlayEventCard
    });
  });

  test('debería llamar playEventCard con los parámetros correctos', async () => {
    const gameId = 10;
    const playerId = 99;
    mockPlayEventCard.mockResolvedValueOnce(); // caso exitoso

    const { result } = renderHook(() =>
      useEarlyTrainToPaddington(gameId, playerId)
    );

    await act(async () => {
      await result.current.playEarlyTrainToPaddington(555);
    });

    expect(mockPlayEventCard).toHaveBeenCalledTimes(1);
    expect(mockPlayEventCard).toHaveBeenCalledWith(
      555,
      { game_id: gameId, player_id: playerId },
      { room_id: gameId }
    );
  });

  test('debería manejar errores en playEventCard (coverage catch)', async () => {
    const gameId = 20;
    const playerId = 77;
    const error = new Error('Fallo test');
    mockPlayEventCard.mockRejectedValueOnce(error);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useEarlyTrainToPaddington(gameId, playerId)
    );

    await act(async () => {
      await result.current.playEarlyTrainToPaddington(999);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error al jugar Early Train To Paddington:',
      error
    );

    consoleSpy.mockRestore();
  });
});
