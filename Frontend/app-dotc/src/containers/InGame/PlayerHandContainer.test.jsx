import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlayerHandContainer from "./PlayerHandContainer";
import { vi } from "vitest";
import React from "react";

// Mocks de servicios
vi.mock("../../services/detectiveSetService", () => ({
  createDetectiveSetService: vi.fn(() => ({})),
}));

vi.mock("../../services/cardService", () => ({
  createCardService: vi.fn(() => ({
    getCardById: vi.fn((id) =>
      Promise.resolve({ id, name: id === 99 ? "event_earlytrain" : "normal_card" })
    ),
  })),
}));

vi.mock("./eventGame/useEarlyTrainToPaddington", () => ({
  useEarlyTrainToPaddington: vi.fn(() => ({
    playEarlyTrainToPaddington: vi.fn(),
  })),
}));

// Mocks para los subcomponentes
vi.mock("./components/PlayerHand", () => ({
  default: ({ onSelectCard, onDiscard, onRestock, onPassTurn, onPlayEventTest, onPlayDetective }) => (
    <div>
      <button data-testid="select" onClick={() => onSelectCard(1)}>select</button>
      <button data-testid="discard" onClick={onDiscard}>discard</button>
      <button data-testid="restock" onClick={onRestock}>restock</button>
      <button data-testid="pass" onClick={onPassTurn}>pass</button>
      <button data-testid="playEvent" onClick={onPlayEventTest}>event</button>
      <button data-testid="playDetective" onClick={onPlayDetective}>detective</button>
    </div>
  ),
}));

vi.mock("./components/RestockChoiceModal", () => ({
  default: ({ isOpen, onSelect }) =>
    isOpen ? (
      <div data-testid="restock-choice">
        <button onClick={() => onSelect("deck")}>deck</button>
        <button onClick={() => onSelect("draft")}>draft</button>
      </div>
    ) : null,
}));

vi.mock("./components/SelectCardsModal", () => ({
  SelectCardsModal: ({ onSelect }) => (
    <div data-testid="select-modal">
      <button onClick={() => onSelect(1, false)}>selectDraft</button>
    </div>
  ),
}));

vi.mock("./GameDetectiveContainer", () => ({
  default: () => <div data-testid="detective-container" />,
}));

vi.mock("./GameEventContainer", () => ({
  default: () => <div data-testid="event-container" />,
}));

describe("PlayerHandContainer", () => {
  const mockHttp = {
    restockCard: vi.fn(() =>
      Promise.resolve({ cards: [{ id: 10, name: "new_card" }] })
    ),
    discardCard: vi.fn(() => Promise.resolve()),
    passTurn: vi.fn(() => Promise.resolve()),
  };

  const baseProps = {
    cards: [{ id: 1, name: "detective_smith" }, { id: 2, name: "event_train" }],
    setCards: vi.fn(),
    gameId: "1",
    playerId: "p1",
    httpServicePlayerGame: mockHttp,
    areMySecrets: false,
    isMyTurn: true,
    draftCards: [{ id: 3, name: "draft_card" }],
    detectivesSet: [],
    wsInstance: {},
    playersData: [],
    isSocialDisgracee: false,
  };

  beforeEach(() => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  it("selecciona una carta y juega detective correctamente", () => {
    render(<PlayerHandContainer {...baseProps} />);
    fireEvent.click(screen.getByTestId("select"));
    fireEvent.click(screen.getByTestId("playDetective"));
  });

  it("alerta si intenta jugar detective sin carta seleccionada", () => {
    render(<PlayerHandContainer {...baseProps} />);
    fireEvent.click(screen.getByTestId("playDetective"));
    expect(window.alert).toHaveBeenCalledWith("Seleccioná una carta primero");
  });

  it("juega evento correctamente y marca acción tomada", () => {
    render(<PlayerHandContainer {...baseProps} />);
    fireEvent.click(screen.getByTestId("select"));
    fireEvent.click(screen.getByTestId("playEvent"));
  });

  it("muestra alerta si intenta jugar evento sin carta seleccionada", () => {
    render(<PlayerHandContainer {...baseProps} />);
    fireEvent.click(screen.getByTestId("playEvent"));
    expect(window.alert).toHaveBeenCalledWith("Seleccioná una carta primero");
  });

  it("descarta carta normalmente", async () => {
    render(<PlayerHandContainer {...baseProps} />);
    fireEvent.click(screen.getByTestId("select"));
    fireEvent.click(screen.getByTestId("discard"));
    await waitFor(() => expect(mockHttp.discardCard).toHaveBeenCalled());
  });

  it("usa EarlyTrain cuando la carta es event_earlytrain", async () => {
    const props = { ...baseProps, cards: [{ id: 99, name: "event_earlytrain" }] };
    render(<PlayerHandContainer {...props} />);
    fireEvent.click(screen.getByTestId("select"));
    fireEvent.click(screen.getByTestId("discard"));
    await waitFor(() => expect(mockHttp.discardCard).not.toHaveBeenCalled());
  });

  it("maneja error al descartar carta", async () => {
    mockHttp.discardCard.mockRejectedValueOnce(new Error("fail"));
    render(<PlayerHandContainer {...baseProps} />);
    fireEvent.click(screen.getByTestId("select"));
    await waitFor(() => fireEvent.click(screen.getByTestId("discard")));
  });

  it("realiza restock desde el deck correctamente", async () => {
    render(<PlayerHandContainer {...baseProps} />);
    fireEvent.click(screen.getByTestId("restock"));
    fireEvent.click(screen.getByText("deck"));
    await waitFor(() => expect(mockHttp.restockCard).toHaveBeenCalled());
  });

  it("realiza restock desde el draft correctamente", async () => {
    render(<PlayerHandContainer {...baseProps} />);
    fireEvent.click(screen.getByTestId("restock"));
    fireEvent.click(screen.getByText("draft"));
    fireEvent.click(screen.getByText("selectDraft"));
    await waitFor(() => expect(mockHttp.restockCard).toHaveBeenCalled());
  });

  it("muestra alerta si no hay draft disponible", async () => {
    const props = { ...baseProps, draftCards: [] };
    render(<PlayerHandContainer {...props} />);
    fireEvent.click(screen.getByTestId("restock"));
    fireEvent.click(screen.getByText("draft"));
    expect(window.alert).toHaveBeenCalledWith("No hay cartas disponibles en el mazo de draft.");
  });

  it("maneja error al hacer restock", async () => {
    mockHttp.restockCard.mockRejectedValueOnce({
      response: { status: 400, data: { detail: "6 cards" } },
    });
    render(<PlayerHandContainer {...baseProps} />);
    fireEvent.click(screen.getByTestId("restock"));
    fireEvent.click(screen.getByText("deck"));
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith("Ya tienes 6 cartas en tu mano")
    );
  });

  it("pasa el turno correctamente", async () => {
    render(<PlayerHandContainer {...baseProps} />);
    fireEvent.click(screen.getByTestId("pass"));
    await waitFor(() => expect(mockHttp.passTurn).toHaveBeenCalled());
  });

  it("resetea estados cuando cambia el turno", () => {
    const { rerender } = render(<PlayerHandContainer {...baseProps} isMyTurn={false} />);
    rerender(<PlayerHandContainer {...baseProps} isMyTurn={true} />);
  });

  it("maneja isSocialDisgracee correctamente", () => {
    const props = { ...baseProps, isSocialDisgracee: true };
    render(<PlayerHandContainer {...props} />);
    fireEvent.click(screen.getByTestId("restock"));
  });
});
