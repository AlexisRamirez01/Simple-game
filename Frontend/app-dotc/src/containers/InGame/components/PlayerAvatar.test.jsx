import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PlayerAvatar from './PlayerAvatar';

const mockPlayer = {
  id: 10,
  name: 'Agustin Reyna',
  avatar: 'goku.png'
};

const mockOnClick = vi.fn();

describe('PlayerAvatar Component', () => {

  beforeEach(() => {
    mockOnClick.mockClear();
  });


  it('debería renderizar el nombre y el avatar del jugador', () => {
    render(<PlayerAvatar player={mockPlayer} />);

    expect(screen.getByText('Agustin Reyna')).toBeInTheDocument();

    const img = screen.getByAltText('Agustin Reyna avatar');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'goku.png');
  });


  it('debería llamar a la función onClick al ser presionado', () => {
    render(<PlayerAvatar player={mockPlayer} onClick={mockOnClick} />);

    fireEvent.click(screen.getByTitle('Agustin Reyna'));

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });


  it('debería mostrar el anillo verde si isSelected es true', () => {
    render(<PlayerAvatar player={mockPlayer} isSelected={true} />);
    
    expect(screen.getByTitle('Agustin Reyna')).toHaveClass('ring-green-500');
  });


  it('debería mostrar el anillo verde si es el turno del jugador (y no está seleccionado)', () => {
    render(
      <PlayerAvatar
        player={mockPlayer}
        isSelected={false} 
        turnPlayerId={10}    
      />
    );
    
    expect(screen.getByTitle('Agustin Reyna')).toHaveClass('ring-green-500');
  });


  it('debería mostrar el anillo gris por defecto (ni seleccionado, ni es su turno)', () => {
    render(
      <PlayerAvatar
        player={mockPlayer}
        isSelected={false} 
        turnPlayerId={99}   
      />
    );
    
    expect(screen.getByTitle('Agustin Reyna')).toHaveClass('ring-gray-500');
  });


  it('debería ocultar la imagen si la URL falla (onError)', () => {
    render(<PlayerAvatar player={mockPlayer} />);

    const img = screen.getByAltText('Agustin Reyna avatar');
    
    fireEvent.error(img);

    expect(img.style.display).toBe('none');
  });
});