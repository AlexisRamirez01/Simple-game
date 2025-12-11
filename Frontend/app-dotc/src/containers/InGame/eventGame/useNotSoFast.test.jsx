import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react'; 
import { useNotSoFast } from './useNotSoFast';


vi.mock('../components/Card', () => ({
    default: ({ image }) => <div data-testid="card-mock" data-image={image} />,
}));

const mockStartTimer = vi.fn();
const mockCancelTimer = vi.fn();
const mockDiscardCard = vi.fn();
const mockPlayDetectiveEffect = vi.fn();
const mockPlayEventCard = vi.fn();
const mockGetPlayerCards = vi.fn();
const mockServicePlayEventCard = vi.fn();

vi.mock('../../../services/gameService', () => ({
    createGameService: () => ({
        startTimer: mockStartTimer,
        cancelTimer: mockCancelTimer,
    }),
}));

vi.mock('../../../services/playerCardService', () => ({
    createPlayerCardService: () => ({
        getPlayerCards: mockGetPlayerCards,
    }),
}));

vi.mock('../../../services/eventService', () => ({
    createEventService: () => ({
        playEventCard: mockServicePlayEventCard,
    }),
}));

vi.mock('../../../services/gamePlayerService', () => ({
    createGamePlayerService: () => ({
        discardCard: mockDiscardCard,
    }),
}));

const mockShowNotification = vi.fn();
vi.mock('../../../components/NotificationContext', () => ({
    useNotification: () => ({ showNotification: mockShowNotification }),
}));

const mockLockGame = vi.fn();
const mockUnlockGame = vi.fn();
vi.mock('../context/GameLogicContext', () => ({
    useGameLock: () => ({ lockGame: mockLockGame, unlockGame: mockUnlockGame }),
}));

