import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useCardTrade } from './useCardTrade';

// --- 1. Mocks de los Servicios ---
const mockPlayEventCard = vi.fn();
const mockGetPlayersByGame = vi.fn();
const mockTransferPlayerCard = vi.fn();
const mockWsOn = vi.fn();
const mockWsOff = vi.fn(); // Aunque no se usa en el hook actual, es bueno tenerlo

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

vi.mock('../../../services/playerCardService', () => ({
    createPlayerCardService: () => ({
        transferPlayerCard: mockTransferPlayerCard,
    }),
}));

// --- 2. Descripción del Test ---
describe('useCardTrade', () => {
    // --- 3. Setup de Props y Mocks ---
    const gameId = 1;
    const playerId = 10;
    const playedCardId = 100;

    // Mock de setters (props)
    const setPlayersModal = vi.fn();
    const setOnSelectPlayer = vi.fn();
    const setIsOpenSelectPlayer = vi.fn();
    const setCardsModal = vi.fn();
    const setIsOpenSelectCards = vi.fn();
    const setOnSelectCardsModal = vi.fn();
    const setTitleModal = vi.fn();

    // Mock de WS
    const mockWsInstance = {
        on: mockWsOn,
        off: mockWsOff, // El hook no llama a 'off' en el cleanup, pero lo mockeamos
    };

    // Mock de datos
    const mockPlayers = [
        { id: 10, name: 'Player 1 (yo)' },
        { id: 20, name: 'Player 2' },
        { id: 30, name: 'Player 3' },
    ];

    const mockCardsInHand = [
        { id: 123, name: 'detective_oliver' },
        { id: 456, name: 'event_cardtrade' }, // La carta que se jugó
        { id: 789, name: 'secret_key' },
        { id: 987, name: 'otra_carta' },
    ];

    // Limpiar mocks antes de cada test
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock de consolas por si hay logs/warnings
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    // --- 4. Tests de la Fase 1 (Iniciador) ---

    it('Fase 1: debería obtener jugadores, filtrar al actual y abrir el modal de jugadores', async () => {
        mockGetPlayersByGame.mockResolvedValue(mockPlayers);

        const { result } = renderHook(() =>
            useCardTrade(
                gameId, playerId, playedCardId, setPlayersModal, setOnSelectPlayer,
                setIsOpenSelectPlayer, mockWsInstance, mockCardsInHand, setCardsModal,
                setIsOpenSelectCards, setOnSelectCardsModal, setTitleModal
            )
        );

        await act(async () => {
            result.current.playCardTrade(playedCardId);
        });

        // 1. Verifica que se llamó al servicio
        expect(mockGetPlayersByGame).toHaveBeenCalledWith(gameId, { room_id: gameId });

        // 2. Verifica que se filtró al jugador actual (playerId = 10)
        const expectedFilteredPlayers = [
            { id: 20, name: 'Player 2' },
            { id: 30, name: 'Player 3' },
        ];
        expect(setPlayersModal).toHaveBeenCalledWith(expectedFilteredPlayers);

        // 3. Verifica que se abre el modal
        expect(setIsOpenSelectPlayer).toHaveBeenCalledWith(true);
        expect(setOnSelectPlayer).toHaveBeenCalled();
    });

    it('Fase 1: debería manejar un error al obtener jugadores', async () => {
        mockGetPlayersByGame.mockRejectedValue(new Error('Test Error'));

        const { result } = renderHook(() =>
            useCardTrade(
                gameId, playerId, playedCardId, setPlayersModal, setOnSelectPlayer,
                setIsOpenSelectPlayer, mockWsInstance, mockCardsInHand, setCardsModal,
                setIsOpenSelectCards, setOnSelectCardsModal, setTitleModal
            )
        );

        await act(async () => {
            result.current.playCardTrade(playedCardId);
        });

        // Verifica que se intentó obtener jugadores
        expect(mockGetPlayersByGame).toHaveBeenCalled();
        // Verifica que se setea un array vacío en caso de error
        expect(setPlayersModal).toHaveBeenCalledWith([]);
        // Verifica que se logueó el error
        expect(console.error).toHaveBeenCalledWith(
            'Error al obtener los jugadores:',
            expect.any(Error)
        );
    });

    it('Fase 1: handleSelectPlayer debería llamar a playEventCard con el payload correcto', async () => {
        mockGetPlayersByGame.mockResolvedValue(mockPlayers); // Para el setup
        mockPlayEventCard.mockResolvedValue({ success: true });

        const { result } = renderHook(() =>
            useCardTrade(
                gameId, playerId, playedCardId, setPlayersModal, setOnSelectPlayer,
                setIsOpenSelectPlayer, mockWsInstance, mockCardsInHand, setCardsModal,
                setIsOpenSelectCards, setOnSelectCardsModal, setTitleModal
            )
        );

        // 1. Jugar la carta para configurar el callback
        await act(async () => {
            result.current.playCardTrade(playedCardId);
        });

        // 2. Obtener el callback (es una función que retorna otra función)
        const outerCallback = setOnSelectPlayer.mock.calls[0][0];
        const innerCallback = outerCallback(); // <- Esta es la fn (targetPlayerId) => ...
        const targetPlayerId = 20;

        // 3. Ejecutar el callback (simular selección de jugador)
        await act(async () => {
            await innerCallback(targetPlayerId);
        });

        // 4. Verificar que se cierra el modal
        expect(setIsOpenSelectPlayer).toHaveBeenCalledWith(false);

        // 5. Verificar que se llamó al evento con el payload correcto
        const expectedPayload = {
            game_id: gameId,
            player_id: playerId,
            target_player_id: targetPlayerId,
        };
        expect(mockPlayEventCard).toHaveBeenCalledWith(
            playedCardId,
            expectedPayload,
            { room_id: gameId }
        );
    });

    // --- 5. Tests de la Fase 2 (WebSocket) ---

    it('Fase 2: debería registrar el listener de WS y manejar el evento "card_trade_request"', async () => {
        // 1. Renderizar el hook
        renderHook(() =>
            useCardTrade(
                gameId, playerId, playedCardId, setPlayersModal, setOnSelectPlayer,
                setIsOpenSelectPlayer, mockWsInstance, mockCardsInHand, setCardsModal,
                setIsOpenSelectCards, setOnSelectCardsModal, setTitleModal
            )
        );

        // 2. Verificar que el listener se registró
        expect(mockWsOn).toHaveBeenCalledWith("card_trade_request", expect.any(Function));

        // 3. Obtener el listener y simular el evento
        const wsListener = mockWsOn.mock.calls[0][1];
        const mockWsData = {
            target_id: playerId, // Yo soy el target
            other_player_id: 30,
            played_card_id: 456, // ID de la carta que se jugó
        };

        await act(async () => {
            wsListener(mockWsData);
        });

        // 4. Verificar que el modal de cartas se abre
        expect(setIsOpenSelectCards).toHaveBeenCalledWith(true);
        expect(setTitleModal).toHaveBeenCalledWith("Intercambio de Cartas: Elige una carta para dar");

        // 5. Verificar que se filtraron las cartas correctamente
        // (Sin secretos (id: 789) y sin la carta jugada (id: 456))
        const expectedFilteredCards = [
            { id: 123, name: 'detective_oliver' },
            { id: 987, name: 'otra_carta' },
        ];
        expect(setCardsModal).toHaveBeenCalledWith(expectedFilteredCards);
        expect(setOnSelectCardsModal).toHaveBeenCalled();
    });

    it('Fase 2: no debería hacer nada si el target_id del WS no es mi playerId', () => {
        renderHook(() =>
            useCardTrade(
                gameId, playerId, playedCardId, setPlayersModal, setOnSelectPlayer,
                setIsOpenSelectPlayer, mockWsInstance, mockCardsInHand, setCardsModal,
                setIsOpenSelectCards, setOnSelectCardsModal, setTitleModal
            )
        );

        const wsListener = mockWsOn.mock.calls[0][1];
        const mockWsData = {
            target_id: 999, // NO soy yo
            other_player_id: 30,
            played_card_id: 456,
        };

        act(() => {
            wsListener(mockWsData);
        });

        // No se debe abrir ningún modal
        expect(setIsOpenSelectCards).not.toHaveBeenCalled();
        expect(setTitleModal).not.toHaveBeenCalled();
        expect(setCardsModal).not.toHaveBeenCalled();
    });

    it('Fase 2: debería llamar a transferPlayerCard al seleccionar una carta del modal WS', async () => {
        mockTransferPlayerCard.mockResolvedValue({ success: true });

        renderHook(() =>
            useCardTrade(
                gameId, playerId, playedCardId, setPlayersModal, setOnSelectPlayer,
                setIsOpenSelectPlayer, mockWsInstance, mockCardsInHand, setCardsModal,
                setIsOpenSelectCards, setOnSelectCardsModal, setTitleModal
            )
        );

        // 1. Simular el evento WS
        const wsListener = mockWsOn.mock.calls[0][1];
        const mockWsData = {
            target_id: playerId,
            other_player_id: 30,
            played_card_id: 456,
        };
        await act(async () => {
            wsListener(mockWsData);
        });

        // 2. Obtener el callback del modal de cartas (es una función que retorna otra función)
        const outerCallback = setOnSelectCardsModal.mock.calls[0][0];
        const innerCallback = outerCallback(); // (cardId, close) => ...
        const cardToGiveId = 123; // El 'detective_oliver'

        // 3. Ejecutar el callback (simular selección de carta)
        await act(async () => {
            await innerCallback(cardToGiveId, false); // close = false
        });

        // 4. Verificar que se cerró el modal
        expect(setIsOpenSelectCards).toHaveBeenCalledWith(false);

        // 5. Verificar que se llamó a la transferencia con los datos correctos
        expect(mockTransferPlayerCard).toHaveBeenCalledWith(
            playerId,         // oldPlayerId (yo)
            cardToGiveId,     // cardId (la que elegí)
            mockWsData.other_player_id, // newPlayerId (el otro)
            { room_id: gameId }
        );
    });
});