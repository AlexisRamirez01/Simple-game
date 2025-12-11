import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import GameOverModal from "./GameOverModal";

vi.mock("../../../assets/murder_escapes.png", () => ({ default: "murder_escapes.png" }));
vi.mock("../../../assets/secret_murderer.png", () => ({ default: "secret_murderer.png" }));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("GameOverModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (ui) => render(ui, { wrapper: MemoryRouter });

  it("renderiza correctamente cuando el asesino ha escapado", () => {
    const murderer = { name: "Drácula" };
    renderWithRouter(<GameOverModal murderer={murderer} state="El asesino ha escapado" />);

    expect(screen.getByText(/ha ganado!/i)).toBeInTheDocument();
    expect(screen.getByAltText("Carta de victoria")).toBeInTheDocument();
  });

  it("renderiza correctamente cuando el asesino ha sido revelado (tras 4010ms)", async () => {
    vi.useFakeTimers();
    const murderer = { name: "Lupin" };

    renderWithRouter(<GameOverModal murderer={murderer} state="El asesino ha sido revelado" />);

    expect(screen.queryByText(/ha sido revelado/i)).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(4010);
    });

    expect(
      screen.getByText(/¡El Asesino "Lupin" ha sido revelado, ganan los detectives!/i)
    ).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("renderiza correctamente cuando gana por desgracia social", () => {
    const murderer = { name: "Mister X" };
    renderWithRouter(<GameOverModal murderer={murderer} state="El asesino gana por desgracia social" />);

    expect(
      screen.getByText(
        /¡Todos los jugadores inocentes entraron en desgracia social, el asesino "Mister X" ha ganado!/i
      )
    ).toBeInTheDocument();
    expect(screen.getByAltText("Carta de victoria")).toBeInTheDocument();
  });

  it("renderiza correctamente para estado desconocido", () => {
    renderWithRouter(<GameOverModal state="Cualquier otro" />);
    expect(screen.getByText(/Estado desconocido del juego/i)).toBeInTheDocument();
  });

  it("navega al inicio al hacer clic en el botón", async () => {
    const user = userEvent.setup();
    const murderer = { name: "Drácula" };

    renderWithRouter(<GameOverModal murderer={murderer} state="El asesino ha escapado" />);

    const btn = screen.getByRole("button", { name: /Volver al Inicio/i });
    await user.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith("/");
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
