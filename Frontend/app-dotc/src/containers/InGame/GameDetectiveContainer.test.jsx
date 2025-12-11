import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// --- Mocks de Hooks ---
const mockValidateDetectiveSet = vi.fn();
const mockValidateAddToSet = vi.fn();
const mockNewDetectiveSet = vi.fn();
const mockAddToDetectiveSet = vi.fn();
const mockPlayDetectiveSet = vi.fn();
const mockSetShowSecretModal = vi.fn();
const mockValidateOliverAddition = vi.fn();

// ¡¡ARREGLO #1 (A): Importar el hook que estamos mockeando!!
import { useDetectiveGameLogic } from './detectiveGame/useDetectiveGameLogic';

vi.mock('./detectiveGame/useDetectiveGameLogic', () => ({
    useDetectiveGameLogic: vi.fn(() => ({
        validateDetectiveSet: mockValidateDetectiveSet,
        validateAddToSet: mockValidateAddToSet,
        newDetectiveSet: mockNewDetectiveSet,
        addToDetectiveSet: mockAddToDetectiveSet,
        playDetectiveSet: mockPlayDetectiveSet,
        setShowSecretModal: mockSetShowSecretModal,
        showSecretModal: false, // Estado inicial
        secretCards: [],
        areMySecrets: false,
        canBack: false,
        detectiveSetPlayed: null, // Estado inicial
    })),
}));

const mockStartTimer = vi.fn();
vi.mock('./eventGame/useNotSoFast', () => ({
    useNotSoFast: vi.fn(() => ({
        startTimer: mockStartTimer,
    })),
}));

// ¡¡ARREGLO #2 (A): Mockear el validador de Oliver!!
vi.mock('./detectiveGame/detectiveSetValidator', () => ({
    validateOliverAddition: (...args) => mockValidateOliverAddition(...args),
}));

// --- Mocks de Servicios ---
const mockRevealSecret = vi.fn();
const mockGetSecretCardByPlayer = vi.fn();
vi.mock('../../services/secretCardService', () => ({
    createSecretCardService: () => ({
        revealSecret: mockRevealSecret,
        getSecretCardByPlayer: mockGetSecretCardByPlayer,
    }),
}));

const mockTransferPlayerCard = vi.fn();
vi.mock('../../services/playerCardService', () => ({
    createPlayerCardService: () => ({
        transferPlayerCard: mockTransferPlayerCard,
    }),
}));

const mockGetPlayersWithAtLeastOneSet = vi.fn();
const mockGetDetectiveSetByPlayer = vi.fn();
const mockAddDetectiveCardToSet = vi.fn();
const mockUpdateDetectiveSet = vi.fn();
vi.mock('../../services/detectiveSetService', () => ({
    createDetectiveSetService: () => ({
        getPlayersWithAtLeastOneSet: mockGetPlayersWithAtLeastOneSet,
        getDetectiveSetByPlayer: mockGetDetectiveSetByPlayer,
        addDetectiveCardToSet: mockAddDetectiveCardToSet,
        updateDetectiveSet: mockUpdateDetectiveSet,
    }),
}));

// Mock de Notificaciones
const mockShowNotification = vi.fn();
vi.mock('../../components/NotificationContext', () => ({
    useNotification: () => ({
        showNotification: mockShowNotification,
    }),
}));

// --- Mocks de Componentes Hijos ---
vi.mock('./components/SelectCardsModal', () => ({
    SelectCardsModal: ({ title, onSelect, onBack, multiple, goBack }) => (
        <div data-testid="select-cards-modal" data-title={title} data-multiple={multiple}>
            <button data-testid="modal-select-card" onClick={() => onSelect(multiple ? [123, 456] : 123, false)}>Select</button>
            {goBack && <button data-testid="modal-back" onClick={() => onBack(false)}>Back</button>}
        </div>
    ),
}));

vi.mock('./components/SelectPlayerModal', () => ({
    SelectPlayer: ({ isOpen, onSelectPlayer }) =>
        isOpen ? (
            <div data-testid="select-player-modal">
                <button onClick={() => onSelectPlayer(222)}>Select Player</button>
            </div>
        ) : null,
}));

vi.mock('./components/Modal', () => ({
    default: ({ title, children }) => (
        <div data-testid="fullscreen-modal" data-title={title}>
            {children}
        </div>
    ),
}));

vi.mock('./components/SelectSetContent', () => ({
    default: ({ onSetSelected }) => (
        <div data-testid="select-set-content">
            <button onClick={() => onSetSelected(333)}>Select Set</button>
        </div>
    ),
}));

import GameDetectiveContainer from './GameDetectiveContainer';