describe('useNotSoFast', () => {
    let wsMock;
    const GAME_ID = 1;
    const PLAYER_ID = 2;
    const EVENT_CARD = { id: 99, image_url: "imagen_evento", name: "Any_Event_Card" };
    
    let consoleErrorSpy;

    beforeEach(() => {
        wsMock = { on: vi.fn(), off: vi.fn() };
        vi.clearAllMocks();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        mockStartTimer.mockResolvedValue({});
        mockCancelTimer.mockResolvedValue({});
        mockGetPlayerCards.mockResolvedValue([]);
        mockServicePlayEventCard.mockResolvedValue({});
        mockDiscardCard.mockResolvedValue({});
    });
    
    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    const renderHookWithDefaults = (propsOverrides = {}) => {
        const defaultProps = {
            gameId: GAME_ID,
            playerId: PLAYER_ID,
            playedCardId: 3,
            setCardsModal: vi.fn(),
            setOnSelectCardsModal: vi.fn(),
            setIsOpenSelectCards: vi.fn(),
            setTitleModal: vi.fn(),
            playEventCard: mockPlayEventCard,
            eventCard: EVENT_CARD,
            isDetectiveEffect: false,
            playDetectiveEffect: mockPlayDetectiveEffect,
            idDetectiveSet: 'ds1',
            targetDetectiveSet: 't1',
            wsInstance: wsMock,
        };
        const props = { ...defaultProps, ...propsOverrides };
        
        return renderHook(() =>
            useNotSoFast(
                props.gameId,
                props.playerId,
                props.playedCardId,
                props.setCardsModal,
                props.setOnSelectCardsModal,
                props.setIsOpenSelectCards,
                props.setTitleModal,
                props.playEventCard,
                props.eventCard,
                props.isDetectiveEffect,
                props.playDetectiveEffect,
                props.idDetectiveSet,
                props.targetDetectiveSet,
                props.wsInstance
            )
        );
    };
    
    const fireWsEvent = (eventName, data) => {
        const callback = wsMock.on.mock.calls.find(c => c[0] === eventName)?.[1];
        if (callback) {
            act(() => callback(data));
        }
    };

    it('inicializa y hace cleanup al desmontar', () => {
        const { unmount } = renderHookWithDefaults();
        expect(wsMock.on).toHaveBeenCalledTimes(4);
        unmount();
        expect(wsMock.off).toHaveBeenCalledWith('EVENT_STARTED');
    });
    
    it('actualiza referencias de DetectiveSet al cambiar props', () => {
        const { rerender } = renderHookWithDefaults({ 
            idDetectiveSet: 'ds_old', 
            targetDetectiveSet: 't_old' 
        });
        
        act(() => {
            rerender({ 
                idDetectiveSet: 'ds_new', 
                targetDetectiveSet: 't_new' 
            });
        });
    });
    
    it('actualiza eventCardRef al cambiar eventCard', () => {
        const { rerender } = renderHookWithDefaults({ eventCard: { id: 1 } });
        
        act(() => {
            rerender({ eventCard: { id: 2 } });
        });
    });

    it('startTimer (Normal) llama startTimer de gameService', async () => {
        const { result } = renderHookWithDefaults();
        await act(async () => result.current.startTimer(PLAYER_ID, 'c1'));
        expect(mockStartTimer).toHaveBeenCalledWith(GAME_ID, PLAYER_ID, 'c1', { room_id: GAME_ID });
    });

    it('startTimer (Detective) llama startTimer con cardId=null', async () => {
        const { result } = renderHookWithDefaults({ isDetectiveEffect: true });
        await act(async () => result.current.startTimer(PLAYER_ID));
        expect(mockStartTimer).toHaveBeenCalledWith(GAME_ID, PLAYER_ID, null, { room_id: GAME_ID });
    });

    it('startTimer maneja error', async () => {
        mockStartTimer.mockRejectedValue(new Error('Timer fail'));
        const { result } = renderHookWithDefaults();
        await act(async () => result.current.startTimer(PLAYER_ID));
        expect(console.error).toHaveBeenCalled();
    });

    it('cancelTimer llama cancelTimer y re-inicia timer', async () => {
        const mockSetIsOpenSelectCards = vi.fn();
        const { result } = renderHookWithDefaults({ setIsOpenSelectCards: mockSetIsOpenSelectCards });
        
        await act(async () => result.current.cancelTimer(PLAYER_ID, 'cNSF'));

        expect(mockCancelTimer).toHaveBeenCalledWith(GAME_ID, PLAYER_ID, { room_id: GAME_ID });
        expect(mockSetIsOpenSelectCards).toHaveBeenCalledWith(false);
        expect(mockStartTimer).toHaveBeenCalledWith(GAME_ID, PLAYER_ID, 'cNSF', { room_id: GAME_ID });
    });

    it('cancelTimer maneja error', async () => {
        mockCancelTimer.mockRejectedValue(new Error('Cancel fail'));
        const { result } = renderHookWithDefaults();
        await act(async () => result.current.cancelTimer(PLAYER_ID));
        expect(console.error).toHaveBeenCalled();
    });

    it('getPlayerNSFCards devuelve cartas NotSoFast y maneja error', async () => {
        const setCardsModal = vi.fn();
        const { result } = renderHookWithDefaults({ setCardsModal });

        mockGetPlayerCards.mockResolvedValueOnce([{ name: 'Instant_notsofast' }]);
        let cards = await act(async () => result.current.getPlayerNSFCards());
        expect(cards).toEqual([{ name: 'Instant_notsofast' }]);

        mockGetPlayerCards.mockRejectedValueOnce(new Error('Get cards fail'));
        await act(async () => result.current.getPlayerNSFCards());
        expect(setCardsModal).toHaveBeenCalledWith([]);
        expect(console.error).toHaveBeenCalled();
    });

    it('onTimerStart setea modal y callback', async () => {
        const setOnSelectCardsModal = vi.fn();
        const setIsOpenSelectCards = vi.fn();
        
        mockGetPlayerCards.mockResolvedValue([{ name: 'Instant_notsofast' }]);
        const { result } = renderHookWithDefaults({ setOnSelectCardsModal, setIsOpenSelectCards });

        await act(async () => result.current.onTimerStart());

        expect(setOnSelectCardsModal).toHaveBeenCalledWith(expect.any(Function));
        expect(setIsOpenSelectCards).toHaveBeenCalledWith(true);
    });

    it('handleSelectDraft juega la carta NSF y maneja error', async () => {
        const { result } = renderHookWithDefaults();
        const closeMock = vi.fn();

        await act(async () => result.current.handleSelectDraft('nsf1', closeMock));
        expect(mockServicePlayEventCard).toHaveBeenCalled();
        expect(mockCancelTimer).toHaveBeenCalled();

        mockServicePlayEventCard.mockRejectedValueOnce(new Error('NSF play fail'));
        await act(async () => result.current.handleSelectDraft('nsf2', closeMock));
        expect(console.error).toHaveBeenCalled();
    });

    it('EVENT_STARTED (Oponente) llama onTimerStart (efectos) y notifica', async () => {
        const mockSetIsOpenSelectCards = vi.fn();
        const mockSetCardsModal = vi.fn();
        mockGetPlayerCards.mockResolvedValue([{ name: 'Instant_notsofast' }]); 
        
        const { result } = renderHookWithDefaults({ 
            setIsOpenSelectCards: mockSetIsOpenSelectCards,
            setCardsModal: mockSetCardsModal
        });
        
        await act(async () => {
            fireWsEvent('EVENT_STARTED', { 
                event_by_player: 999,
                player_name: "Oponente",
                card: { image_url: "url_oponente" }
            });
        });

        expect(mockSetCardsModal).toHaveBeenCalled();
        expect(mockSetIsOpenSelectCards).toHaveBeenCalledWith(true); 
        expect(mockLockGame).toHaveBeenCalledWith("Etapa de posible cancelación.");
        expect(mockShowNotification).toHaveBeenCalled();
    });
    
    it('EVENT_STARTED (Propio) bloquea juego y notifica (sin llamar onTimerStart)', async () => {
        const { result } = renderHookWithDefaults();

        await act(async () => {
            fireWsEvent('EVENT_STARTED', { 
                event_by_player: PLAYER_ID,
                player_name: "Jugador Actual",
                card: { image_url: "url_propia" }
            });
        });

        expect(mockLockGame).toHaveBeenCalled();
        expect(mockShowNotification).toHaveBeenCalled();
    });

    it('COUNTDOWN_END (Detective Active) llama playDetectiveEffect', async () => {
        const { result } = renderHookWithDefaults({ 
            isDetectiveEffect: true, 
            idDetectiveSet: 'ds_test', 
            targetDetectiveSet: 't_test',
            playDetectiveEffect: mockPlayDetectiveEffect
        });

        await act(async () => result.current.startTimer(PLAYER_ID));
        fireWsEvent('COUNTDOWN_END', { final_state: 'active' });

        expect(mockPlayDetectiveEffect).toHaveBeenCalledWith('ds_test', 't_test');
    });

    it('COUNTDOWN_END (Detective Cancelled) notifica cancelación de efecto', async () => {
        const { result } = renderHookWithDefaults({ 
            isDetectiveEffect: true, 
            playDetectiveEffect: mockPlayDetectiveEffect 
        });

        await act(async () => result.current.startTimer(PLAYER_ID));
        fireWsEvent('COUNTDOWN_END', { final_state: 'cancelled' });

        expect(mockPlayDetectiveEffect).not.toHaveBeenCalled();
        expect(mockShowNotification).toHaveBeenCalledWith(
            <p>El efecto del set jugado ha sido cancelado</p>, "Información", 2000, "info"
        );
    });
    
    it('COUNTDOWN_END (Normal Cancelled) descarta carta', async () => {
        const { result } = renderHookWithDefaults({ 
            eventCard: { id: 100 } 
        });

        await act(async () => result.current.startTimer(PLAYER_ID));
        fireWsEvent('COUNTDOWN_END', { final_state: 'cancelled' });
        
        expect(mockDiscardCard).toHaveBeenCalledWith(GAME_ID, PLAYER_ID, 100, { room_id: GAME_ID });
    });

    it('COUNTDOWN_END (Otro jugador) solo cierra modal y notifica', async () => {
        const setIsOpenSelectCards = vi.fn();
        renderHookWithDefaults({ setIsOpenSelectCards });

        fireWsEvent('COUNTDOWN_END', { final_state: 'active' });

        expect(setIsOpenSelectCards).toHaveBeenCalledWith(false);
        expect(mockUnlockGame).toHaveBeenCalled();
    });

    it('COUNTDOWN_TICK actualiza título según hasNotSoFast true', async () => {
        const setTitleModal = vi.fn();
        const { result, rerender } = renderHookWithDefaults({ setTitleModal });
        let tickCallback;

        mockGetPlayerCards.mockResolvedValue([{ name: 'Instant_notsofast' }]);
        
        await act(async () => result.current.onTimerStart()); 

        act(() => {
            rerender({}); 
        });

        const tickCalls = wsMock.on.mock.calls.filter(c => c[0] === 'COUNTDOWN_TICK');
        if (tickCalls.length > 0) {
            tickCallback = tickCalls[tickCalls.length - 1][1];
        } else {
            throw new Error("No se encontró ningún listener para COUNTDOWN_TICK después de rerender.");
        }
        
        act(() => {
            tickCallback({ time: 5 });
        });

        expect(setTitleModal).toHaveBeenCalledWith("¿Quieres jugar una Not So Fast?  Tiempo: 5");
    });

    it('COUNTDOWN_TICK actualiza título según hasNotSoFast false', async () => {
        const setTitleModal = vi.fn();
        const { result } = renderHookWithDefaults({ setTitleModal });
        
        mockGetPlayerCards.mockResolvedValue([]);
        await act(async () => result.current.getPlayerNSFCards());

        fireWsEvent('COUNTDOWN_TICK', { time: 3 });

        expect(setTitleModal).toHaveBeenCalledWith("No tienes Not So Fast para jugar  Tiempo: 3");
    }); 

    it('EVENT_CANCELLED muestra notificación correcta', async () => {
        const setIsOpenSelectCards = vi.fn();
        const { result } = renderHookWithDefaults({ setIsOpenSelectCards });
        const eventCancelledHandler = wsMock.on.mock.calls.find(
            call => call[0] === 'EVENT_CANCELLED'
        )[1]; 
        
        const playerName = "Canceller";
        await act(async () => {
            eventCancelledHandler({ player_name: playerName }); 
        }); 

        expect(setIsOpenSelectCards).toHaveBeenCalledWith(false);
        
        expect(mockShowNotification).toHaveBeenCalledWith(
            <p>El jugador <b>{playerName}</b> ha jugado un Not So Fast !</p>, 
            "Información",
            2000,
            "info",
        );
    });

    it('COUNTDOWN_END (Normal Active) llama playEventCard (L. 151)', async () => {
        const playerWhoPlayed = 2;
        const eventCardData = { id: 999, name: "Test_Card" };
        const { result } = renderHookWithDefaults({ 
            playerId: playerWhoPlayed, 
            eventCard: eventCardData, 
            playEventCard: mockPlayEventCard
        });
        await act(async () => result.current.startTimer(playerWhoPlayed));
        const countdownEndCallback = wsMock.on.mock.calls.find(c => c[0] === 'COUNTDOWN_END')[1];
        act(() => {
            countdownEndCallback({ 
                final_state: 'active' 
            });
        });
        expect(mockPlayEventCard).toHaveBeenCalledWith(eventCardData);
        expect(mockShowNotification).toHaveBeenCalledWith(
            expect.anything(),
            "Información",
            2000,
            "info"
        );
    });
});