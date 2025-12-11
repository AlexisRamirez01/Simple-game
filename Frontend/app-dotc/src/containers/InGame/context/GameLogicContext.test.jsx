import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GameLockProvider, useGameLock } from "./GameLogicContext";

function TestComponent() {
  const { isLocked, lockGame, unlockGame } = useGameLock();

  return (
    <div>
      <p data-testid="status">{isLocked ? "locked" : "unlocked"}</p>
      <button onClick={lockGame}>Lock</button>
      <button onClick={unlockGame}>Unlock</button>
    </div>
  );
}


function HookConsumer() {
  const context = useGameLock();

  if (!context) {
    return <p data-testid="no-context">No provider</p>;
  }

  const { isLocked } = context;
  return <p data-testid="ok">{isLocked ? "locked" : "unlocked"}</p>;
}

describe("GameLogicContext", () => {
  it("Por defecto el juego está desbloqueado", () => {
    render(
      <GameLockProvider>
        <TestComponent />
      </GameLockProvider>
    );
    expect(screen.getByTestId("status")).toHaveTextContent("unlocked");
  });

  it("Bloquea y desbloquea correctamente el juego", () => {
    render(
      <GameLockProvider>
        <TestComponent />
      </GameLockProvider>
    );

    const status = screen.getByTestId("status");
    const lockBtn = screen.getByText("Lock");
    const unlockBtn = screen.getByText("Unlock");

    fireEvent.click(lockBtn);
    expect(status).toHaveTextContent("locked");

    fireEvent.click(unlockBtn);
    expect(status).toHaveTextContent("unlocked");
  });

  it("devuelve undefined si se usa fuera del provider", () => {
    render(<HookConsumer />);
    expect(screen.getByTestId("no-context")).toBeInTheDocument();
  });
});
