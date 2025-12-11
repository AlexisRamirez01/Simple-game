import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerHand from '../components/PlayerHand';
import { useGameLock } from '../context/GameLogicContext';

vi.mock('../context/GameLogicContext', () => ({
  useGameLock: vi.fn(),
}));

vi.mock('./Cards', () => ({
  __esModule: true,
  default: vi.fn(({ isMiniSetView }) => (
    <div data-testid={isMiniSetView ? "expanded-cards-component" : "hand-cards-component"} />
  )),
}));
vi.mock('./Card', () => ({
  __esModule: true,
  default: vi.fn(({ image, className }) => (
    <div data-testid="card-component" className={className}>
      {image}
    </div>
  )),
}));

const mockCards = [
  { id: 'c1', name: 'Card 1', image_url: 'img1.jpg' },
];

const mockDetectivesSet = [
  {
    set_id: 's1',
    cards: [
      { id: 'dc1', image_url: 'det_img1.jpg' },
      { id: 'dc2', image_url: 'det_img2.jpg' },
    ],
  },
];

const defaultProps = {
  cards: mockCards,
  onSelectCard: vi.fn(),
  selectedCardId: null,
  areMySecrets: true,
  animatedCards: [],
  onDiscard: vi.fn(),
  canDiscard: false,
  onRestock: vi.fn(),
  canRestock: false,
  isRestocking: false,
  onPassTurn: vi.fn(),
  isMyTurn: true,
  canPassTurn: false,
  canPlaySet: false,
  canLowerDetective: false,
  canPlayEvent: false,
  canPerformPrimary: false,
  onDetectiveSet: vi.fn(),
  hasOliver: false,
  detectivesSet: mockDetectivesSet,
  onPlayEventTest: vi.fn(),
  onPlayDetective: vi.fn(),
  wasPlayedSet: false,
  isSocialDisgracee: false,
};

const renderComponent = (props = {}) => {
  Object.values(defaultProps).forEach(prop => {
    if (typeof prop === 'function') prop.mockClear();
  });
  return render(<PlayerHand {...defaultProps} {...props} />);
};

