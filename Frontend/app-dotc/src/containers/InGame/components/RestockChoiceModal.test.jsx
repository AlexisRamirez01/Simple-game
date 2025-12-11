import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RestockChoiceModal from "./RestockChoiceModal";
import FullScreenCardsModal from "./Modal";

vi.mock("./Modal", () => ({
  __esModule: true,
  default: ({ title, onClose, children }) => (
    <div data-testid="mock-modal">
      <h1>{title}</h1>
      <button onClick={onClose}>Cerrar</button>
      {children}
    </div>
  ),
}));

describe("RestockChoiceModal component", () => {
  let mockClose;
  let mockSelect;

  beforeEach(() => {
    mockClose = vi.fn();
    mockSelect = vi.fn();
  });

  it("no renderiza nada si isOpen es false", () => {
    const { container } = render(
      <RestockChoiceModal isOpen={false} onClose={mockClose} onSelect={mockSelect} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza correctamente cuando isOpen es true", () => {
    render(<RestockChoiceModal isOpen={true} onClose={mockClose} onSelect={mockSelect} />);
    expect(screen.getByTestId("mock-modal")).toBeInTheDocument();
    expect(screen.getByText("Elegí de dónde reponer")).toBeInTheDocument();
  });

  it("renderiza ambos botones", () => {
    render(<RestockChoiceModal isOpen={true} onClose={mockClose} onSelect={mockSelect} />);
    const deckBtn = screen.getByText("Mazo de Robo");
    const draftBtn = screen.getByText("Mazo de Draft");
    expect(deckBtn).toBeInTheDocument();
    expect(draftBtn).toBeInTheDocument();
  });

  it("botón de draft está deshabilitado si draftCards está vacío o no existe", () => {
    render(<RestockChoiceModal isOpen={true} onClose={mockClose} onSelect={mockSelect} />);
    const draftBtn = screen.getByText("Mazo de Draft");
    expect(draftBtn).toBeDisabled();
  });

  it("botón de draft está habilitado si draftCards tiene elementos", () => {
    render(
      <RestockChoiceModal
        isOpen={true}
        onClose={mockClose}
        onSelect={mockSelect}
        draftCards={[{ id: 1 }]}
      />
    );
    const draftBtn = screen.getByText("Mazo de Draft");
    expect(draftBtn).not.toBeDisabled();
  });

  it("llama a onSelect con 'deck' al hacer click en el botón de mazo de robo", () => {
    render(<RestockChoiceModal isOpen={true} onClose={mockClose} onSelect={mockSelect} />);
    fireEvent.click(screen.getByText("Mazo de Robo"));
    expect(mockSelect).toHaveBeenCalledWith("deck");
  });

  it("llama a onSelect con 'draft' al hacer click en el botón de mazo de draft habilitado", () => {
    render(
      <RestockChoiceModal
        isOpen={true}
        onClose={mockClose}
        onSelect={mockSelect}
        draftCards={[{ id: 1 }]}
      />
    );
    fireEvent.click(screen.getByText("Mazo de Draft"));
    expect(mockSelect).toHaveBeenCalledWith("draft");
  });

  it("llama a onClose cuando se presiona el botón cerrar del modal", () => {
    render(<RestockChoiceModal isOpen={true} onClose={mockClose} onSelect={mockSelect} />);
    fireEvent.click(screen.getByText("Cerrar"));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
