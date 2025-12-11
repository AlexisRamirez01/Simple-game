import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';

// --- MOCKS DE LIBRERÍAS Y COMPONENTES ---
vi.mock('react-router-dom', () => ({
  useParams: () => ({ game_id: '123', player_id: '1' }),
}));

vi.mock('../../components/NotificationContext', () => ({
  useNotification: () => ({ showNotification: (...args) => mockShowNotification(...args) }),
}));

vi.mock('../../services/WSService', () => ({
  default: vi.fn(() => ({
    connect: (...args) => mockWsConnect(...args),
    isConnected: (...args) => mockWsIsConnected(...args),
    on: (...args) => mockWsOn(...args),
  })),
}));

vi.mock('../../services/playerCardService', () => ({
  createPlayerCardService: () => ({ getPlayerCards: (...args) => mockGetPlayerCards(...args) }),
}));

vi.mock('../../services/gamePlayerService', () => ({
  createGamePlayerService: () => ({
    getGamePlayers: (...args) => mockGetGamePlayers(...args),
    getPlayerRole: (...args) => mockGetPlayerRole(...args),
  }),
}));

vi.mock('../../services/playerService', () => ({
  createPlayerService: () => ({
    getPlayerById: (...args) => mockGetPlayerById(...args),
    updatePlayer: (...args) => mockUpdatePlayer(...args)
  }),
}));

vi.mock('../../services/secretCardService', () => ({
  createSecretCardService: () => ({ getSecretCardByPlayer: (...args) => mockGetSecretCardByPlayer(...args) }),
}));

vi.mock('../../services/gameService', () => ({
  createGameService: () => ({ getGameById: (...args) => mockGetGameById(...args) }),
}));

vi.mock('../../services/detectiveSetService', () => ({
  createDetectiveSetService: () => ({ getDetectiveSetByPlayer: (...args) => mockGetDetectiveSetByPlayer(...args) }),
}));

// --- ¡¡ARREGLO #1 (A): MOCKEAR gameCardService y cardService!! ---
vi.mock('../../services/gameCardService', () => ({
  createGameCardService: () => ({
    getGameCardsTopOneDiscard: (...args) => mockGetGameCardsTopOneDiscard(...args),
    getGameCardsByDeck: (...args) => mockGetGameCardsByDeck(...args),
  }),
}));

vi.mock('../../services/cardService', () => ({
  createCardService: () => ({
    getCardById: (...args) => mockGetCardById(...args),
  }),
}));


// Mockeamos los handlers ADEMÁS de los servicios (doble seguridad)
vi.mock('./DeckInterfaceHandler', () => ({
  getAmountCardsOnDeck: (...args) => mockGetAmountCardsOnDeck(...args),
  getCardOnDiscardTop: (...args) => mockGetCardOnDiscardTop(...args),
  getDraftCards: (...args) => mockGetDraftCards(...args),
}));

// --- MOCKS DE COMPONENTES USADOS EN NOTIFICACIONES ---
vi.mock('./components/Card', { default: () => <div data-testid="mock-card-component" /> });
vi.mock('./components/Cards', { default: () => <div data-testid="mock-cards-component" /> });

// --- MOCKS DE ASSETS ---
vi.mock('../../assets/Home-background.png', { default: 'background.png' });
vi.mock('../../assets/card_back.png', { default: 'card_back.png' });
vi.mock('../../assets/secret_front.png', { default: 'secret_front.png' });

// --- MOCKS DE SPY (Declarados globalmente) ---
const mockWsOn = vi.fn();
const mockWsConnect = vi.fn();
const mockWsIsConnected = vi.fn(() => false);
const mockGetPlayerCards = vi.fn();
const mockGetGamePlayers = vi.fn();
const mockGetPlayerRole = vi.fn();
const mockGetPlayerById = vi.fn();
const mockUpdatePlayer = vi.fn();
const mockGetSecretCardByPlayer = vi.fn();
const mockGetGameById = vi.fn();
const mockGetDetectiveSetByPlayer = vi.fn();
const mockShowNotification = vi.fn();
const mockGetAmountCardsOnDeck = vi.fn();
const mockGetCardOnDiscardTop = vi.fn();
const mockGetDraftCards = vi.fn();
// --- ¡¡ARREGLO #1 (B): Declarar spies nuevos!! ---
const mockGetGameCardsTopOneDiscard = vi.fn();
const mockGetGameCardsByDeck = vi.fn();
const mockGetCardById = vi.fn();

const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => { });
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => { });

// Mocks para los componentes spy
const MockGameInterfaceSpy = vi.fn(() => <div data-testid="mock-game-interface" />);
const MockGameOverModalSpy = vi.fn(() => <div data-testid="mock-game-over-modal" />);

