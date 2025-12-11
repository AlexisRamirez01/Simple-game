import { renderHook, act } from '@testing-library/react';
import { useAnotherVictim } from './useAnotherVictim';

const mockDetectiveSetService = {
	getPlayersWithAtLeastOneSet: vi.fn(),
	getDetectiveSetByPlayer: vi.fn(),
};
const mockPlayerService = {
	getPlayersByGame: vi.fn(),
};
const mockGamePlayerService = {
	discardCard: vi.fn(),
};
const mockEventService = {
	playEventCard: vi.fn(),
};
const mockNotification = {
	showNotification: vi.fn(),
};

vi.mock('../../../services/detectiveSetService', () => ({
	createDetectiveSetService: () => mockDetectiveSetService,
}));
vi.mock('../../../services/playerService', () => ({
	createPlayerService: () => mockPlayerService,
}));
vi.mock('../../../services/gamePlayerService', () => ({
	createGamePlayerService: () => mockGamePlayerService,
}));
vi.mock('../../../services/eventService', () => ({
	createEventService: () => mockEventService,
}));

vi.mock('../../../components/NotificationContext', () => ({
	useNotification: () => mockNotification,
}));

describe('useAnotherVictim', () => {
	const mockSetPlayersModal = vi.fn();
	const mockSetIsOpenSelectPlayer = vi.fn();
	const mockSetOnSelectPlayer = vi.fn();
	const mockSetAnotherDetectiveSet = vi.fn();
	const mockSetOnSelectSetModal = vi.fn();
	const mockSetShowDetectivesSet = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('debe cancelar el play si no hay jugadores con sets', async () => {
		mockDetectiveSetService.getPlayersWithAtLeastOneSet.mockResolvedValue([]);
		mockPlayerService.getPlayersByGame.mockResolvedValue([]);

		const { result } = renderHook(() =>
			useAnotherVictim(
				'game123',
				'player1',
				mockSetIsOpenSelectPlayer,
				mockSetOnSelectPlayer,
				mockSetPlayersModal,
				mockSetAnotherDetectiveSet,
				mockSetOnSelectSetModal,
				mockSetShowDetectivesSet
			)
		);

		await act(async () => {
			await result.current.playAnotherVictim('card123');
		});

		expect(mockNotification.showNotification).toHaveBeenCalledWith(
			'Juege otra carta',
			'No hay jugadores con sets jugados',
			3000
		);

		expect(mockGamePlayerService.discardCard).toHaveBeenCalledWith(
			'game123',
			'player1',
			'card123',
			{ room_id: 'game123' }
		);

		expect(mockSetIsOpenSelectPlayer).not.toHaveBeenCalled();
		expect(mockSetPlayersModal).not.toHaveBeenCalled();
	});

    it('debe abrir el modal si hay jugadores con sets', async () => {
        mockDetectiveSetService.getPlayersWithAtLeastOneSet.mockResolvedValue(['p2']);
        mockPlayerService.getPlayersByGame.mockResolvedValue([
            { id: 'p1', name: 'Jugador 1' },
            { id: 'p2', name: 'Jugador 2' },
            { id: 'p3', name: 'Jugador 3' },
        ]);

        const { result } = renderHook(() =>
            useAnotherVictim(
                'game123',
                'p1',
                mockSetIsOpenSelectPlayer,
                mockSetOnSelectPlayer,
                mockSetPlayersModal,
                mockSetAnotherDetectiveSet,
                mockSetOnSelectSetModal,
                mockSetShowDetectivesSet
            )
        );

        await act(async () => {
            await result.current.playAnotherVictim('card123');
        });

        expect(mockNotification.showNotification).not.toHaveBeenCalled();

        expect(mockSetPlayersModal).toHaveBeenCalledWith([
            { id: 'p2', name: 'Jugador 2' },
        ]);

        expect(mockSetIsOpenSelectPlayer).toHaveBeenCalledWith(true);

        expect(mockSetOnSelectPlayer).toHaveBeenCalled();
        expect(mockSetOnSelectSetModal).toHaveBeenCalled();

        expect(mockGamePlayerService.discardCard).not.toHaveBeenCalled();
    });
    it('debe manejar correctamente la selección de jugador y mostrar sus sets', async () => {
        mockDetectiveSetService.getPlayersWithAtLeastOneSet.mockResolvedValue(['targetPlayer123']);
        mockPlayerService.getPlayersByGame.mockResolvedValue([
            { id: 'playerA', name: 'Jugador A' },
            { id: 'targetPlayer123', name: 'Jugador B' },
        ]);
        mockDetectiveSetService.getDetectiveSetByPlayer.mockResolvedValue([
            { id: 101, cards: [] },
        ]);

        const { result } = renderHook(() =>
            useAnotherVictim(
                'game999',
                'playerA',
                mockSetIsOpenSelectPlayer,
                mockSetOnSelectPlayer,
                mockSetPlayersModal,
                mockSetAnotherDetectiveSet,
                mockSetOnSelectSetModal,
                mockSetShowDetectivesSet
            )
        );

        await act(async () => {
            await result.current.playAnotherVictim('cardZ');
        });


        const onSelectPlayerWrapper = mockSetOnSelectPlayer.mock.calls[0][0];
        const onSelectPlayerFn = onSelectPlayerWrapper(); 

        await act(async () => {
            await onSelectPlayerFn('targetPlayer123');
        });

        expect(mockDetectiveSetService.getDetectiveSetByPlayer).toHaveBeenCalledWith('targetPlayer123');
        expect(mockSetPlayersModal).toHaveBeenCalledWith([]);
        expect(mockSetIsOpenSelectPlayer).toHaveBeenCalledWith(false);
        expect(mockSetOnSelectPlayer).toHaveBeenCalledWith(null);
        expect(mockSetShowDetectivesSet).toHaveBeenCalledWith(true);
        expect(mockSetAnotherDetectiveSet).toHaveBeenCalledWith([{ id: 101, cards: [] }]);
    });
});
