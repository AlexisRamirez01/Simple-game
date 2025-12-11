import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from "@testing-library/user-event";
import PlayerForm from './PlayerForm';

vi.mock('../containers/Forms/FormContainer', () => {
  return {
    default: () => ({
      handleCreateGame: vi.fn(() => Promise.resolve())
    })
  }
}); 

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

const mockOnCreate = vi.fn();
const mockOnPlayerCreated = vi.fn();

describe('PlayerForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderizado", () => {
    it("Se muestra el titulo de crear jugador", () => {
      render(<PlayerForm/>);
      expect(screen.getByText("Crear jugador")).toBeInTheDocument();
    })
    
    it("Se muestra la etiqueta para ingresar nombre", () => {
      render(<PlayerForm/>);
      expect(screen.getByLabelText("Nombre *")).toBeInTheDocument();
    })

    it("Se muestra la etiqueta para la fecha de cumpleaños", () => {
      render(<PlayerForm/>);
      expect(screen.getByLabelText("Fecha de cumpleaños *")).toBeInTheDocument();
    })

    it("Se muestra el boton de crear jugador", () => {
      render(<PlayerForm/>);
      expect(screen.getByText("Crear!")).toBeInTheDocument();
    })

    it("Se muestra el boton de elegir avatar", () => {
      render(<PlayerForm/>);
      expect(screen.getByText("Elegir avatar")).toBeInTheDocument();
    })

    it("Se muestran todos los avatars si hago click en elegir avatar", async() => {
      render(<PlayerForm/>);

      // Chequeo que antes clickear Elegir avatar no aparezcan los avatars
      for (let i = 1; i <= 6; i++) {
        expect(screen.queryByAltText(`Avatar ${i}`)).not.toBeInTheDocument();
      }

      // Click en boton Elegir avatar
      await userEvent.click(screen.getByText("Elegir avatar"));

      for (let i = 1; i <= 6; i++) {
        expect(screen.getByAltText(`Avatar ${i}`)).toBeInTheDocument();
      }
    })
  })

  describe("Ingreso de datos", () => {
    it("No se lanzan errores si los datos son ingresados correctamente", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
      
      // Completar nombre válido
      await userEvent.type(screen.getByPlaceholderText("Ingresar nombre"), "Juan");

      // Completar fecha válida
      await userEvent.type(screen.getByLabelText("Fecha de cumpleaños *"), "25/03"); 

      // Seleccion de avatar
      await userEvent.click(screen.getByText("Elegir avatar"));
      await userEvent.click(screen.getByAltText("Avatar 3"));

      await userEvent.click(screen.getByText("Crear!"));

      expect(screen.queryByText("El nombre es requerido")).not.toBeInTheDocument();
      expect(screen.queryByText("La fecha de cumpleaños es requerida")).not.toBeInTheDocument();
      expect(screen.queryByText("La fecha ingresada no es válida")).not.toBeInTheDocument();
      expect(screen.queryByText("El avatar es requerido")).not.toBeInTheDocument();
    })

    it("Se lanza el error correspondiente si se ingresa un nombre con numeros", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
      
      const input = screen.getByLabelText("Nombre *");
      const botonCrear = screen.getByRole("button", { name: "Crear!" });

      await userEvent.type(input, "Juanceto01");
      await userEvent.click(botonCrear);

      const error = screen.queryByText("El nombre solo debe contener letras");

      expect(error).toBeInTheDocument();
      expect(mockOnCreate).toHaveBeenCalled();
    })

    it("Se lanza el error correspondiente si se ingresa un nombre con caracteres especiales", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
      
      const input = screen.getByLabelText("Nombre *");
      const botonCrear = screen.getByRole("button", { name: "Crear!" });

      await userEvent.type(input, "Ju@nceto");
      await userEvent.click(botonCrear);

      const error = screen.queryByText("El nombre solo debe contener letras");

      expect(error).toBeInTheDocument();
      expect(mockOnCreate).toHaveBeenCalled();
    })

    it("Se lanza el error correspondiente si no se completa el campo nombre", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
      
      const input = screen.getByLabelText("Nombre *");
      await userEvent.click(input);
      
      const botonCrear = screen.getByRole("button", { name: "Crear!" });
      await userEvent.click(botonCrear);

      const error = screen.queryByText("El nombre es requerido");

      expect(error).toBeInTheDocument();
      expect(mockOnCreate).toHaveBeenCalled();
    })

    it("Se lanza error correspondiente si no se completa el campo de fecha de cumpleaños", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
      
      const input = screen.getByLabelText("Fecha de cumpleaños *");
      await userEvent.click(input);
      
      const botonCrear = screen.getByRole("button", { name: "Crear!" });
      await userEvent.click(botonCrear);

      const error = screen.queryByText("La fecha de cumpleaños es requerida");

      expect(error).toBeInTheDocument();
      expect(mockOnCreate).toHaveBeenCalled();
    })

    it("Se lanza error si la fecha contiene un número de mes inválido", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
      
      // Completar fecha inválida
      await userEvent.type(screen.getByLabelText("Fecha de cumpleaños *"), "03/14"); 
      await userEvent.click(screen.getByText("Crear!"));

      expect(screen.queryByText("La fecha ingresada no es válida")).toBeInTheDocument();
    })

    it("Se lanza error si la fecha contiene un dia inválido", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
      
      // Completar fecha inválida
      await userEvent.type(screen.getByLabelText("Fecha de cumpleaños *"), "44/5"); 
      await userEvent.click(screen.getByText("Crear!"));

      expect(screen.queryByText("La fecha ingresada no es válida")).toBeInTheDocument();
    })

    it("Se lanza error si la fecha no respeta el formato adecuado", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
      
      // Completar fecha inválida
      await userEvent.type(screen.getByLabelText("Fecha de cumpleaños *"), "9-12"); 
      await userEvent.click(screen.getByText("Crear!"));

      expect(screen.queryByText("La fecha ingresada no es válida")).toBeInTheDocument();
    })

    it("Se lanza el error correspondiente si no se elige un avatar", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
    
      // Completar nombre válido
      await userEvent.type(screen.getByPlaceholderText("Ingresar nombre"), "Juan");

      // Completar fecha válida
      await userEvent.type(screen.getByLabelText("Fecha de cumpleaños *"), "2000-01-01"); 

      await userEvent.click(screen.getByText("Crear!"));

      expect(screen.queryByText("El nombre es requerido")).not.toBeInTheDocument();
      expect(screen.queryByText("La fecha de cumpleaños es requerida")).not.toBeInTheDocument();
      expect(screen.queryByText("El avatar es requerido")).toBeInTheDocument();
      expect(mockOnCreate).toHaveBeenCalled();
    })

    it("Se lanza el error correspondiente si se ingresa un nombre con más de 15 carácteres", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
      
      const input = screen.getByLabelText("Nombre *");
      const botonCrear = screen.getByRole("button", { name: "Crear!" });

      await userEvent.type(input, "Jugador de JamafMeRendiré");
      await userEvent.click(botonCrear);

      const error = screen.queryByText("El nombre debe contener 15 carácteres o menos");

      expect(error).toBeInTheDocument();
      expect(mockOnCreate).toHaveBeenCalled();
    })
    
    it("Se lanzan los errores correspondientes si todos los campos estan vacios", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
      
      await userEvent.click(screen.getByText("Crear!"));

      expect(screen.queryByText("El nombre es requerido")).toBeInTheDocument();
      expect(screen.queryByText("La fecha de cumpleaños es requerida")).toBeInTheDocument();
      expect(screen.queryByText("El avatar es requerido")).toBeInTheDocument();
      expect(mockOnCreate).toHaveBeenCalled();
    })
    
    it("Se lanzan los errores correspondientes si el nombre es invalido y la fecha esta vacia", async() => {
      render(<PlayerForm onCreate={mockOnCreate} onPlayerCreated={mockOnPlayerCreated}/>);
      
      // Completar nombre inválido
      await userEvent.type(screen.getByPlaceholderText("Ingresar nombre"), "Juan2025");

      // Seleccion de avatar
      await userEvent.click(screen.getByText("Elegir avatar"));
      await userEvent.click(screen.getByAltText("Avatar 3"));

      await userEvent.click(screen.getByText("Crear!"));

      expect(screen.queryByText("El nombre solo debe contener letras")).toBeInTheDocument();
      expect(screen.queryByText("La fecha de cumpleaños es requerida")).toBeInTheDocument();
      expect(screen.queryByText("El avatar es requerido")).not.toBeInTheDocument();
      expect(mockOnCreate).toHaveBeenCalled();
    })
  })
})