vi.mock('./GameInterface', () => ({ default: (...args) => MockGameInterfaceSpy(...args) }));
vi.mock('./components/GameOverModal', () => ({ default: (...args) => MockGameOverModalSpy(...args) }));

import GameInterfaceContainer from './GameInterfaceContainer';

// --- Variables de datos para los tests ---
const mockGameId = '123';
const mockPlayerId = '1';
const mockGame = { turn_id_player: 2 };
const mockMyCards = [{ id: 1, name: 'card1' }, { id: 2, name: 'secret_card' }];
const mockPlayersInGame = [{ player_id: 1, position_id_player: 0 }, { player_id: 2, position_id_player: 1 }];
const mockPlayerRole = { player: { rol: 'innocent' } };
const mockMySets = [{ id: 'set1', cards: [] }];
const mockMySecrets = [{ id: 2, name: 'secret_card' }];

// --- ¡¡ARREGLO #2: AÑADIR 'birthdate' Y 'is_Social_Disgrace' A LOS MOCKS!! ---
const mockPlayer1Info = { id: 1, name: 'Player 1', birthdate: '2000-01-01T00:00:00', is_Social_Disgrace: false };
const mockPlayer2Info = { id: 2, name: 'Player 2', birthdate: '2000-01-01T00:00:00', is_Social_Disgrace: false };

const mockDeckData = { drawTop: 10, discardTop: 2 };
const mockCardImage = 'top_card.png';
const mockDraftCards = [{ id: 100, name: 'draft_card' }];
const mockTopDiscardCard = { card_id: 999 }; // Mock para getGameCardsTopOneDiscard
const mockFullCard = { id: 999, image_url: 'top_card.png' }; // Mock para getCardById

