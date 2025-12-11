import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SelectSetContent from './SelectSetContent';

vi.mock('./Cards', () => ({
	default: () => <div data-testid="mock-cards">Cards Mock</div>
}));
describe('SelectSetContent Component', () => {
	let mockOnSetSelected;
	const mockSets = [
		{ id: 101, cards: [{ id: 1 }] },
		{ id: 102, cards: [{ id: 3 }] },
	];
	const selectedClassKey = "outline-yellow-400";
	const transparentClass = "outline-transparent";

	const buttonText = "Robar Set Test";

	beforeEach(() => {
		mockOnSetSelected = vi.fn();
	});

	it('debería renderizar correctamente con sets disponibles', () => {

		render(<SelectSetContent setsData={mockSets} onSetSelected={mockOnSetSelected} actionButton={buttonText} />);

		expect(screen.getByRole('button', { name: buttonText })).toBeInTheDocument();
		const cardMocks = screen.getAllByTestId('mock-cards');
		expect(cardMocks).toHaveLength(mockSets.length);
	});

	it('debería mostrar un mensaje si no hay sets para robar', () => {

		render(<SelectSetContent setsData={[]} onSetSelected={mockOnSetSelected} actionButton={buttonText} />);

		expect(screen.getByText('Este jugador no tiene sets.')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: buttonText })).toBeDisabled();
	});

	it('debería tener el botón deshabilitado inicialmente', () => {

		render(<SelectSetContent setsData={mockSets} onSetSelected={mockOnSetSelected} actionButton={buttonText} />);
		expect(screen.getByRole('button', { name: buttonText })).toBeDisabled();
	});

	it('debería permitir seleccionar un set haciendo clic en él', async () => {

		render(<SelectSetContent setsData={mockSets} onSetSelected={mockOnSetSelected} actionButton={buttonText} />);
		const firstSetContainer = screen.getByTestId('set-container-101');

		expect(firstSetContainer.getAttribute('class')).not.toContain(selectedClassKey);
		expect(firstSetContainer.getAttribute('class')).toContain(transparentClass);

		fireEvent.click(firstSetContainer);

		await waitFor(() => {
			const currentClasses = firstSetContainer.getAttribute('class');
			expect(currentClasses).not.toBeNull();
			expect(currentClasses).toContain(selectedClassKey);
			expect(currentClasses).not.toContain(transparentClass);
		});
	});

	it('debería habilitar el botón después de seleccionar un set', () => {
		render(<SelectSetContent setsData={mockSets} onSetSelected={mockOnSetSelected} actionButton={buttonText} />);
		const button = screen.getByRole('button', { name: buttonText });
		const firstSetContainer = screen.getByTestId('set-container-101');

		expect(button).toBeDisabled();
		fireEvent.click(firstSetContainer);
		expect(button).not.toBeDisabled();
	});

	it('debería llamar a onSetSelected con el ID correcto al hacer clic en el botón', () => {
		render(<SelectSetContent setsData={mockSets} onSetSelected={mockOnSetSelected} actionButton={buttonText} />);
		const button = screen.getByRole('button', { name: buttonText });
		const secondSetContainer = screen.getByTestId('set-container-102');

		fireEvent.click(secondSetContainer);
		fireEvent.click(button);

		expect(mockOnSetSelected).toHaveBeenCalledTimes(1);
		expect(mockOnSetSelected).toHaveBeenCalledWith(102);
	});

	it('debería cambiar la selección si se hace clic en otro set', async () => {

		render(<SelectSetContent setsData={mockSets} onSetSelected={mockOnSetSelected} actionButton={buttonText} />);
		const firstSetContainer = screen.getByTestId('set-container-101');
		const secondSetContainer = screen.getByTestId('set-container-102');


		fireEvent.click(firstSetContainer);
		await waitFor(() => {
			const firstClasses = firstSetContainer.getAttribute('class');
			const secondClasses = secondSetContainer.getAttribute('class');
			expect(firstClasses).not.toBeNull();
			expect(secondClasses).not.toBeNull();
			expect(firstClasses).toContain(selectedClassKey);
			expect(firstClasses).not.toContain(transparentClass);
			expect(secondClasses).not.toContain(selectedClassKey);
			expect(secondClasses).toContain(transparentClass);
		});

		fireEvent.click(secondSetContainer);
		await waitFor(() => {
			const firstClasses = firstSetContainer.getAttribute('class');
			const secondClasses = secondSetContainer.getAttribute('class');
			expect(firstClasses).not.toBeNull();
			expect(secondClasses).not.toBeNull();
			expect(firstClasses).not.toContain(selectedClassKey);
			expect(firstClasses).toContain(transparentClass);
			expect(secondClasses).toContain(selectedClassKey);
			expect(secondClasses).not.toContain(transparentClass);
		});
	});

});