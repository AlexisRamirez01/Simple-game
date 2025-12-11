import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ClockAntique from "./ClockSVG";
import React from "react";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("ClockAntique", () => {

  it("Renderiza correctamente el SVG del reloj", () => {
    render(<ClockAntique players={0} maxPlayers={10} />);
    const svg = screen.getByTestId("clock-svg");
    expect(svg).toBeInTheDocument();
  });

  it("Calcula rotación de agujas correctamente", () => {
    render(<ClockAntique players={5} maxPlayers={10} />);
    const hora = screen.getByTestId("manecilla-hora");
    const minuto = screen.getByTestId("manecilla-minuto");

    expect(hora.getAttribute("transform")).toBe("rotate(180,128,128)");
    expect(minuto.getAttribute("transform")).toBe("rotate(180,128,128)");
  });

  it("Agrega clase jumping cuando players >= maxPlayers", () => {
    render(<ClockAntique players={10} maxPlayers={10} />);
    const svg = screen.getByTestId("clock-svg");
    expect(svg.classList.contains("jumping")).toBe(true);
  });

  it("No tiene clase jumping cuando players < maxPlayers", () => {
    render(<ClockAntique players={4} maxPlayers={10} />);
    const svg = screen.getByTestId("clock-svg");
    expect(svg.classList.contains("jumping")).toBe(false);
  });

  it("Actualiza las rotaciones al cambiar los props", () => {
    const { rerender } = render(<ClockAntique players={2} maxPlayers={10} />);
    const hora = screen.getByTestId("manecilla-hora");

    expect(hora.getAttribute("transform")).toBe("rotate(72,128,128)");

    rerender(<ClockAntique players={8} maxPlayers={10} />);
    expect(hora.getAttribute("transform")).toBe("rotate(288,128,128)");
  });

});