describe('GameInterfaceContainer', () => {

  beforeEach(() => {
    vi.clearAllMocks();

    MockGameInterfaceSpy.mockClear();
    MockGameOverModalSpy.mockClear();

    mockUpdatePlayer.mockClear();
    mockUpdatePlayer.mockResolvedValue({});

    mockWsIsConnected.mockReturnValue(false);
    mockGetGameById.mockResolvedValue(mockGame);
    mockGetPlayerCards.mockResolvedValue(mockMyCards);
    mockGetGamePlayers.mockResolvedValue(mockPlayersInGame);
    mockGetPlayerRole.mockResolvedValue(mockPlayerRole);
    mockGetDetectiveSetByPlayer.mockResolvedValue(mockMySets);
    mockGetSecretCardByPlayer.mockResolvedValue(mockMySecrets);

    mockGetPlayerById.mockImplementation((id) => {
      const numId = Number(id);
      if (numId === 1) return Promise.resolve(mockPlayer1Info);
      if (numId === 2) return Promise.resolve(mockPlayer2Info);
      return Promise.resolve({ id: numId, name: `Player ${numId}`, birthdate: '2000-01-01T00:00:00', is_Social_Disgrace: false });
    });

    // --- ¡¡ARREGLO #1 (C): Configurar TODOS los mocks!! ---
    mockGetAmountCardsOnDeck.mockResolvedValue(mockDeckData);
    mockGetCardOnDiscardTop.mockResolvedValue(mockCardImage);
    mockGetDraftCards.mockResolvedValue(mockDraftCards);

    mockGetGameCardsTopOneDiscard.mockResolvedValue(mockTopDiscardCard);
    mockGetGameCardsByDeck.mockResolvedValue(mockDraftCards);
    mockGetCardById.mockResolvedValue(mockFullCard); // <-- Mockeamos el servicio de carta
  });

  // --- Tests que pasaban (9) ---
  it("muestra 'Cargando...' inicialmente y luego renderiza la interfaz", async () => {
    render(<GameInterfaceContainer />);
    expect(screen.getByText('Cargando...')).toBeDefined();
    await waitFor(() => expect(screen.queryByText('Cargando...')).toBeNull());
    expect(screen.getByTestId('mock-game-interface')).toBeDefined();
    expect(MockGameInterfaceSpy).toHaveBeenCalled();
    expect(mockWsConnect).toHaveBeenCalled();
  });

  it('pasa todas las props iniciales correctas a GameInterface', async () => {
    render(<GameInterfaceContainer />);
    const expectedCards = [{ id: 1, name: 'card1' }, { id: 2, name: 'secret_card' }];
    const expectedPlayersData = { 1: { ...mockPlayer1Info, position: 0 }, 2: { ...mockPlayer2Info, position: 1 } };

    await waitFor(() => expect(MockGameInterfaceSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        turnPlayerId: mockGame.turn_id_player,
        cards: expectedCards,
        playersData: expectedPlayersData
      }),
      undefined
    ));
  });

  it("maneja el evento 'gameNextTurn' de WS", async () => {
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockWsOn).toHaveBeenCalledWith('gameNextTurn', expect.any(Function)));
    const nextTurnHandler = mockWsOn.mock.calls.find(call => call[0] === 'gameNextTurn')[1];
    act(() => nextTurnHandler(5));
    await waitFor(() => expect(MockGameInterfaceSpy).toHaveBeenLastCalledWith(expect.objectContaining({ turnPlayerId: 5 }), undefined));
  });

  it('cubre el `return` del useEffect si `didInit.current` es true', async () => {
    const { rerender } = render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockGetGameById).toHaveBeenCalledTimes(1));
    rerender(<GameInterfaceContainer />);
    expect(mockGetGameById).toHaveBeenCalledTimes(1);
  });

  it('cubre la rama `wsInstance.isConnected()` y muestra un warning', async () => {
    mockWsIsConnected.mockReturnValue(true);
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockConsoleWarn).toHaveBeenCalledWith('WebSocket is already connected. Reusing existing connection.'));
  });

  it("maneja el evento 'gamePlayerDiscard' de WS", async () => {
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockWsOn).toHaveBeenCalledWith('gamePlayerDiscard', expect.any(Function)));
    const discardHandler = mockWsOn.mock.calls.find(call => call[0] === 'gamePlayerDiscard')[1];
    act(() => discardHandler({ card_discard: { id: 1, image_url: 'discarded.png' } }));
    await waitFor(() => {
      expect(MockGameInterfaceSpy).toHaveBeenLastCalledWith(expect.objectContaining({
        discardTop: mockDeckData.discardTop + 1,
        imageDiscardTop: 'discarded.png',
        cards: [{ id: 2, name: 'secret_card' }],
      }), undefined);
    });
  });

  it("maneja el evento 'gamePlayerRestock' de WS (solo draft, no para mí)", async () => {
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockWsOn).toHaveBeenCalledWith('gamePlayerRestock', expect.any(Function)));
    const restockHandler = mockWsOn.mock.calls.find(call => call[0] === 'gamePlayerRestock')[1];
    const newData = { draft_cards: [{ id: 200 }], cards: [{ id: 300 }], player_id: 99 };
    act(() => restockHandler(newData));
    await waitFor(() => {
      const lastCallProps = MockGameInterfaceSpy.mock.lastCall[0];
      expect(lastCallProps.draftCards).toEqual(newData.draft_cards);
      expect(lastCallProps.cards).toEqual(mockMyCards);
    });
  });

  it("maneja el evento 'gamePlayerRestock' sin draft cards y para mí", async () => {
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockWsOn).toHaveBeenCalledWith('gamePlayerRestock', expect.any(Function)));
    const restockHandler = mockWsOn.mock.calls.find(call => call[0] === 'gamePlayerRestock')[1];
    const newData = { cards: [{ id: 300 }], player_id: Number(mockPlayerId) };
    act(() => restockHandler(newData));
    await waitFor(() => {
      const lastCallProps = MockGameInterfaceSpy.mock.lastCall[0];
      expect(lastCallProps.cards).toContainEqual({ id: 300 });
    });
  });

  it("maneja el evento 'playerCardUpdate' que no me afecta", async () => {
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockWsOn).toHaveBeenCalledWith('playerCardUpdate', expect.any(Function)));
    const cardUpdateHandler = mockWsOn.mock.calls.find(call => call[0] === 'playerCardUpdate')[1];
    await act(async () => await cardUpdateHandler({ card: { id: 99 }, old_player: { id: 2 }, new_player: { id: 3 } }));
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalled();
      expect(MockGameInterfaceSpy).toHaveBeenLastCalledWith(expect.objectContaining({ cards: mockMyCards }), undefined);
    });
  });

  // --- Tests que fallaban (ahora arreglados) ---

  it("maneja el evento 'secretCardUpdate' (revelada y oculta)", async () => {
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockWsOn).toHaveBeenCalledWith('secretCardUpdate', expect.any(Function)));
    const secretUpdateHandler = mockWsOn.mock.calls.find(call => call[0] === 'secretCardUpdate')[1];

    const revealedCard = { id: 2, name: 'secret_card_revealed', is_revealed: true, owner: 'Player 2' };

    await act(async () => {
      await secretUpdateHandler(revealedCard);
    });

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.anything(), // El <Card />
        `Una carta secreta del jugador Player 2 fue revelada`,
        4000,
        'default',
        expect.any(Object)
      );
      expect(MockGameInterfaceSpy).toHaveBeenLastCalledWith(expect.objectContaining({ cards: [{ id: 1, name: 'card1' }, revealedCard] }), undefined);
    });

    const hiddenCard = { id: 2, name: 'secret_card_hidden', is_revealed: false, owner: 'Player 2' };
    mockShowNotification.mockClear();

    await act(async () => {
      await secretUpdateHandler(hiddenCard);
    });

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.anything(), // El <Card />
        `Una carta secreta del jugador Player 2 fue oculta`,
        4000,
        'default',
        expect.any(Object)
      );
      expect(MockGameInterfaceSpy).toHaveBeenLastCalledWith(expect.objectContaining({ cards: [{ id: 1, name: 'card1' }, hiddenCard] }), undefined);
    });
  });

  it("maneja el evento 'detectiveSetAdd' (para mí y para otro)", async () => {
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockWsOn).toHaveBeenCalledWith('detectiveSetAdd', expect.any(Function)));
    const setHandler = mockWsOn.mock.calls.find(call => call[0] === 'detectiveSetAdd')[1];

    const otherPlayerData = { owner: { id: 99, name: 'Otro' }, cards: [] };
    act(() => setHandler(otherPlayerData));
    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        expect.anything(),
        `El jugador Otro ha jugado un set`,
        3000,
        'default',
        expect.any(Object)
      );
      const lastCallProps = MockGameInterfaceSpy.mock.lastCall[0];
      expect(lastCallProps.myPlayerSets).toEqual(mockMySets);
      expect(lastCallProps.cards).toEqual(mockMyCards);
    });

    const myPlayerData = { owner: { id: Number(mockPlayerId), name: 'Player 1' }, cards: [{ id: 1 }] };
    act(() => setHandler(myPlayerData));
    await waitFor(() => {
      const lastCallProps = MockGameInterfaceSpy.mock.lastCall[0];
      expect(lastCallProps.myPlayerSets).toHaveLength(2);
      expect(lastCallProps.cards).toEqual([{ id: 2, name: 'secret_card' }]);
    });
  });

  it('cubre el `catch` de la inicialización', async () => {
    mockGetGameById.mockRejectedValue(new Error('API Error'));
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockConsoleError).toHaveBeenCalledWith("Failed to load cards:", expect.any(Error)));
  });

  it('cubre el `catch` de fetchPlayerSecrets', async () => {
    mockGetSecretCardByPlayer.mockRejectedValue(new Error('Secrets API Error'));
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(MockGameInterfaceSpy).toHaveBeenCalled());
    const onShowSecrets = MockGameInterfaceSpy.mock.lastCall[0].onShowSecrets;
    await act(async () => { await onShowSecrets(2); });
    expect(mockConsoleError).toHaveBeenCalledWith("Error fetching secrets:", expect.any(Error));
  });

  it('cubre el `catch` de fetchPlayerSetDetective', async () => {
    mockGetDetectiveSetByPlayer.mockRejectedValue(new Error('Sets API Error'));
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(MockGameInterfaceSpy).toHaveBeenCalled());
    const onShowDetectiveSet = MockGameInterfaceSpy.mock.lastCall[0].onShowDetectiveSet;
    await act(async () => { await onShowDetectiveSet(2); });
    expect(mockConsoleError).toHaveBeenCalledWith("Error fetching sets:", expect.any(Error));
  });

  it("maneja el evento 'playerCardUpdate' (perder carta) de WS", async () => {
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockWsOn).toHaveBeenCalledWith('playerCardUpdate', expect.any(Function)));
    const handler = mockWsOn.mock.calls.find(call => call[0] === 'playerCardUpdate')[1];
    await act(async () => await handler({ card: { id: 1 }, old_player: { id: 1 }, new_player: { id: 2 } }));
    await waitFor(() => {
      const lastCallProps = MockGameInterfaceSpy.mock.lastCall[0];
      expect(lastCallProps.cards).not.toContainEqual({ id: 1, name: 'card1' });
    });
  });

  it("maneja el evento 'playerCardUpdate' (ganar carta) de WS", async () => {
    render(<GameInterfaceContainer />);
    await waitFor(() => expect(mockWsOn).toHaveBeenCalledWith('playerCardUpdate', expect.any(Function)));
    const handler = mockWsOn.mock.calls.find(call => call[0] === 'playerCardUpdate')[1];
    const newCard = { id: 99, name: 'new_card' };
    await act(async () => await handler({ card: newCard, old_player: { id: 2 }, new_player: { id: 1 } }));
    await waitFor(() => {
      const lastCallProps = MockGameInterfaceSpy.mock.lastCall[0];
      expect(lastCallProps.cards).toContainEqual(newCard);
    });
  });

  it("llama a 'fetchPlayerSecrets' y actualiza el estado 'secretCards'", async () => {
    const opponentSecrets = [{ id: 50, name: 'secret_opponent' }];
    mockGetSecretCardByPlayer.mockReset();
    mockGetSecretCardByPlayer.mockImplementation(async (id) => {
      if (Number(id) === 1) return mockMySecrets;
      if (Number(id) === 2) return opponentSecrets;
      return [];
    });

    render(<GameInterfaceContainer />);
    await waitFor(() => expect(MockGameInterfaceSpy).toHaveBeenCalled());

    const onShowSecrets = MockGameInterfaceSpy.mock.lastCall[0].onShowSecrets;
    await act(async () => { await onShowSecrets(2); });

    expect(mockGetSecretCardByPlayer).toHaveBeenCalledWith(2, { room_id: mockGameId });
    await waitFor(() => expect(MockGameInterfaceSpy).toHaveBeenLastCalledWith(expect.objectContaining({ secretCards: opponentSecrets }), undefined));
  });

  it("llama a 'fetchPlayerSetDetective' y actualiza el estado 'viewingOpponentSets'", async () => {
    const opponentSets = [{ id: 'set2', cards: [] }];
    mockGetDetectiveSetByPlayer.mockReset();
    mockGetDetectiveSetByPlayer.mockImplementation(async (id) => {
      if (Number(id) === 1) return mockMySets;
      if (Number(id) === 2) return opponentSets;
      return [];
    });

    render(<GameInterfaceContainer />);
    await waitFor(() => expect(MockGameInterfaceSpy).toHaveBeenCalled());

    const onShowDetectiveSet = MockGameInterfaceSpy.mock.lastCall[0].onShowDetectiveSet;
    await act(async () => { await onShowDetectiveSet(2); });

    expect(mockGetDetectiveSetByPlayer).toHaveBeenCalledWith(2, { room_id: mockGameId });
    await waitFor(() => expect(MockGameInterfaceSpy).toHaveBeenLastCalledWith(expect.objectContaining({ opponentSets: opponentSets }), undefined));
  });

  it("maneja el evento 'gameMurdererEscapes' de WS y muestra el modal", async () => {
    render(<GameInterfaceContainer />);
    await waitFor(() =>
      expect(mockWsOn).toHaveBeenCalledWith('gameMurdererEscapes', expect.any(Function))
    );
    expect(screen.queryByTestId('mock-game-over-modal')).toBeNull();
    const escapeHandler = mockWsOn.mock.calls.find(call => call[0] === 'gameMurdererEscapes')[1];
    const escapeData = { murderer: { name: 'Mr. X' }, accomplice: { name: 'Mr. Y' } };
    act(() => escapeHandler(escapeData));
    await waitFor(() => {
      expect(screen.getByTestId('mock-game-over-modal')).toBeDefined();
    });

    // --- ARREGLO #3: Usar .mock.lastCall[0] ---
    expect(MockGameOverModalSpy).toHaveBeenCalled();
    const receivedProps = MockGameOverModalSpy.mock.lastCall[0];
    expect(receivedProps).toEqual(
      expect.objectContaining({
        murderer: { name: 'Mr. X' },
        accomplice: { name: 'Mr. Y' },
        state: 'El asesino ha escapado',
      })
    );
  });

  it("maneja el evento 'murdererReveled' de WS y muestra el modal", async () => {
    render(<GameInterfaceContainer />);
    await waitFor(() =>
      expect(mockWsOn).toHaveBeenCalledWith('murdererReveled', expect.any(Function))
    );
    expect(screen.queryByTestId('mock-game-over-modal')).toBeNull();
    const revealHandler = mockWsOn.mock.calls.find(call => call[0] === 'murdererReveled')[1];
    const revealData = { murderer: { name: 'Drácula' }, accomplice: { name: 'Igor' } };
    act(() => revealHandler(revealData));
    await waitFor(() => {
      expect(screen.getByTestId('mock-game-over-modal')).toBeDefined();
    });

    // --- ARREGLO #3: Usar .mock.lastCall[0] ---
    expect(MockGameOverModalSpy).toHaveBeenCalled();
    const receivedProps = MockGameOverModalSpy.mock.lastCall[0];
    expect(receivedProps).toEqual(
      expect.objectContaining({
        murderer: { name: 'Drácula' },
        accomplice: { name: 'Igor' },
        state: 'El asesino ha sido revelado',
      })
    );
  });
});