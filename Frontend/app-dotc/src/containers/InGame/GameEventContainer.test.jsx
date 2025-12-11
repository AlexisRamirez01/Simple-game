import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

let mockSetIsOpenSelectPlayer, mockSetOnSelectPlayer;
let mockSetIsOpenDirectionModal, mockSetOnSelectDirection;
let mockSetIsOpenSelectCards, mockSetOnSelectCardsModal;
let mockSetIsOpenMultipleCards, mockSetOnSelectMultipleCards;
let mockSetShowDetectivesSet, mockSetOnSelectSetModal;
let mockSetIsOpenNSFCards, mockSetOnSelectNSFCardsModal;

const mockPlayLookIntoTheAshes = vi.fn((cardId) => {
	act(() => {
		mockSetIsOpenSelectCards(true);
		mockSetOnSelectCardsModal(() => (cardId, close) => mockSetIsOpenSelectCards(false));
	});
});
vi.mock('./eventGame/useLookIntoTheAshes', () => ({
	useLookIntoTheAshes: vi.fn((gameId, pId, cId, setCards, setOnSelect, setIsOpen, setTitle) => {
		mockSetIsOpenSelectCards = setIsOpen;
		mockSetOnSelectCardsModal = setOnSelect;
		return { playLookIntoTheAshes: mockPlayLookIntoTheAshes };
	}),
}));

const mockStartTimer = vi.fn();
vi.mock('./eventGame/useNotSoFast', () => ({
	useNotSoFast: vi.fn((gId, pId, cId, setCards, setOnSelect, setIsOpen, setTitle, playEventFn) => {
		mockSetIsOpenNSFCards = setIsOpen;
		mockSetOnSelectNSFCardsModal = setOnSelect;
		const capturedPlayEventCard = playEventFn;
		return {
			startTimer: mockStartTimer,
			__callPlayEventCard: (card) => capturedPlayEventCard(card)
		};
	}),
}));

const mockPlayEarlyTrain = vi.fn();
vi.mock('./eventGame/useEarlyTrainToPaddington', () => ({
	useEarlyTrainToPaddington: vi.fn(() => ({ playEarlyTrainToPaddington: mockPlayEarlyTrain })),
}));

const mockPlayDelayEscape = vi.fn((cardId) => {
	act(() => {
		mockSetIsOpenMultipleCards(true);
		mockSetOnSelectMultipleCards(() => (cards, close) => mockSetIsOpenMultipleCards(false));
	});
});
vi.mock('./eventGame/useDelayTheMurderersEscape', () => ({
	useDelayTheMurderersEscape: vi.fn((gId, pId, setIsOpen, setTitle, setCards, setOnSelect) => {
		mockSetIsOpenMultipleCards = setIsOpen;
		mockSetOnSelectMultipleCards = setOnSelect;
		return { playDelayTheMurderersEscape: mockPlayDelayEscape };
	}),
}));

const mockPlayCardsOff = vi.fn((cardId) => {
	act(() => {
		mockSetIsOpenSelectPlayer(true);
		mockSetOnSelectPlayer(() => (playerId) => mockSetIsOpenSelectPlayer(false));
	});
});
vi.mock('./eventGame/useCardsOffTheTable', () => ({
	useCardsOffTheTable: vi.fn((gId, pId, cId, setPlayers, setOnSelect, setIsOpen) => {
		mockSetIsOpenSelectPlayer = setIsOpen;
		mockSetOnSelectPlayer = setOnSelect;
		return { playCardsOffTheTable: mockPlayCardsOff };
	}),
}));

const mockPlayCardTrade = vi.fn((cardId) => {
	act(() => {
		mockSetIsOpenSelectPlayer(true);
		mockSetOnSelectPlayer(() => (playerId) => mockSetIsOpenSelectPlayer(false));
	});
});
vi.mock('./eventGame/useCardTrade', () => ({
	useCardTrade: vi.fn((gId, pId, cId, setPlayers, setOnSelect, setIsOpen) => {
		mockSetIsOpenSelectPlayer = setIsOpen;
		mockSetOnSelectPlayer = setOnSelect;
		return { playCardTrade: mockPlayCardTrade };
	}),
}));

