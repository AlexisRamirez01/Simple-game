import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNavigate } from "react-router-dom";
import Home from "./Home";

// Mock de useNavigate
vi.mock("react-router-dom", () => ({
  ...vi.importActual("react-router-dom"),
  useNavigate: vi.fn(),
}));

// Mock de GameListContainer para no testear ese componente ( se hace por separado )
vi.mock('./ListGames/GameListContainer', () => {
  return {
    default: () => <div data-testid="mocked-game-list">GameListContainer mockeado</div>
  };
});

describe("<Home /> - pantalla inicial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderizado inicial", () => {
    it("muestra el título representativo del juego", () => {
      render(<Home />);
      const titleImage = screen.getByAltText("Title");
      expect(titleImage).toBeInTheDocument();
    });

    it("muestra un fondo visual", () => {
      render(<Home />);
      const container = screen.getByTestId("home-bg");
      expect(container.style.backgroundImage).not.toBe("");
    });
  });

  describe("Botón 'Crear partida'", () => {
    it("se renderiza correctamente", () => {
      render(<Home />);
      const button = screen.getByRole("button", { name: /crear partida/i });
      expect(button).toBeInTheDocument();
      expect(button).toBeVisible();
      expect(button).toBeEnabled();
    });

    it("navega a /FormGame al hacer click", async () => {
      const mockNavigate = vi.fn();
      useNavigate.mockReturnValue(mockNavigate);

      const user = userEvent.setup();
      render(<Home />);
      const button = screen.getByRole("button", { name: /crear partida/i });

      await user.click(button);

      expect(mockNavigate).toHaveBeenCalledWith("/FormGame");
    });
  });
});
