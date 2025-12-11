import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Lobby from "./Lobby";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route} from "react-router-dom";
import useLobby from "./useLobby";

// Mock del hook
vi.mock("./useLobby", () => ({
	default: vi.fn(),
}));

describe("<Lobby />", () => {
	beforeEach(() => {
		useLobby.mockReturnValue({
			game: { max_players: 4, min_players: 2 },
			players: [],
			connected: true,
			isHost: false,
			currentPlayer: { id: 1, is_Owner: false },
		});
	});
  
  it("renderiza el título y fondo", async () => {
    render(
		<MemoryRouter initialEntries={["/lobby/1"]}>
			<Routes>
				<Route path="/lobby/:id" element={<Lobby />} />
			</Routes>
		</MemoryRouter>
    );
    expect(await screen.findByAltText("Title")).toBeInTheDocument();
    const container = screen.getByRole("img", { name: "Title" }).parentElement;
    expect(container).toHaveStyle(`background-image: url("/src/assets/Home-background.png")`);
  });

  it("renderiza el ClockSVG", async () => {
      render(
          <MemoryRouter initialEntries={["/lobby/1"]}>
            <Routes>
                <Route path="/lobby/:id" element={<Lobby />} />
            </Routes>
         </MemoryRouter>
      );
      expect(await screen.findByTestId("clock-svg")).toBeInTheDocument();
  });

  it("muestra la cantidad de jugadores y espera más cuando no está llena", () => {
    useLobby.mockReturnValue({
		game: { max_players: 4, min_players: 2 },
		players: [{ id: 1, name: "Alice" }],
		connected: true,
		isHost: false,
		currentPlayer: { id: 1, is_Owner: false },
    });

    render(<Lobby />);
    expect(
		screen.getByText((content) =>
			content.includes("Jugadores en la sala:") && content.includes("1")
		)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Esperando a más jugadores/i)
    ).toBeInTheDocument();
  });

  it("muestra ¡Todo listo! cuando la sala está llena", () => {
	useLobby.mockReturnValue({
		game: { max_players: 2, min_players: 2 },
		players: [
		{ id: 1, name: "Alice" },
		{ id: 2, name: "Bob" },
		],
		connected: true,
		isHost: true,
		currentPlayer: { id: 1, is_Owner: true },
    });

    render(<Lobby />);

    expect(
		screen.getByText((content) =>
			content.includes("Jugadores en la sala:") && content.includes("2")
		)
    ).toBeInTheDocument();

    expect(screen.getByText(/¡Todo Listo!/i)).toBeInTheDocument();
  });

  it("deshabilita el botón si no es host", () => {
    useLobby.mockReturnValue({
		game: { max_players: 4, min_players: 2 },
		players: [
			{ id: 1, name: "Alice" },
			{ id: 2, name: "Bob" },
		],
		connected: true,
		isHost: false,
		currentPlayer: { id: 2, is_Owner: false },
    });

    render(<Lobby />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText(/Esperando a que el anfitrión/i)).toBeInTheDocument();
  });

  it("habilita el botón si es host y hay suficientes jugadores", () => {
    useLobby.mockReturnValue({
		game: { max_players: 4, min_players: 2 },
		players: [
			{ id: 1, name: "Alice" },
			{ id: 2, name: "Bob" },
		],
		connected: true,
		isHost: true,
		currentPlayer: { id: 1, is_Owner: true },
    });

    render(<Lobby />);
    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent(/Iniciar partida/i);
  });

  it("dispara onStartGame al hacer click en botón de host", () => {
  	const startMock = vi.fn();  
  	useLobby.mockReturnValue({
    	game: { max_players: 4, min_players: 2 },
    	players: [
      	{ id: 1, name: "Alice" },
      	{ id: 2, name: "Bob" },
    	],
    	connected: true,
    	isHost: true,
    	currentPlayer: { id: 1, is_Owner: true },
    	startGame: startMock,   
  	});

  render(<Lobby />);

  const button = screen.getByRole("button", { name: /Iniciar partida/i });
  fireEvent.click(button);

  expect(startMock).toHaveBeenCalled(); 
});


  it("muestra mensaje cuando hay menos jugadores que min_players", () => {
    useLobby.mockReturnValue({
      game: { max_players: 4, min_players: 3 },
      players: [{ id: 1, name: "Alice" }],
      connected: true,
      isHost: true,
      currentPlayer: { id: 1, is_Owner: true },
      onStartGame: vi.fn(),
    });

    render(<Lobby />);
    expect(screen.getByText(/Esperando a más jugadores/i)).toBeInTheDocument();
  });

  it("deshabilita botón si no hay suficientes jugadores aunque sea host", () => {
    useLobby.mockReturnValue({
      game: { max_players: 4, min_players: 3 },
      players: [{ id: 1, name: "Alice" }],
      connected: true,
      isHost: true,
      currentPlayer: { id: 1, is_Owner: true },
      onStartGame: vi.fn(),
    });

    render(<Lobby />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
