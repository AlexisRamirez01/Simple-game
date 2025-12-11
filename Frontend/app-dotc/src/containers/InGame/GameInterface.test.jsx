import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { vi } from "vitest";
import GameInterface from "./GameInterface";

vi.mock("./components/Cards", () => ({
  default: ({ cards }) => (
    <div data-testid="mock-cards">
      {cards.map((c, i) => <img key={i} alt="carta" />)}
    </div>
  ),
}));

vi.mock("./components/PlayerAvatar", () => ({
  default: ({ player }) => (
    <div data-testid={`mock-avatar-${player.name}`}>{player.name}</div>
  ),
}));

vi.mock("./components/Modal", () => ({
  default: ({ title, onClose, children }) => (
    <div role="dialog" aria-label={title}>
      <h3>{title}</h3>
      {children}
      <button onClick={onClose}>Cerrar</button>
    </div>
  ),
}));

vi.mock("./PlayerHandContainer", () => ({
  default: (props) => (
    <div data-testid="mock-player-hand">
      {props.cards.map((c) => (
        <img key={c.id} alt="carta-mano" />
      ))}
    </div>
  ),
}));

vi.mock("./components/DeckInterface", () => ({
  default: (props) => (
    <div data-testid="mock-deck-interface">
      <span>Draw: {props.drawCount}</span>
      <span>Discard: {props.discardCount}</span>
    </div>
  ),
}));

vi.mock("../../components/NotificationContext", () => ({
  useNotification: () => ({
    showNotification: vi.fn(),
  }),
}));

vi.mock("../../assets/Home-background.png", () => ({ default: "background.png" }));
vi.mock("../../assets/card_back.png", () => ({ default: "card_back.png" }));

const mockMyHandCards = [
  { id: 1, name: "as" },
  { id: 2, name: "reina" },
  { id: 3, name: "7" },
];

const mockSecretCards = [{ id: 10 }, { id: 11 }];

const mockOpponentSets = [
  { cards: [{ id: 20 }, { id: 21 }] },
  { cards: [{ id: 30 }, { id: 31 }, { id: 32 }] },
];

const defaultProps = {
  turnPlayerId: 1,
  myPlayerId: 1,
  cards: mockMyHandCards,
  setCards: vi.fn(),
  secretCards: mockSecretCards,
  players: [
    { player_id: 1, position_id_player: 0, name: "Yo" },
    { player_id: 2, position_id_player: 1, name: "Jugador 2" },
    { player_id: 3, position_id_player: 2, name: "Jugador 3" },
    { player_id: 4, position_id_player: 3, name: "Jugador 4" },
  ],
  playersData: {
    1: { player_id: 1, name: "Yo" },
    2: { player_id: 2, name: "Jugador 2" },
    3: { player_id: 3, name: "Jugador 3" },
    4: { player_id: 4, name: "Jugador 4" },
  },
  playerRole: { player: { rol: "murderer" }, partner: { name: "Jugador 2" } },
  httpServicePlayerGame: {},
  gameId: 123,
  drawTop: 10,
  discardTop: 5,
  imageDiscardTop: "carta.png",
  draftCards: [],
  opponentSets: mockOpponentSets,
  myPlayerSets: [],
  wsInstance: { on: vi.fn(), emit: vi.fn(), off: vi.fn() },
  onShowSecrets: vi.fn(),
  onShowDetectiveSet: vi.fn(),
};

