import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Avatar from "../components/Avatar";

// Mock de imágenes para evitar errores de import
vi.mock("../assets/av1.png", () => ({ default: "av1.png" }));
vi.mock("../assets/av2.png", () => ({ default: "av2.png" }));
vi.mock("../assets/av3.png", () => ({ default: "av3.png" }));
vi.mock("../assets/av4.png", () => ({ default: "av4.png" }));
vi.mock("../assets/av5.png", () => ({ default: "av5.png" }));
vi.mock("../assets/av6.png", () => ({ default: "av6.png" }));

describe("Avatar component", () => {
  it("Se renderizan las 6 imágenes de avatar correctamente", () => {
    render(<Avatar onSelect={() => {}} />);

    const avatars = screen.getAllByRole("img");
    expect(avatars).toHaveLength(6);

    expect(screen.getByAltText("Avatar 1")).toBeInTheDocument();
    expect(screen.getByAltText("Avatar 2")).toBeInTheDocument();
    expect(screen.getByAltText("Avatar 3")).toBeInTheDocument();
    expect(screen.getByAltText("Avatar 4")).toBeInTheDocument();
    expect(screen.getByAltText("Avatar 5")).toBeInTheDocument();
    expect(screen.getByAltText("Avatar 6")).toBeInTheDocument();
  });

  it("Se llama a la función onSelect cuando se hace click sobre una imágen", () => {
    const handleSelect = vi.fn();
    render(<Avatar onSelect={handleSelect} />);

    const avatar1 = screen.getByAltText("Avatar 1");
    fireEvent.click(avatar1);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith("av1.png");
  });

  it("Las imágenes tienen las clases de hover y escala esperadas", () => {
    render(<Avatar onSelect={() => {}} />);

    const avatar1 = screen.getByAltText("Avatar 1");

    // Verificamos que el elemento tenga las clases Tailwind que controlan el hover
    expect(avatar1).toHaveClass("hover:scale-110");
    expect(avatar1).toHaveClass("hover:brightness-110");
    expect(avatar1).toHaveClass("transition-transform");
    expect(avatar1).toHaveClass("duration-300");

    // Simulamos el hover (aunque jsdom no aplica estilos reales)
    fireEvent.mouseOver(avatar1);

    // Confirmamos que sigue teniendo las clases correctas (no se pierden)
    expect(avatar1.className).toContain("hover:scale-110");
    expect(avatar1.className).toContain("hover:brightness-110");
  });
});
