import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Card from "./Card";

describe("Card component", () => {
	const mockImage = "test.png";

	let mockActivate;
	let mockDeactivate;

	beforeEach(() => {
		mockActivate = vi.fn();
		mockDeactivate = vi.fn();
	});

	it("renderiza la imagen correctamente", () => {
		render(<Card image={mockImage} />);

		const img = screen.getByAltText("carta");
		expect(img).toBeInTheDocument();
		expect(img).toHaveAttribute("src", mockImage);
	});

	it("aplica clases de hover cuando no está activa", () => {
		render(<Card image={mockImage} isActive={false} />);
		const cardDiv = screen.getByAltText("carta").parentElement;

		expect(cardDiv).toHaveClass("hover:scale-110");
		expect(cardDiv).not.toHaveClass("scale-200");
	});

	it("aplica clases de escala cuando está activa", () => {
		render(<Card image={mockImage} isActive={true} />);
		const cardDiv = screen.getByAltText("carta").parentElement;

		expect(cardDiv).toHaveClass("scale-200");
		expect(cardDiv).toHaveClass("-translate-y-16");
		expect(cardDiv).toHaveClass("z-50");
	});

	it("dispara onActivate y onDeactivate con mouse", () => {
		render(
			<Card
				image={mockImage}
				onActivate={mockActivate}
				onDeactivate={mockDeactivate}
			/>
		);

		const cardDiv = screen.getByAltText("carta").parentElement;

		fireEvent.mouseDown(cardDiv);
		expect(mockActivate).toHaveBeenCalledTimes(1);

		fireEvent.mouseUp(cardDiv);
		expect(mockDeactivate).toHaveBeenCalledTimes(1);

		fireEvent.mouseLeave(cardDiv);
		expect(mockDeactivate).toHaveBeenCalledTimes(2);
	});

	it("dispara onActivate y onDeactivate con touch", () => {
		render(
			<Card
				image={mockImage}
				onActivate={mockActivate}
				onDeactivate={mockDeactivate}
			/>
		);

		const cardDiv = screen.getByAltText("carta").parentElement;

		// Reset para evitar que eventos anteriores contaminen
		mockActivate.mockReset();
		mockDeactivate.mockReset();

		fireEvent.touchStart(cardDiv);
		expect(mockActivate).toHaveBeenCalledTimes(1);

		fireEvent.touchEnd(cardDiv);
		expect(mockDeactivate).toHaveBeenCalledTimes(1);
	});

	it("acepta className adicional", () => {
		render(
			<Card image={mockImage} className="custom-class" />
		);

		const cardDiv = screen.getByAltText("carta").parentElement;
		expect(cardDiv).toHaveClass("custom-class");
	});
});
