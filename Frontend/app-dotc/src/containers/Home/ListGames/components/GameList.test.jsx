import { render, screen } from "@testing-library/react";
import GameList from "./GameList";

vi.mock("./GameItem", () => ({
  default: ({ game }) => <div>{game.name}</div>,
}));

describe("<GameList />", () => {
  it("muestra el título 'Partidas disponibles' cuando hay juegos", () => {
    render(<GameList games={[{ id: 1, name: "Juego 1" }]} />);
    expect(screen.getByText(/partidas disponibles/i)).toBeInTheDocument();
  });

  it("muestra el mensaje 'No hay partidas disponibles' cuando no hay juegos", () => {
    render(<GameList games={[]} />);
    expect(screen.getByText(/no hay partidas disponibles/i)).toBeInTheDocument();
  });

  it("renderiza un GameItem por cada juego", () => {
    const games = [
      { id: 1, name: "Partida 1" },
      { id: 2, name: "Partida 2" },
    ];

    render(<GameList games={games} />);

    expect(screen.getByText("Partida 1")).toBeInTheDocument();
    expect(screen.getByText("Partida 2")).toBeInTheDocument();
  });
});