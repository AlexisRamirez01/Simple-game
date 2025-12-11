import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DeckInterface from './DeckInterface';

// Mock del componente Card
vi.mock('./Card', () => ({
  default: ({ image, className }) => (
    <img src={image} alt="card" className={className} />
  ),
}));

describe('DeckInterface', () => {
  it('Se renderizan correctamente los dos mazos (mazo de descarte vacío)', () => {
    render(
      <DeckInterface
        drawCount={49}
        discardCount={0}
        imageDiscardTop="discarded.png"
      />
    );

    // Verifica textos
    expect(screen.getByText('Cartas: 49')).toBeInTheDocument();
    expect(screen.getByText('Cartas: 0')).toBeInTheDocument();
    expect(screen.getByText('Mazo de robo')).toBeInTheDocument();
    expect(screen.getByText('Mazo de descarte')).toBeInTheDocument();

    // Verifica texto de mazo vacío
    expect(
			screen.getByText((content) =>
				content.includes("No hay cartas") && content.includes("descartadas")
			)
		).toBeInTheDocument();

    // Debe haber cartas del mazo de robo
    const drawCards = screen.getAllByAltText('card');
    expect(drawCards.length).toBeGreaterThan(0);
  });

	it('Se renderiza correctamente el mazo de descarte cuando hay cartas descartadas', () => {
		render(
			<DeckInterface
			drawCount={49}
			discardCount={5}
			imageDiscardTop="discarded-top.png"
			/>
		);

		// Verifica que el contador de descarte se actualiza
		expect(screen.getByText('Cartas: 5')).toBeInTheDocument();

		// Ubicamos el contenedor del "Mazo de descarte"
		const discardContainer = screen.getByText('Mazo de descarte').parentElement;
		expect(discardContainer).toBeTruthy();

		// Ahora buscamos sólo dentro del mazo de descarte
		const discardImgs = within(discardContainer).getAllByAltText('card');

		// La carta superior descartada debe estar presente
		const topCard = discardImgs.find((img) =>
			img.src.includes('discarded-top.png')
		);
		expect(topCard).toBeDefined();

		// Deben existir las 3 cartas base (card_back) dentro del mazo de descarte
		const backCards = discardImgs.filter((img) =>
			img.src.includes('card_back.png')
		);
		expect(backCards.length).toBe(3);
	});

});