describe("GameInterface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Renderiza los componentes hijos (Deck y Mano) con las props correctas", () => {
    render(<GameInterface {...defaultProps} />);

    const deck = screen.getByTestId("mock-deck-interface");
    expect(deck).toBeDefined();
    expect(within(deck).getByText("Draw: 10")).toBeDefined();
    expect(within(deck).getByText("Discard: 5")).toBeDefined();

    const hand = screen.getByTestId("mock-player-hand");
    expect(hand).toBeDefined();
    expect(within(hand).getAllByAltText("carta-mano").length).toBe(
      mockMyHandCards.length
    );
  });

  it("Renderiza el texto de turno y rol para el jugador actual", () => {
    render(<GameInterface {...defaultProps} />);
    
    const playerHandInfo = screen.getByTestId("player-hand");
    expect(playerHandInfo).toBeDefined();

    expect(
      within(playerHandInfo).getByText(/¡Es tu turno!/)
    ).toBeDefined();
    expect(
      within(playerHandInfo).getByText(/Sos el asesino. Tu cómplice es Jugador 2/)
    ).toBeDefined();
  });

  it("Renderiza los otros jugadores pero no al jugador actual", () => {
    render(<GameInterface {...defaultProps} />);

    expect(screen.queryByTestId("mock-avatar-Yo")).toBeNull();

    expect(screen.getByTestId("mock-avatar-Jugador 2")).toBeDefined();
    expect(screen.getByTestId("mock-avatar-Jugador 3")).toBeDefined();
    expect(screen.getByTestId("mock-avatar-Jugador 4")).toBeDefined();
  });

  it("Calcula 'relativePos' y aplica los estilos de posición correctos", () => {
    render(<GameInterface {...defaultProps} />);

    const player2 = screen.getByTestId("mock-avatar-Jugador 2").parentElement;
    expect(player2).toHaveStyle({ top: "50%", right: "0" });

    const player3 = screen.getByTestId("mock-avatar-Jugador 3").parentElement;
    expect(player3).toHaveStyle({ top: "5%", left: "75%" });

    const player4 = screen.getByTestId("mock-avatar-Jugador 4").parentElement;
    expect(player4).toHaveStyle({ top: "5%", left: "50%" });
  });

  it("Abre y cierra el modal de Secretos (🔒) con las cartas correctas", () => {
    render(<GameInterface {...defaultProps} />);

    const secretButtons = screen.getAllByText("🔒");
    fireEvent.click(secretButtons[0]);

    expect(defaultProps.onShowSecrets).toHaveBeenCalledWith(2);

    const modal = screen.getByRole("dialog", { name: /Secretos de Jugador 2/i });
    expect(modal).toBeDefined();

    const cardsContainer = within(modal).getByTestId("mock-cards");
    expect(cardsContainer).toBeDefined();

    expect(within(cardsContainer).getAllByAltText("carta").length).toBe(
      mockSecretCards.length
    );

    fireEvent.click(within(modal).getByText("Cerrar"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Abre y cierra el modal de Sets (🔎) con los sets correctos", () => {
    render(<GameInterface {...defaultProps} />);

    const setButtons = screen.getAllByText("🔎");
    fireEvent.click(setButtons[0]);

    expect(defaultProps.onShowDetectiveSet).toHaveBeenCalledWith(2);

    const modal = screen.getByRole("dialog", { name: /Sets de Jugador 2/i });
    expect(modal).toBeDefined();

    const cardsContainers = within(modal).getAllByTestId("mock-cards");
    expect(cardsContainers.length).toBe(mockOpponentSets.length);

    expect(within(cardsContainers[0]).getAllByAltText("carta").length).toBe(
      mockOpponentSets[0].cards.length
    );
    expect(within(cardsContainers[1]).getAllByAltText("carta").length).toBe(
      mockOpponentSets[1].cards.length
    );

    fireEvent.click(within(modal).getByText("Cerrar"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Muestra el texto correcto cuando NO es mi turno", () => {
    render(<GameInterface {...defaultProps} turnPlayerId={2} />);

    const playerHandInfo = screen.getByTestId("player-hand");
    expect(
      within(playerHandInfo).getByText(/No es tu turno/)
    ).toBeDefined();
  });

  it("Muestra el texto de rol 'cómplice' e 'inocente' correctamente", () => {
    const accompliceProps = {
      ...defaultProps,
      playerRole: {
        player: { rol: "accomplice" },
        partner: { name: "Dr. Malito" },
      },
    };
    render(<GameInterface {...accompliceProps} />);
    expect(
      screen.getByText(/Sos el cómplice. Tu asesino es Dr. Malito/)
    ).toBeDefined();

    const innocentProps = {
      ...defaultProps,
      playerRole: { player: { rol: "innocent" } },
    };
    render(<GameInterface {...innocentProps} />, {
      container: document.body,
    });
    expect(
      screen.getByText(/Sos inocente. Descrubre al asesino/)
    ).toBeDefined();
  });
});
