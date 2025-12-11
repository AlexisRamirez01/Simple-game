import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import FullScreenCardsModal from "./Modal";

describe("FullScreenCardsModal", () => {
  it("renderiza correctamente el título y los children", () => {
    const onClose = vi.fn();

    render(
      <FullScreenCardsModal title="Modal de prueba" onClose={onClose}>
        <div data-testid="child">Contenido interno</div>
      </FullScreenCardsModal>
    );

    // Verifica que el título aparezca
    expect(screen.getByRole("dialog", { name: "Modal de prueba" })).toBeInTheDocument();
    expect(screen.getByText("Modal de prueba")).toBeInTheDocument();

    // Verifica que el contenido (children) aparezca
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Contenido interno")).toBeInTheDocument();

    // Verifica que el botón "Cerrar" esté presente
    const closeButton = screen.getByRole("button", { name: /cerrar/i });
    expect(closeButton).toBeInTheDocument();

    // Simula click en cerrar
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Verifica los atributos del contenedor principal
    const modal = screen.getByRole("dialog");
    expect(modal).toHaveAttribute("aria-modal", "true");
    expect(modal).toHaveClass("fixed", "inset-0", "z-70");
  });

  it("no rompe si no se pasan children", () => {
    const onClose = vi.fn();
    render(<FullScreenCardsModal title="Sin hijos" onClose={onClose} />);
    expect(screen.getByText("Sin hijos")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/cerrar/i));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