describe('PlayerHand Component', () => {
  beforeEach(() => {
    useGameLock.mockReturnValue({ isLocked: false, stringLock: '' });
  });

  it('Renderiza el componente Cards para la mano principal', () => {
    renderComponent();
    expect(screen.getByTestId('hand-cards-component')).toBeInTheDocument();
  });

  it('Renderiza los sets de detectives', () => {
    renderComponent();
    const detectiveCard = screen.getByText('det_img1.jpg');
    expect(detectiveCard).toBeInTheDocument();
  });

  it('Muestra el mensaje de bloqueo cuando isLocked es true', () => {
    useGameLock.mockReturnValue({ isLocked: true, stringLock: 'Turno Oponente' });
    renderComponent();
    expect(screen.getByText('Turno Oponente')).toBeInTheDocument();
    expect(screen.queryByText('Jugar Set')).not.toBeInTheDocument();
  });

  it('Muestra el mensaje por defecto cuando isLocked es true pero stringLock está vacío', () => {
    useGameLock.mockReturnValue({ isLocked: true, stringLock: '' });
    renderComponent();
    expect(screen.getByText('ESPERANDO ACCIÓN')).toBeInTheDocument();
  });


  it('Ejecuta onMouseDown para expandir el set de detectives', () => {
    renderComponent();
    const setContainer = screen.getByText('det_img1.jpg').closest('.relative.cursor-pointer');
    
    fireEvent.mouseDown(setContainer);
    
    const expandedCards = screen.getByTestId('expanded-cards-component');
    expect(expandedCards).toBeInTheDocument();
  });

  it('Ejecuta onMouseUp para contraer el set de detectives (Function Cover)', () => {
    renderComponent();
    const setContainer = screen.getByText('det_img1.jpg').closest('.relative.cursor-pointer');
    
    fireEvent.mouseDown(setContainer);
    fireEvent.mouseUp(setContainer);
    
    expect(screen.queryByTestId('expanded-cards-component')).not.toBeInTheDocument();
  });

  it('Ejecuta onMouseLeave para contraer el set de detectives (Function Cover)', () => {
    renderComponent();
    const setContainer = screen.getByText('det_img1.jpg').closest('.relative.cursor-pointer');
    
    fireEvent.mouseDown(setContainer);
    fireEvent.mouseLeave(setContainer);
    
    expect(screen.queryByTestId('expanded-cards-component')).not.toBeInTheDocument();
  });

  describe('Llamadas de funciones y lógica de habilitación/deshabilitación', () => {
    it('Jugar Set: Habilita y llama a onDetectiveSet', () => {
      renderComponent({ canPlaySet: true, canPerformPrimary: true });
      fireEvent.click(screen.getByText('Jugar Set'));
      expect(defaultProps.onDetectiveSet).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Jugar Set')).toHaveClass('bg-green-600');
    });

    it('Jugar Set: Deshabilita por wasPlayedSet (Rama 1)', () => {
      renderComponent({ canPlaySet: true, canPerformPrimary: true, wasPlayedSet: true });
      expect(screen.getByText('Jugar Set')).toBeDisabled();
      // Debe seguir siendo verde si canPerformPrimary es true
      expect(screen.getByText('Jugar Set')).toHaveClass('bg-green-600'); 
    });

    it('Jugar Set: Deshabilita y usa color gris por isSocialDisgracee (Rama 2 & 3)', () => {
      renderComponent({ canPlaySet: true, canPerformPrimary: true, isSocialDisgracee: true });
      expect(screen.getByText('Jugar Set')).toBeDisabled();
      // La rama del className se fuerza a gris
      expect(screen.getByText('Jugar Set')).toHaveClass('bg-gray-400');
    });

    it('Jugar Set: Usa color gris por canPerformPrimary=false (Rama 4)', () => {
      renderComponent({ canPlaySet: true, canPerformPrimary: false });
      expect(screen.getByText('Jugar Set')).toBeEnabled(); // No está deshabilitado por las props de disabled
      expect(screen.getByText('Jugar Set')).toHaveClass('bg-gray-400');
    });

    it('Bajar Detective: Habilita y llama a onPlayDetective', () => {
      renderComponent({ canLowerDetective: true, canPerformPrimary: true });
      fireEvent.click(screen.getByText('Bajar Detective'));
      expect(defaultProps.onPlayDetective).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Bajar Detective')).toHaveClass('bg-green-600');
    });

    it('Bajar Detective: Deshabilita y usa color gris por isSocialDisgracee (Rama 1 & 2)', () => {
      renderComponent({ canLowerDetective: true, canPerformPrimary: true, isSocialDisgracee: true });
      expect(screen.getByText('Bajar Detective')).toBeDisabled();
      expect(screen.getByText('Bajar Detective')).toHaveClass('bg-gray-400');
    });
    
    it('Jugar Evento: Habilita y llama a onPlayEventTest', () => {
      renderComponent({ canPlayEvent: true, canPerformPrimary: true });
      fireEvent.click(screen.getByText('Jugar Evento'));
      expect(defaultProps.onPlayEventTest).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Jugar Evento')).toHaveClass('bg-green-600');
    });
    
    it('Jugar Evento: Usa color gris por canPerformPrimary=false (Rama 1)', () => {
      renderComponent({ canPlayEvent: true, canPerformPrimary: false });
      expect(screen.getByText('Jugar Evento')).toHaveClass('bg-gray-400');
    });

    it('Pasar Turno: Habilita y llama a onPassTurn', () => {
      renderComponent({ canPassTurn: true });
      fireEvent.click(screen.getByText('Pasar Turno'));
      expect(defaultProps.onPassTurn).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Pasar Turno')).toHaveClass('bg-red-600');
    });

    it('Pasar Turno: Deshabilita cuando canPassTurn es false (Rama 1)', () => {
      renderComponent({ canPassTurn: false });
      expect(screen.getByText('Pasar Turno')).toBeDisabled();
      expect(screen.getByText('Pasar Turno')).toHaveClass('bg-gray-400');
    });

    it('Descartar carta: Habilita y llama a onDiscard', () => {
      renderComponent({ canDiscard: true });
      fireEvent.click(screen.getByText('Descartar carta'));
      expect(defaultProps.onDiscard).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Descartar carta')).toHaveClass('bg-red-600');
    });
    
    it('Descartar carta: Deshabilita cuando canDiscard es false (Rama 1)', () => {
      renderComponent({ canDiscard: false });
      expect(screen.getByText('Descartar carta')).toBeDisabled();
      expect(screen.getByText('Descartar carta')).toHaveClass('bg-gray-400');
    });

    it('Reponer carta: Habilita y llama a onRestock', () => {
      renderComponent({ canRestock: true, isRestocking: false });
      fireEvent.click(screen.getByText('Reponer carta'));
      expect(defaultProps.onRestock).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Reponer carta')).toHaveClass('bg-red-600');
    });

    it('Reponer carta: Deshabilita cuando isRestocking es true (Rama 1 & 2)', () => {
      renderComponent({ canRestock: true, isRestocking: true });
      const button = screen.getByText('Reponiendo...');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('bg-gray-400');
    });
  });
});