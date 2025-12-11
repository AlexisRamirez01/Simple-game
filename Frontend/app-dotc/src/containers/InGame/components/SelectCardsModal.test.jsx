import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, vi, expect } from "vitest";
import { SelectCardsModal } from "./SelectCardsModal";

// Mock sencillo de las cartas
const mockCards = [
  { id: 1, name: "NOT SO FAST, YOU FIEND!", image: "img1.png" },
  { id: 2, name: "POINT YOUR SUSPICIONS", image: "img2.png" },
  { id: 3, name: "PARKER PYNE", image: "img3.png" },
];

describe("SelectCardsModal", () => {
  it("Renderiza correctamente el título, las cartas y el texto de no selección", () => {
    render(<SelectCardsModal cards={mockCards} title="Modal de seleccion de cartas" onSelect={vi.fn()} />);

    // Comprobar título
    expect(screen.getByText("Modal de seleccion de cartas")).toBeInTheDocument();

    // Comprobar que se renderizan las 3 cartas
    const renderedCards = screen.getAllByAltText("carta");
    expect(renderedCards.length).toBe(3);

    // Comprobar que aparece el texto de no selección
    expect(screen.getByText("Debes seleccionar una carta")).toBeInTheDocument();

    // El botón no debe estar visible inicialmente
    expect(screen.queryByText("Elegir carta")).not.toBeInTheDocument();
  });


  it("Se selecciona una carta al hacer click sobre ella y se muestra el botón 'Elegir carta'", () => {
    render(<SelectCardsModal cards={mockCards} title="Modal de seleccion de cartas" onSelect={vi.fn()} />);

    // Hacer click en la primera carta
    const renderedCards = screen.getAllByAltText("carta");
    fireEvent.click(renderedCards[0]);

    // El texto de no selección desaparece
    expect(screen.queryByText("Debes seleccionar una carta")).not.toBeInTheDocument();

    // Aparece el botón de "Elegir carta"
    expect(screen.getByText("Elegir carta")).toBeInTheDocument();
  });

  
  it("Llama a onSelect al clickear el botón 'Elegir carta'", () => {
    const mockOnSelect = vi.fn();
    render(<SelectCardsModal cards={mockCards} title="Cartas del mazo de draft" onSelect={mockOnSelect} />);

    // Hacemos click en la segunda carta
    const renderedCards = screen.getAllByAltText("carta");
    fireEvent.click(renderedCards[1]);

    // Hacemos click en el botón
    fireEvent.click(screen.getByText("Elegir carta"));

    // onSelect debería haberse llamado con el id de la carta seleccionada
    expect(mockOnSelect).toHaveBeenCalledWith(mockCards[1].id, false);
  }); 


	it("Permite seleccionar múltiples cartas y llama a onSelect con ambas", () => {
    const mockOnSelect = vi.fn();
    
    render(
      <SelectCardsModal
        cards={mockCards}
        title="Selecciona varias"
        onSelect={mockOnSelect}
        multiple={true}
      />
    );

    const renderedCards = screen.getAllByAltText("carta");

    fireEvent.click(renderedCards[0]);
    fireEvent.click(renderedCards[1]);

    // Ahora debería aparecer el botón "Elegir cartas"
    expect(screen.getByText("Elegir cartas")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Elegir cartas"));

    expect(mockOnSelect).toHaveBeenCalledWith(
      [mockCards[0], mockCards[1]],
      false
    );
  });

  
  it("Muestra botón 'Volver' cuando goBack = true y dispara onBack(false) cuando se hace click sobre el", () => {
    const mockOnBack = vi.fn();

    render(
      <SelectCardsModal
        cards={mockCards}
        title="Volver"
        onSelect={vi.fn()}
        goBack={true}
        onBack={mockOnBack}
      />
    );

		const backBtn = screen.getByRole("button", { name: "Volver" });
    expect(backBtn).toBeInTheDocument();

    fireEvent.click(backBtn);
    expect(mockOnBack).toHaveBeenCalledWith(false);
  });


  it("En selección múltiple, si no hay cartas seleccionadas muestra el texto de advertencia", () => {
    render(
      <SelectCardsModal
        cards={mockCards}
        title="Varias cartas"
        onSelect={vi.fn()}
        multiple={true}
      />
    );

    expect(
      screen.getByText("Debes seleccionar al menos una carta")
    ).toBeInTheDocument();

    // No debe aparecer el botón "Elegir cartas"
    expect(screen.queryByText("Elegir cartas")).not.toBeInTheDocument();
  });
});
