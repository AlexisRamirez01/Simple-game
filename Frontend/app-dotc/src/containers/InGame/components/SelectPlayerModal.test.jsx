import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SelectPlayer } from './SelectPlayerModal';

vi.mock('./PlayerAvatar', () => ({
  default: ({ player, onClick, isSelected }) => (
    <div
      data-testid={`avatar-${player.id}`} 
      data-selected={isSelected}            
      onClick={onClick}                     
    >
      {player.name}
    </div>
  ),
}));

const mockPlayers = [
  { id: 1, name: 'Pikachu' },
  { id: 2, name: 'Agustin' },
  { id: 3, name: 'Stitch' },
];

const mockOnSelectPlayer = vi.fn();

describe('SelectPlayer Component', () => {

  beforeEach(() => {
    mockOnSelectPlayer.mockClear();
  });


  it('no debería renderizar nada si isOpen es false', () => {

    const { container } = render(
      <SelectPlayer
        isOpen={false}
        players={mockPlayers}
        onSelectPlayer={mockOnSelectPlayer}
      />
    );

    expect(container.firstChild).toBeNull();
  });


  it('debería renderizar el modal y el texto "Debes seleccionar" al abrirse', () => {
    render(
      <SelectPlayer
        isOpen={true}
        players={mockPlayers}
        onSelectPlayer={mockOnSelectPlayer}
      />
    );

    expect(screen.getByText('Elige un jugador')).toBeInTheDocument();
    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.getByText('Agustin')).toBeInTheDocument();
    expect(screen.getByText('Debes seleccionar un jugador')).toBeInTheDocument();
    expect(screen.queryByText('Elegir jugador')).not.toBeInTheDocument();
  });


  it('debería mostrar el botón de confirmar y actualizar estilos al seleccionar un jugador', () => {
    render(
      <SelectPlayer
        isOpen={true}
        players={mockPlayers}
        onSelectPlayer={mockOnSelectPlayer}
      />
    );

    const agustinAvatar = screen.getByTestId('avatar-2');
    fireEvent.click(agustinAvatar);

    expect(screen.queryByText('Debes seleccionar un jugador')).not.toBeInTheDocument();
    expect(screen.getByText('Elegir jugador')).toBeInTheDocument();
    expect(agustinAvatar.parentElement).toHaveClass('opacity-100', 'scale-110');
    expect(screen.getByTestId('avatar-1').parentElement).toHaveClass('opacity-40');
    expect(screen.getByTestId('avatar-3').parentElement).toHaveClass('opacity-40');
  });


  it('debería llamar a onSelectPlayer con el ID correcto al confirmar', () => {
    render(
      <SelectPlayer
        isOpen={true}
        players={mockPlayers}
        onSelectPlayer={mockOnSelectPlayer}
      />
    );

    fireEvent.click(screen.getByTestId('avatar-2'));

    fireEvent.click(screen.getByText('Elegir jugador'));

    expect(mockOnSelectPlayer).toHaveBeenCalledTimes(1);
    expect(mockOnSelectPlayer).toHaveBeenCalledWith(2);
  });


  it('debería resetear el estado interno después de la selección', () => {
    render(
      <SelectPlayer
        isOpen={true}
        players={mockPlayers}
        onSelectPlayer={mockOnSelectPlayer}
      />
    );

    fireEvent.click(screen.getByTestId('avatar-2'));

    fireEvent.click(screen.getByText('Elegir jugador'));

    expect(screen.queryByText('Elegir jugador')).not.toBeInTheDocument();
    expect(screen.getByText('Debes seleccionar un jugador')).toBeInTheDocument();
  });
  
  
  it('debería renderizarse correctamente sin jugadores', () => {
    render(
      <SelectPlayer
        isOpen={true}
        onSelectPlayer={mockOnSelectPlayer}
      />
    );
    
    expect(screen.queryByTestId(/avatar-/)).not.toBeInTheDocument();
    
    expect(screen.getByText('Debes seleccionar un jugador')).toBeInTheDocument();
  });
});
