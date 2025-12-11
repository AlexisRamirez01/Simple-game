import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Cards from "./Cards";

// Mock del componente Card
vi.mock("./Card", () => {
  const React = require("react");
  return {
    default: ({
      image,
      style,
      className,
      onClick,
      onActivate,
      onDeactivate,
      disableScale,
    }) => (
      <div
        data-testid="card"
        style={style}
        className={className}
        onClick={onClick}
        onMouseDown={onActivate}
        onMouseUp={onDeactivate}
        data-disable-scale={disableScale}
      >
        <img src={image} alt="carta" />
      </div>
    ),
  };
});

const baseCards = [
  { id: 1, name: "Normal 1", image_url: "normal1.png" },
  { id: 2, name: "Normal 2", image_url: "normal2.png" },
  { id: 3, name: "Secret 1", image_url: "secret1.png", is_revealed: false },
  { id: 4, name: "Secret 2", image_url: "secret2.png", is_revealed: false },
];

describe("Cards component", () => {
  it("renderiza correctamente normal y secret cards", () => {
    render(<Cards cards={baseCards} areMySecrets={false} />);

    const imgs = screen.getAllByAltText("carta");
    expect(imgs).toHaveLength(4);

    expect(imgs[0]).toHaveAttribute("src", "normal1.png");
    expect(imgs[1]).toHaveAttribute("src", "normal2.png");

    expect(imgs[2].src).toMatch(/secret_front\.png/);
    expect(imgs[3].src).toMatch(/secret_front\.png/);
  });

  it("muestra imagenes verdaderas si las secret cards están reveladas", () => {
    const revealed = baseCards.map((c) => ({ ...c, is_revealed: true }));
    render(<Cards cards={revealed} areMySecrets={false} />);

    const imgs = screen.getAllByAltText("carta");
    expect(imgs[2]).toHaveAttribute("src", "secret1.png");
    expect(imgs[3]).toHaveAttribute("src", "secret2.png");
  });

  it("permite revelar secretos si son mis cartas secretas", () => {
    render(<Cards cards={baseCards} areMySecrets={true} />);
    const secretImgs = screen.getAllByAltText("carta").slice(2);
    expect(secretImgs[0].src).toMatch(/secret_front\.png/);


    fireEvent.click(secretImgs[0]);

    expect(secretImgs[0].src).toMatch(/secret1\.png/);
  });

  it("no permite revelar secretos si NO son mis cartas secretas", () => {
    render(<Cards cards={baseCards} areMySecrets={false} />);
    const secretImgs = screen.getAllByAltText("carta").slice(2);

    fireEvent.click(secretImgs[0]);
    expect(secretImgs[0].src).toMatch(/secret_front\.png/);
  });

  it("llama a onSelect si selectable=true", () => {
    const onSelect = vi.fn();
    render(<Cards cards={baseCards} selectable onSelect={onSelect} />);

    const firstNormal = screen.getAllByAltText("carta")[0];
    fireEvent.click(firstNormal);

    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("resalta carta seleccionada en vista normal o modal", () => {

  const { rerender } = render(<Cards cards={baseCards} selectable selectedCardId={2} />);
  let cards = screen.getAllByTestId("card");
  let selectedNormal = cards.find((el) =>
    el.className.includes("ring-yellow-400")
  );
  expect(selectedNormal).toBeTruthy();

  rerender(<Cards cards={baseCards} selectable selectedCardId={2} isModalView />);
  cards = screen.getAllByTestId("card");
  let selectedModal = cards.find((el) =>
    el.className.includes("outline-yellow-400")
  );
  expect(selectedModal).toBeTruthy();
});

  it("actualiza activeIndex en mouseDown/mouseUp", () => {
    render(<Cards cards={baseCards} />);
    const firstCard = screen.getAllByTestId("card")[0];
    fireEvent.mouseDown(firstCard);
    fireEvent.mouseUp(firstCard);
    expect(firstCard).toBeInTheDocument();
  });

  it("renderiza vista mini (isMiniSetView)", () => {
    render(<Cards cards={baseCards} isMiniSetView />);
    const cards = screen.getAllByTestId("card");
    expect(cards.length).toBe(4);
    expect(cards[0].className).toContain("w-8");
  });

  it("renderiza vista modal (isModalView)", () => {
    render(<Cards cards={baseCards} isModalView />);
    const cards = screen.getAllByTestId("card");
    expect(cards.length).toBe(4);
    expect(cards[0].dataset.disableScale).toBe("true");
  });

  it("renderiza correctamente cartas del draft", () => {
    const draftCards = [
      { card_id: 99, name: "Draft A", image_url: "draftA.png", card_position: "mazo_draft" },
      { card_id: 100, name: "Draft B", image_url: "draftB.png", card_position: "mazo_draft" },
    ];
    render(<Cards cards={draftCards} isModalView selectable />);

    const imgs = screen.getAllByAltText("carta");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute("src", "draftA.png");
  });
});