const mockPlayAnotherVictim = vi.fn((cardId) => {
	act(() => {
		mockSetIsOpenSelectPlayer(true);
		mockSetOnSelectPlayer(() => (playerId) => {
			mockSetIsOpenSelectPlayer(false);
			mockSetShowDetectivesSet(true);
			mockSetOnSelectSetModal(() => (setId) => mockSetShowDetectivesSet(false));
		});
	});
});
vi.mock('./eventGame/useAnotherVictim', () => ({
	useAnotherVictim: vi.fn((gId, pId, setIsOpen, setOnSelect, setPlayers, setAnotherSet, setOnSetModal, setShowSet) => {
		mockSetIsOpenSelectPlayer = setIsOpen;
		mockSetOnSelectPlayer = setOnSelect;
		mockSetShowDetectivesSet = setShowSet;
		mockSetOnSelectSetModal = setOnSetModal;
		return { playAnotherVictim: mockPlayAnotherVictim };
	}),
}));

const mockStartingVote = vi.fn();
vi.mock('./eventGame/usePointYourSuspicions', () => ({
	usePointYourSuspicions: vi.fn(() => ({ startingVote: mockStartingVote })),
}));

const mockPlayOneMore = vi.fn();
vi.mock('./eventGame/useAndThenThereWasOneMore', () => ({
	useAndThenThereWasOneMore: vi.fn(() => ({ playAndThenThereWasOneMore: mockPlayOneMore })),
}));

const mockPlayDeadCardFolly = vi.fn((cardId) => {
	act(() => {
		mockSetIsOpenDirectionModal(true);
		mockSetOnSelectDirection(() => (direction) => mockSetIsOpenDirectionModal(false));
	});
});
vi.mock('./eventGame/useDeadCardFolly', () => ({
	useDeadCardFolly: vi.fn((gId, pId, setIsOpen, setOnSelect) => {
		mockSetIsOpenDirectionModal = setIsOpen;
		mockSetOnSelectDirection = setOnSelect;
		return { playDeadCardFolly: mockPlayDeadCardFolly };
	}),
}));

const mockIsCancellableCard = vi.fn();
vi.mock('../../services/eventService', () => ({
	createEventService: vi.fn(() => ({
		isCancellabeCard: mockIsCancellableCard,
	})),
}));

vi.mock('./components/SelectCardsModal', () => ({
	SelectCardsModal: ({ title, multiple, delay, onSelect }) => (
		<div
			data-testid="select-cards-modal"
			data-title={title}
			data-multiple={!!multiple}
			data-delay={!!delay}
		>
			<button data-testid="modal-select-card" onClick={() => onSelect && onSelect(123, false)}>Select</button>
		</div>
	),
}));

vi.mock('./components/SelectPlayerModal', () => ({
	SelectPlayer: ({ isOpen, onSelectPlayer }) =>
	(isOpen ? (
		<div data-testid="select-player-modal">
			<button data-testid="modal-select-player" onClick={() => onSelectPlayer && onSelectPlayer(222)}>Select</button>
		</div>
	) : null),
}));

vi.mock('./components/Modal', () => ({
	default: ({ title, children, onClose }) => (
		<div data-testid="fullscreen-modal" data-title={title}>
			{children}
			<button data-testid="modal-close" onClick={onClose}>Close</button>
		</div>
	),
}));

vi.mock('./components/SelectSetContent', () => ({
	default: ({ onSetSelected }) => (
		<div data-testid="select-set-content">
			<button data-testid="modal-select-set" onClick={() => onSetSelected && onSetSelected(333)}>Select Set</button>
		</div>
	),
}));


import GameEventContainer from './GameEventContainer';

