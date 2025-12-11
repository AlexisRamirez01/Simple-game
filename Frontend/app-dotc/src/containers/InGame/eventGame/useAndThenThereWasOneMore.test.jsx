import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAndThenThereWasOneMore } from './useAndThenThereWasOneMore';

const mockPlayEventCard = vi.fn();
const mockGetPlayersWithRevealedSecrets = vi.fn();
const mockGetRevealedSecretsByPlayer = vi.fn();
const mockGetPlayersByGame = vi.fn();
const mockShowNotification = vi.fn();

vi.mock('../../../services/eventService', () => ({
  createEventService: () => ({
    playEventCard: mockPlayEventCard,
  }),
}));

vi.mock('../../../services/playerService', () => ({
  createPlayerService: () => ({
    getPlayersWithRevealedSecrets: mockGetPlayersWithRevealedSecrets,
    getRevealedSecretsByPlayer: mockGetRevealedSecretsByPlayer,
    getPlayersByGame: mockGetPlayersByGame,
  }),
}));

vi.mock('../../../components/NotificationContext', () => ({
  useNotification: () => ({
    showNotification: mockShowNotification,
  }),
}));

describe('useAndThenThereWasOneMore', () => {
  const gameId = 1;
  const playerId = 10;
  const playedCardId = 100;
  const setPlayersModal = vi.fn();
  const setOnSelectPlayer = vi.fn();
  const setIsOpenSelectPlayer = vi.fn();
  const setCardsModal = vi.fn();
  const setOnSelectCardsModal = vi.fn();
  const setIsOpenSelectCards = vi.fn();
  const setTitleModal = vi.fn();
  const setAreMySecrets = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  describe('playAndThenThereWasOneMore - caso con jugadores con secretos revelados', () => {
    it('ejecuta el flujo completo cuando hay jugadores con secretos revelados', async () => {
      const mockPlayers = [{ id: 1, name: 'Player 1' }, { id: 2, name: 'Player 2' }];
      mockGetPlayersWithRevealedSecrets.mockResolvedValue(mockPlayers);

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(playedCardId);
      });

      expect(mockGetPlayersWithRevealedSecrets).toHaveBeenCalledWith(gameId, { room_id: gameId });
      expect(setPlayersModal).toHaveBeenCalledWith(mockPlayers);
      expect(setOnSelectPlayer).toHaveBeenCalled();
      expect(setIsOpenSelectPlayer).toHaveBeenCalledWith(true);
    });
  });

  describe('playAndThenThereWasOneMore - caso sin jugadores con secretos revelados', () => {
    it('descarta la carta cuando no hay jugadores con secretos revelados', async () => {
      mockGetPlayersWithRevealedSecrets.mockResolvedValue([]);
      mockPlayEventCard.mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(playedCardId);
      });

      expect(mockGetPlayersWithRevealedSecrets).toHaveBeenCalledWith(gameId, { room_id: gameId });
      expect(console.log).toHaveBeenCalledWith('No hay jugadores con secretos revelados. La carta se descartará sin efecto.');
      expect(console.log).toHaveBeenCalledWith('La carta se jugó pero no tuvo efecto.');
      expect(mockPlayEventCard).toHaveBeenCalledWith(
        playedCardId,
        { game_id: gameId, player_id: playerId },
        { room_id: gameId }
      );
      expect(console.log).toHaveBeenCalledWith('And Then There Was One More descartada sin efecto');
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.anything(),
        'Información',
        2000,
        'info'
      );
    });

    it('maneja error al descartar la carta sin secretos revelados', async () => {
      mockGetPlayersWithRevealedSecrets.mockResolvedValue([]);
      mockPlayEventCard.mockRejectedValue(new Error('Error al descartar'));

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(playedCardId);
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error al descartar And Then There Was One More:',
        expect.any(Error)
      );
      expect(mockShowNotification).not.toHaveBeenCalled();
    });
  });

  describe('getPlayersWithRevealedSecrets - manejo de errores', () => {
    it('maneja error al obtener jugadores con secretos revelados', async () => {
      mockGetPlayersWithRevealedSecrets.mockRejectedValue(new Error('Error de red'));

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(playedCardId);
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error al obtener jugadores con secretos revelados:',
        expect.any(Error)
      );
      expect(setPlayersModal).toHaveBeenCalledWith([]);
    });
  });

  describe('handleSelectPlayerWithSecret - flujo completo', () => {
    it('ejecuta handleSelectPlayerWithSecret correctamente', async () => {
      const mockPlayers = [{ id: 1, name: 'Player 1' }];
      const mockSecrets = [{ id: 101, name: 'Secret 1' }, { id: 102, name: 'Secret 2' }];
      mockGetPlayersWithRevealedSecrets.mockResolvedValue(mockPlayers);
      mockGetRevealedSecretsByPlayer.mockResolvedValue(mockSecrets);

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(playedCardId);
      });

      expect(setOnSelectPlayer).toHaveBeenCalled();
      const callbackCreator = setOnSelectPlayer.mock.calls[0][0];
      const handler = callbackCreator();

      await act(async () => {
        await handler(1);
      });

      expect(setIsOpenSelectPlayer).toHaveBeenCalledWith(false);
      expect(mockGetRevealedSecretsByPlayer).toHaveBeenCalledWith(1);
      expect(setCardsModal).toHaveBeenCalledWith(mockSecrets);
      expect(setTitleModal).toHaveBeenCalledWith('Selecciona un secreto revelado');
      expect(setAreMySecrets).toHaveBeenCalledWith(true);
      expect(setOnSelectCardsModal).toHaveBeenCalled();
      expect(setIsOpenSelectCards).toHaveBeenCalledWith(true);
    });

    it('no abre el modal de cartas si el jugador no tiene secretos revelados', async () => {
      const mockPlayers = [{ id: 1, name: 'Player 1' }];
      mockGetPlayersWithRevealedSecrets.mockResolvedValue(mockPlayers);
      mockGetRevealedSecretsByPlayer.mockResolvedValue([]);

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(playedCardId);
      });

      const callbackCreator = setOnSelectPlayer.mock.calls[0][0];
      const handler = callbackCreator();

      await act(async () => {
        await handler(1);
      });

      expect(console.error).toHaveBeenCalledWith('El jugador no tiene secretos revelados');
      expect(setIsOpenSelectCards).not.toHaveBeenCalledWith(true);
    });

    it('maneja error al obtener secretos revelados del jugador', async () => {
      const mockPlayers = [{ id: 1, name: 'Player 1' }];
      mockGetPlayersWithRevealedSecrets.mockResolvedValue(mockPlayers);
      mockGetRevealedSecretsByPlayer.mockRejectedValue(new Error('Error de red'));

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(playedCardId);
      });

      const callbackCreator = setOnSelectPlayer.mock.calls[0][0];
      const handler = callbackCreator();

      await act(async () => {
        await handler(1);
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error al obtener secretos revelados del jugador:',
        expect.any(Error)
      );
      expect(setCardsModal).toHaveBeenCalledWith([]);
      expect(setIsOpenSelectCards).not.toHaveBeenCalledWith(true);
    });
  });

  describe('handleSelectSecret - flujo completo', () => {
    it('ejecuta handleSelectSecret correctamente', async () => {
      const mockPlayers = [{ id: 1, name: 'Player 1' }];
      const mockSecrets = [{ id: 101, name: 'Secret 1' }];
      const mockAllPlayers = [{ id: 1, name: 'Player 1' }, { id: 2, name: 'Player 2' }];
      
      mockGetPlayersWithRevealedSecrets.mockResolvedValue(mockPlayers);
      mockGetRevealedSecretsByPlayer.mockResolvedValue(mockSecrets);
      mockGetPlayersByGame.mockResolvedValue(mockAllPlayers);

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(playedCardId);
      });

      const playerCallbackCreator = setOnSelectPlayer.mock.calls[0][0];
      const playerHandler = playerCallbackCreator();

      await act(async () => {
        await playerHandler(1);
      });

      const cardCallbackCreator = setOnSelectCardsModal.mock.calls[0][0];
      const cardHandler = cardCallbackCreator();

      await act(async () => {
        await cardHandler(101);
      });

      expect(setIsOpenSelectCards).toHaveBeenCalledWith(false);
      expect(setAreMySecrets).toHaveBeenCalledWith(false);
      expect(mockGetPlayersByGame).toHaveBeenCalledWith(gameId, { room_id: gameId });
      expect(setPlayersModal).toHaveBeenCalledWith(mockAllPlayers);
      expect(setOnSelectPlayer).toHaveBeenCalledTimes(2);
      expect(setIsOpenSelectPlayer).toHaveBeenCalledWith(true);
    });

    it('maneja error al obtener todos los jugadores', async () => {
      const mockPlayers = [{ id: 1, name: 'Player 1' }];
      const mockSecrets = [{ id: 101, name: 'Secret 1' }];
      
      mockGetPlayersWithRevealedSecrets.mockResolvedValue(mockPlayers);
      mockGetRevealedSecretsByPlayer.mockResolvedValue(mockSecrets);
      mockGetPlayersByGame.mockRejectedValue(new Error('Error de red'));

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(playedCardId);
      });

      const playerCallbackCreator = setOnSelectPlayer.mock.calls[0][0];
      const playerHandler = playerCallbackCreator();

      await act(async () => {
        await playerHandler(1);
      });

      const cardCallbackCreator = setOnSelectCardsModal.mock.calls[0][0];
      const cardHandler = cardCallbackCreator();

      await act(async () => {
        await cardHandler(101);
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error al obtener todos los jugadores:',
        expect.any(Error)
      );
      expect(setPlayersModal).toHaveBeenCalledWith([]);
    });
  });

  describe('handleSelectTargetPlayer - flujo completo', () => {
    it('ejecuta handleSelectTargetPlayer correctamente', async () => {
      const mockPlayers = [{ id: 1, name: 'Player 1' }];
      const mockSecrets = [{ id: 101, name: 'Secret 1' }];
      const mockAllPlayers = [{ id: 1, name: 'Player 1' }, { id: 2, name: 'Player 2' }];
      
      mockGetPlayersWithRevealedSecrets.mockResolvedValue(mockPlayers);
      mockGetRevealedSecretsByPlayer.mockResolvedValue(mockSecrets);
      mockGetPlayersByGame.mockResolvedValue(mockAllPlayers);
      mockPlayEventCard.mockResolvedValue({ ok: true });

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(playedCardId);
      });

      const playerCallbackCreator = setOnSelectPlayer.mock.calls[0][0];
      const playerHandler = playerCallbackCreator();

      await act(async () => {
        await playerHandler(1);
      });

      const cardCallbackCreator = setOnSelectCardsModal.mock.calls[0][0];
      const cardHandler = cardCallbackCreator();

      await act(async () => {
        await cardHandler(101);
      });

      const targetPlayerCallbackCreator = setOnSelectPlayer.mock.calls[1][0];
      const targetPlayerHandler = targetPlayerCallbackCreator();

      await act(async () => {
        await targetPlayerHandler(2);
      });

      expect(setIsOpenSelectPlayer).toHaveBeenCalledWith(false);
      expect(mockPlayEventCard).toHaveBeenCalledWith(
        playedCardId,
        {
          game_id: gameId,
          player_id: playerId,
          revealed_secret_card_id: 101,
          target_player_id: 2,
        },
        { room_id: gameId }
      );
      expect(console.log).toHaveBeenCalledWith('And Then There Was One More ejecutada correctamente');
    });

    it('maneja error al ejecutar la carta', async () => {
      const mockPlayers = [{ id: 1, name: 'Player 1' }];
      const mockSecrets = [{ id: 101, name: 'Secret 1' }];
      const mockAllPlayers = [{ id: 1, name: 'Player 1' }, { id: 2, name: 'Player 2' }];
      
      mockGetPlayersWithRevealedSecrets.mockResolvedValue(mockPlayers);
      mockGetRevealedSecretsByPlayer.mockResolvedValue(mockSecrets);
      mockGetPlayersByGame.mockResolvedValue(mockAllPlayers);
      mockPlayEventCard.mockRejectedValue(new Error('Error al jugar carta'));

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(playedCardId);
      });

      const playerCallbackCreator = setOnSelectPlayer.mock.calls[0][0];
      const playerHandler = playerCallbackCreator();

      await act(async () => {
        await playerHandler(1);
      });

      const cardCallbackCreator = setOnSelectCardsModal.mock.calls[0][0];
      const cardHandler = cardCallbackCreator();

      await act(async () => {
        await cardHandler(101);
      });

      const targetPlayerCallbackCreator = setOnSelectPlayer.mock.calls[1][0];
      const targetPlayerHandler = targetPlayerCallbackCreator();

      await act(async () => {
        await targetPlayerHandler(2);
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error al ejecutar And Then There Was One More:',
        expect.any(Error)
      );
    });
  });

  describe('múltiples ejecuciones', () => {
    it('puede llamarse múltiples veces sin error', async () => {
      mockGetPlayersWithRevealedSecrets.mockResolvedValue([{ id: 1, name: 'Player 1' }]);

      const { result } = renderHook(() =>
        useAndThenThereWasOneMore(
          gameId,
          playerId,
          playedCardId,
          setPlayersModal,
          setOnSelectPlayer,
          setIsOpenSelectPlayer,
          setCardsModal,
          setOnSelectCardsModal,
          setIsOpenSelectCards,
          setTitleModal,
          setAreMySecrets
        )
      );

      await act(async () => {
        await result.current.playAndThenThereWasOneMore(100);
        await result.current.playAndThenThereWasOneMore(200);
      });

      expect(mockGetPlayersWithRevealedSecrets).toHaveBeenCalledTimes(2);
      expect(setOnSelectPlayer).toHaveBeenCalledTimes(2);
      expect(setIsOpenSelectPlayer).toHaveBeenCalledTimes(2);
    });
  });
});
