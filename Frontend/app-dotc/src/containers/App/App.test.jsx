import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockIsConnected = vi.fn();
vi.mock("../../services/WSService", () => ({
  __esModule: true,
  default: vi.fn(() => ({
    connect: mockConnect,
    disconnect: mockDisconnect,
    isConnected: mockIsConnected,
  })),
}));

vi.mock("../Home/Home", () => ({
  __esModule: true,
  default: () => <div>Home Page</div>,
}));
vi.mock("../Lobby/Lobby", () => ({
  __esModule: true,
  default: () => <div>Lobby Page</div>,
}));
vi.mock("../InGame/GameInterfaceContainer", () => ({
  __esModule: true,
  default: () => <div>Game Interface</div>,
}));
vi.mock("../../components/PlayerForm", () => ({
  __esModule: true,
  default: () => <div>Player Form</div>,
}));
vi.mock("../../components/GameForm", () => ({
  __esModule: true,
  default: () => <div>Game Form</div>,
}));

// Mock NotificationProvider
vi.mock("../../components/NotificationContext", () => ({
  __esModule: true,
  NotificationProvider: ({ children }) => (
    <div data-testid="notification-provider">{children}</div>
  ),
}));

describe("App Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("debería conectar el websocket si no está conectado", async () => {
    mockIsConnected.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockConnect).toHaveBeenCalled());
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("debería reutilizar la conexión si ya está conectado", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockIsConnected.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        "WebSocket is already connected. Reusing existing connection."
      );
    });
    expect(mockConnect).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("debería capturar errores al inicializar", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockIsConnected.mockImplementation(() => {
      throw new Error("Error de conexión");
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to initialize app:",
        expect.any(Error)
      )
    );
    errorSpy.mockRestore();
  });

  it("debería desconectar el websocket al desmontar", async () => {
    mockIsConnected.mockReturnValue(false);

    const { unmount } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("debería renderizar todas las rutas correctamente", async () => {
    const routes = [
      { path: "/", text: "Home Page" },
      { path: "/FormGame", text: "Game Form" },
      { path: "/FormPlayer/1", text: "Player Form" },
      { path: "/lobby/1/2", text: "Lobby Page" },
      { path: "/in_game/1/2", text: "Game Interface" },
    ];

    for (const { path, text } of routes) {
      mockIsConnected.mockReturnValue(true);
      render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText(text)).toBeInTheDocument());
      cleanup();
    }
  });
});