describe('GameEventContainer', () => {

	const baseProps = {
		playerId: 1,
		gameId: '123',
		wsInstance: {},
		eventCardToPlay: null,
		setEventCardToPlay: vi.fn(),
		players: [],
		cards: [],
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockIsCancellableCard.mockResolvedValue({ is_cancellable: false });
	});

	it('no renderiza ningún modal por defecto', () => {
		render(<GameEventContainer {...baseProps} />);
		expect(screen.queryByTestId('select-cards-modal')).toBeNull();
		expect(screen.queryByTestId('select-player-modal')).toBeNull();
		expect(screen.queryByTestId('fullscreen-modal')).toBeNull();
	});

	it('juega una carta NO cancelable inmediatamente (llama a playEventCard)', async () => {
		mockIsCancellableCard.mockResolvedValue({ is_cancellable: false });
		const eventCard = { id: 100, name: 'event_lookashes' };
		const { rerender } = render(<GameEventContainer {...baseProps} />);
		rerender(<GameEventContainer {...baseProps} eventCardToPlay={eventCard} />);
		await waitFor(() => {
			expect(mockIsCancellableCard).toHaveBeenCalledWith(100);
		});
		expect(mockPlayLookIntoTheAshes).toHaveBeenCalledWith(100);
		expect(mockStartTimer).not.toHaveBeenCalled();
		expect(baseProps.setEventCardToPlay).toHaveBeenCalledWith(null);
	});

	it('inicia el timer para una carta SÍ cancelable (llama a startTimer)', async () => {
		mockIsCancellableCard.mockResolvedValue({ is_cancellable: true });
		const eventCard = { id: 101, name: 'event_cardtrade' };
		const { rerender } = render(<GameEventContainer {...baseProps} />);
		rerender(<GameEventContainer {...baseProps} eventCardToPlay={eventCard} />);
		await waitFor(() => {
			expect(mockIsCancellableCard).toHaveBeenCalledWith(101);
		});
		expect(mockStartTimer).toHaveBeenCalledWith(baseProps.playerId, 101);
		expect(mockPlayCardTrade).not.toHaveBeenCalled();
		expect(baseProps.setEventCardToPlay).toHaveBeenCalledWith(null);
	});

	it('llama al hook correcto para CADA carta en el switch', async () => {
		mockIsCancellableCard.mockResolvedValue({ is_cancellable: false });
		const { rerender } = render(<GameEventContainer {...baseProps} />);

		const cardsToTest = [
			{ id: 1, name: 'event_lookashes', hook: mockPlayLookIntoTheAshes },
			{ id: 2, name: 'event_pointsuspicions', hook: mockStartingVote },
			{ id: 3, name: 'event_anothervictim', hook: mockPlayAnotherVictim },
			{ id: 4, name: 'event_earlytrain', hook: mockPlayEarlyTrain },
			{ id: 5, name: 'event_cardsonthetable', hook: mockPlayCardsOff },
			{ id: 6, name: 'event_cardtrade', hook: mockPlayCardTrade },
			{ id: 7, name: 'event_delayescape', hook: mockPlayDelayEscape },
			{ id: 8, name: 'event_onemore', hook: mockPlayOneMore },
			{ id: 9, name: 'event_deadcardfolly', hook: mockPlayDeadCardFolly },
		];

		for (const { id, name, hook } of cardsToTest) {
			rerender(<GameEventContainer {...baseProps} eventCardToPlay={{ id, name }} />);
			await waitFor(() => expect(hook).toHaveBeenCalledWith(id));
		}
	});

	it('cubre el flujo del modal de Dead Card Folly (Izquierda y Derecha)', async () => {
		mockIsCancellableCard.mockResolvedValue({ is_cancellable: false });
		const eventCard = { id: 9, name: 'event_deadcardfolly' };
		const { rerender } = render(<GameEventContainer {...baseProps} />);

		rerender(<GameEventContainer {...baseProps} eventCardToPlay={eventCard} />);

		await waitFor(() => {
			expect(mockPlayDeadCardFolly).toHaveBeenCalled();
			expect(screen.getByTestId('fullscreen-modal')).toBeDefined();
		});

		act(() => {
			fireEvent.click(screen.getByText('Izquierda'));
		});
		await waitFor(() => {
			expect(screen.queryByTestId('fullscreen-modal')).toBeNull();
		});

		rerender(<GameEventContainer {...baseProps} eventCardToPlay={null} />);

		rerender(<GameEventContainer {...baseProps} eventCardToPlay={eventCard} />);
		await waitFor(() => expect(screen.getByTestId('fullscreen-modal')).toBeDefined());

		act(() => {
			fireEvent.click(screen.getByText('Derecha'));
		});
		await waitFor(() => {
			expect(screen.queryByTestId('fullscreen-modal')).toBeNull();
		});
	});

	it('cubre el flujo del modal de SelectPlayer (CardTrade)', async () => {
		mockIsCancellableCard.mockResolvedValue({ is_cancellable: false });
		const eventCard = { id: 6, name: 'event_cardtrade' };
		const { rerender } = render(<GameEventContainer {...baseProps} />);

		rerender(<GameEventContainer {...baseProps} eventCardToPlay={eventCard} />);

		await waitFor(() => {
			expect(mockPlayCardTrade).toHaveBeenCalled();
			expect(screen.getByTestId('select-player-modal')).toBeDefined();
		});

		act(() => {
			fireEvent.click(screen.getByTestId('modal-select-player'));
		});

		await waitFor(() => {
			expect(screen.queryByTestId('select-player-modal')).toBeNull();
		});
	});

	it('cubre el flujo del modal de SelectCards (LookIntoAshes)', async () => {
		mockIsCancellableCard.mockResolvedValue({ is_cancellable: false });
		const eventCard = { id: 1, name: 'event_lookashes' };
		const { rerender } = render(<GameEventContainer {...baseProps} />);

		rerender(<GameEventContainer {...baseProps} eventCardToPlay={eventCard} />);

		await waitFor(() => {
			expect(mockPlayLookIntoTheAshes).toHaveBeenCalled();
			expect(screen.getByTestId('select-cards-modal')).toBeDefined();
		});

		act(() => {
			fireEvent.click(screen.getByTestId('modal-select-card'));
		});

		await waitFor(() => {
			expect(screen.queryByTestId('select-cards-modal')).toBeNull();
		});
	});

	it('cubre el flujo del modal de Múltiples Cartas (DelayEscape)', async () => {
		mockIsCancellableCard.mockResolvedValue({ is_cancellable: false });
		const eventCard = { id: 7, name: 'event_delayescape' };
		const { rerender } = render(<GameEventContainer {...baseProps} />);

		rerender(<GameEventContainer {...baseProps} eventCardToPlay={eventCard} />);

		await waitFor(() => {
			expect(mockPlayDelayEscape).toHaveBeenCalled();
			const modal = screen.getByTestId('select-cards-modal');
			expect(modal.getAttribute('data-multiple')).toBe('true');
		});

		act(() => {
			fireEvent.click(screen.getByTestId('modal-select-card'));
		});

		await waitFor(() => {
			expect(screen.queryByTestId('select-cards-modal')).toBeNull();
		});
	});

	it('cubre el flujo del modal de Another Victim (Selección de Set y Close)', async () => {
		mockIsCancellableCard.mockResolvedValue({ is_cancellable: false });
		const eventCard = { id: 3, name: 'event_anothervictim' };
		const { rerender } = render(<GameEventContainer {...baseProps} />);

		rerender(<GameEventContainer {...baseProps} eventCardToPlay={eventCard} />);

		await waitFor(() => {
			expect(mockPlayAnotherVictim).toHaveBeenCalled();
			expect(screen.getByTestId('select-player-modal')).toBeDefined();
		});

		fireEvent.click(screen.getByTestId('modal-select-player'));

		await waitFor(() => {
			expect(screen.queryByTestId('select-player-modal')).toBeNull();
			expect(screen.getByTestId('fullscreen-modal')).toBeDefined();
			expect(screen.getByTestId('select-set-content')).toBeDefined();
		});

		act(() => {
			fireEvent.click(screen.getByTestId('modal-select-set'));
		});

		await waitFor(() => {
			expect(screen.queryByTestId('fullscreen-modal')).toBeNull();
		});
		rerender(<GameEventContainer {...baseProps} eventCardToPlay={null} />);
		rerender(<GameEventContainer {...baseProps} eventCardToPlay={eventCard} />);
		await waitFor(() => {
			expect(screen.getByTestId('select-player-modal')).toBeDefined();
		});
		fireEvent.click(screen.getByTestId('modal-select-player'));

		await waitFor(() => {
			expect(screen.getByTestId('fullscreen-modal')).toBeDefined();
		});
		act(() => {
			fireEvent.click(screen.getByTestId('modal-close'));
		});

		await waitFor(() => {
			expect(screen.queryByTestId('fullscreen-modal')).toBeNull();
		});
	});

});