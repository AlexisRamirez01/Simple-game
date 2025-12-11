import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNavigate } from "react-router-dom";
import GameItem from "./GameItem";

vi.mock("react-router-dom", () => ({
  ...vi.importActual("react-router-dom"),
  useNavigate: vi.fn(),
}));

describe("<GameItem />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra la información del juego y permite unirse si está disponible", async () => {
    const mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);

    const game = {
      id: 1,
      name: "Partida Test",
      current_players: 2,
      max_players: 4,
      is_started: false,
    };

    const user = userEvent.setup();
    render(<GameItem game={game} />);

    // Se renderiza info
    expect(screen.getByText("Partida Test")).toBeInTheDocument();
    expect(screen.getByText("2/4 jugadores")).toBeInTheDocument();
    expect(screen.getByText("Disponible")).toBeInTheDocument();

    // Botón activo
    const button = screen.getByRole("button", { name: /unirse/i });
    expect(button).toBeEnabled();

    await user.click(button);
    expect(mockNavigate).toHaveBeenCalledWith("/FormPlayer/1");
  });

  it.each([
  {
    name: "Partida en curso",
    game: { id: 1, name: "X", current_players: 1, max_players: 4, is_started: true },
  },
  {
    name: "Partida llena",
    game: { id: 2, name: "Y", current_players: 4, max_players: 4, is_started: false },
  },
  ])("deshabilita el botón si el juego está iniciado o lleno (%s)", ({ game }) => {
    render(<GameItem game={game} />);
    const button = screen.getByRole("button", { name: /unirse/i });
    expect(button).toBeDisabled();
    expect(button.className).toMatch(/cursor-not-allowed/);
  });
});