// --- Datos de Mock ---
const mockDetectiveCards = [
    { id: 101, name: 'detective_holmes' },
    { id: 102, name: 'detective_watson' },
    { id: 103, name: 'detective_oliver' },
];

const mockPlayersData = {
    1: { id: 1, name: 'Player 1' },
    2: { id: 2, name: 'Player 2' },
};

const mockSetPayload = {
    id: 1,
    is_cancellable: true,
    action_secret: 'reveal_your',
    wildcard_effects: null,
    id_owner: 1,
    target_id: 2
};

const mockSets = [{ id: 333, name: 'Set de Player 1' }];

describe('GameDetectiveContainer', () => {

    const baseProps = {
        playerId: 1,
        gameId: '123',
        cards: mockDetectiveCards,
        isOpenSet: false,
        setIsOpenSet: vi.fn(),
        playersData: mockPlayersData,
        detectiveToPlay: null,
        setDetectiveToPlay: vi.fn(),
        wsInstance: {},
        onSetPlayed: vi.fn(),
        onCancelDetective: vi.fn(),
    };

    // Definimos el mock base del hook
    const baseMockHook = {
        validateDetectiveSet: mockValidateDetectiveSet,
        validateAddToSet: mockValidateAddToSet,
        newDetectiveSet: mockNewDetectiveSet,
        addToDetectiveSet: mockAddToDetectiveSet,
        playDetectiveSet: mockPlayDetectiveSet,
        setShowSecretModal: mockSetShowSecretModal,
        showSecretModal: false,
        secretCards: [],
        areMySecrets: false,
        canBack: false,
        detectiveSetPlayed: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Reseteamos mocks de servicios
        mockGetPlayersWithAtLeastOneSet.mockResolvedValue([2]);
        mockGetDetectiveSetByPlayer.mockResolvedValue(mockSets);
        mockValidateDetectiveSet.mockReturnValue(mockSetPayload);
        mockNewDetectiveSet.mockResolvedValue(mockSetPayload);
        mockValidateAddToSet.mockResolvedValue({ ok: true, detectiveSet: mockSetPayload });
        mockAddToDetectiveSet.mockResolvedValue(mockSetPayload);
        mockValidateOliverAddition.mockReturnValue(mockSetPayload);
        mockAddDetectiveCardToSet.mockResolvedValue({});
        mockUpdateDetectiveSet.mockResolvedValue({});

        // Reseteamos el hook principal
        vi.mocked(useDetectiveGameLogic).mockReturnValue(baseMockHook);
    });

    // --- TESTS QUE PASAN ---
    it('no renderiza nada por defecto', () => {
        render(<GameDetectiveContainer {...baseProps} />);
        expect(screen.queryByTestId('select-cards-modal')).toBeNull();
        expect(screen.queryByTestId('select-player-modal')).toBeNull();
    });

    it('abre el modal de "Jugar Set" (detective) cuando isOpenSet es true', () => {
        render(<GameDetectiveContainer {...baseProps} isOpenSet={true} />);
        const modal = screen.getByTestId('select-cards-modal');
        expect(modal).toBeDefined();
        expect(modal.getAttribute('data-title')).toBe('Tus cartas de detective');
        expect(modal.getAttribute('data-multiple')).toBe('true');
    });

    it('cancela el set al presionar "Volver" en el modal de detective', () => {
        render(<GameDetectiveContainer {...baseProps} isOpenSet={true} />);
        fireEvent.click(screen.getByTestId('modal-back'));
        expect(baseProps.setIsOpenSet).toHaveBeenCalledWith(false);
        expect(baseProps.onCancelDetective).toHaveBeenCalled();
    });

    it('flujo de Jugar Set Nuevo (no cancelable)', async () => {
        const nonCancellableSet = { ...mockSetPayload, is_cancellable: false };
        mockValidateDetectiveSet.mockReturnValue(nonCancellableSet);
        mockNewDetectiveSet.mockResolvedValue(nonCancellableSet);

        render(<GameDetectiveContainer {...baseProps} isOpenSet={true} />);

        await act(async () => {
            fireEvent.click(screen.getByTestId('modal-select-card'));
        });

        expect(mockValidateDetectiveSet).toHaveBeenCalled();
        expect(baseProps.setIsOpenSet).toHaveBeenCalledWith(false);
        expect(screen.getByTestId('select-player-modal')).toBeDefined();

        await act(async () => {
            fireEvent.click(screen.getByTestId('select-player-modal').querySelector('button'));
        });

        await waitFor(() => {
            expect(mockNewDetectiveSet).toHaveBeenCalledWith(nonCancellableSet, { room_id: '123' });
        });

        expect(mockStartTimer).not.toHaveBeenCalled();
        expect(mockPlayDetectiveSet).toHaveBeenCalled();
        expect(baseProps.onSetPlayed).toHaveBeenCalled();
    });

    it('flujo de Jugar Set Nuevo (cancelable)', async () => {
        const cancellableSet = { ...mockSetPayload, is_cancellable: true };
        mockValidateDetectiveSet.mockReturnValue(cancellableSet);
        mockNewDetectiveSet.mockResolvedValue(cancellableSet);

        render(<GameDetectiveContainer {...baseProps} isOpenSet={true} />);

        await act(async () => {
            fireEvent.click(screen.getByTestId('modal-select-card'));
        });
        await act(async () => {
            fireEvent.click(screen.getByTestId('select-player-modal').querySelector('button'));
        });

        await waitFor(() => {
            expect(mockNewDetectiveSet).toHaveBeenCalled();
        });

        expect(mockStartTimer).toHaveBeenCalledWith(1);
        expect(mockPlayDetectiveSet).not.toHaveBeenCalled();
        expect(baseProps.onSetPlayed).toHaveBeenCalled();
    });

    it('flujo de Añadir Detective a Set (detectiveToPlay)', async () => {
        const detectiveCard = { id: 101, name: 'detective_holmes' };
        render(<GameDetectiveContainer {...baseProps} detectiveToPlay={detectiveCard} />);

        await waitFor(() => {
            // Arreglo del test anterior: El componente llama a getDetectiveSetByPlayer solo con el ID.
            expect(mockGetDetectiveSetByPlayer).toHaveBeenCalledWith(1);
            expect(screen.getByTestId('fullscreen-modal')).toBeDefined();
            expect(screen.getByTestId('fullscreen-modal').getAttribute('data-title')).toBe("Elige un set para añadir el detective");
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('select-set-content').querySelector('button'));
        });

        expect(mockValidateAddToSet).toHaveBeenCalledWith(detectiveCard, 333);
        await waitFor(() => {
            expect(screen.getByTestId('select-player-modal')).toBeDefined();
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('select-player-modal').querySelector('button'));
        });

        await waitFor(() => {
            expect(mockAddToDetectiveSet).toHaveBeenCalled();
        });

        expect(mockStartTimer).toHaveBeenCalledWith(1);
        expect(baseProps.onSetPlayed).toHaveBeenCalled();
    });

    it('flujo de Añadir Oliver (detectiveToPlay)', async () => {
        const oliverCard = { id: 103, name: 'detective_oliver' };
        render(<GameDetectiveContainer {...baseProps} detectiveToPlay={oliverCard} />);

        await waitFor(() => {
            expect(mockGetPlayersWithAtLeastOneSet).toHaveBeenCalledWith('123');
            expect(screen.getByTestId('select-player-modal')).toBeDefined();
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('select-player-modal').querySelector('button'));
        });

        await waitFor(() => {
            expect(mockGetDetectiveSetByPlayer).toHaveBeenCalledWith(222);
            expect(screen.getByTestId('fullscreen-modal')).toBeDefined();
            expect(screen.getByTestId('fullscreen-modal').getAttribute('data-title')).toBe("Elige un set para añadir a Oliver");
        });

        await act(async () => {
            fireEvent.click(screen.getByTestId('select-set-content').querySelector('button'));
        });

        await waitFor(() => {
            expect(mockValidateOliverAddition).toHaveBeenCalled();
        });

        expect(mockAddDetectiveCardToSet).toHaveBeenCalled();
        expect(mockUpdateDetectiveSet).toHaveBeenCalled();
        expect(mockStartTimer).toHaveBeenCalledWith(1);
        expect(baseProps.onSetPlayed).toHaveBeenCalled();
    });

    it('maneja la selección de secreto (sin Satterthwaite)', async () => {
        vi.mocked(useDetectiveGameLogic).mockReturnValue({
            ...baseMockHook,
            showSecretModal: true,
            secretCards: [{ id: 777, name: 'secret_test' }],
            areMySecrets: true,
            canBack: true,
            detectiveSetPlayed: { wildcard_effects: null }
        });

        render(<GameDetectiveContainer {...baseProps} />);

        const modal = screen.getByTestId('select-cards-modal');
        expect(modal.getAttribute('data-title')).toBe('Debes seleccionar un secreto');

        act(() => {
            fireEvent.click(screen.getByTestId('modal-select-card'));
        });

        await waitFor(() => {
            expect(mockSetShowSecretModal).toHaveBeenCalledWith(false);
            expect(mockRevealSecret).toHaveBeenCalled();
        });
        expect(mockTransferPlayerCard).not.toHaveBeenCalled();
    });

});