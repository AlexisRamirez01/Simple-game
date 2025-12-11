import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from "@testing-library/user-event";
import GameForm from './GameForm';

vi.mock('../containers/Forms/FormContainer', () => {
  return {
    default: () => ({
      handleCreateGame: vi.fn(() => Promise.resolve())
    })
  };
});

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('GameForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderizado", () => {
    it("Se muestra el titulo de crear partida", () => {
      render(<GameForm />);
      expect(screen.getByText("Crear partida")).toBeInTheDocument();
    });

    it("Se muestra la etiqueta para ingresar el nombre de partida", () => {
      render(<GameForm />);
      expect(screen.getByLabelText("Nombre de partida *")).toBeInTheDocument();
    });

    it("Se muestra la etiqueta para ingresar la cantidad minima de jugadores", () => {
      render(<GameForm />);
      expect(screen.getByLabelText("Mínima cantidad de jugadores *")).toBeInTheDocument();
    });

    it("Se muestra la etiqueta para ingresar la cantidad maxima de jugadores", () => {
      render(<GameForm />);
      expect(screen.getByText("Máxima cantidad de jugadores *")).toBeInTheDocument();
    });

    it("Se mantiene deshabilitado el boton 'Crear' si no se crea jugador", () => {
      render(<GameForm />);
      const createPlayer = screen.getByRole("button", { name: "Crear jugador" });
      expect(createPlayer).toBeEnabled();

      const createGame = screen.getByRole("button", { name: "Crear" });
      expect(createGame).not.toBeEnabled();
    });

    it("Se habilita inicialmente el boton 'Crear jugador", () => {
      render(<GameForm />);
      const createPlayer = screen.getByRole("button", { name: "Crear jugador" });
      expect(createPlayer).toBeEnabled();
    });

    it("Se muestra el formulario de creacion de jugador al clickear sobre el boton 'Crear jugador'", async () => {
      render(<GameForm />);
      const createPlayer = screen.getByRole("button", { name: "Crear jugador" });
      await userEvent.click(createPlayer);

      expect(screen.getByLabelText("Nombre *")).toBeInTheDocument();
      expect(screen.getByLabelText("Fecha de cumpleaños *")).toBeInTheDocument();
      expect(screen.getByText("Crear!")).toBeInTheDocument();
      expect(screen.getByText("Elegir avatar")).toBeInTheDocument();
    });
  });

  describe("Ingreso de datos", () => {
    it("Se lanza error si se ingresa nombre de partida con numeros", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      await userEvent.type(screen.getByLabelText("Nombre de partida *"), "Partida de JamafMeRendir3");
      fireEvent.click(screen.getByText("Crear"));
      expect(screen.queryByText("El nombre solo debe contener letras")).toBeInTheDocument();
    });

    it("Se lanza error si se ingresa nombre de partida con caracteres especiales", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      await userEvent.type(screen.getByLabelText("Nombre de partida *"), "Partida de JamafMeRendire!");
      fireEvent.click(screen.getByText("Crear"));
      expect(screen.queryByText("El nombre solo debe contener letras")).toBeInTheDocument();
    });

    it("Se lanza error si no se ingresa un numero entre 2 y 6 en la entrada 'Mínima cantidad de jugadores'", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      await userEvent.type(screen.getByLabelText("Mínima cantidad de jugadores *"), "9");
      fireEvent.click(screen.getByText("Crear"));
      expect(screen.queryByText("La cantidad de jugadores debe ser un número, entre 2 y 6")).toBeInTheDocument();
    });

    it("Se lanza error si no se ingresa un numero en la entrada 'Mínima cantidad de jugadores'", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      await userEvent.type(screen.getByLabelText("Mínima cantidad de jugadores *"), "a");
      fireEvent.click(screen.getByText("Crear"));
      expect(screen.queryByText("La cantidad de jugadores debe ser un número, entre 2 y 6")).toBeInTheDocument();
    });

    it("Se lanza error si no se ingresa un numero entre 2 y 6 en la entrada 'Máxima cantidad de jugadores'", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      await userEvent.type(screen.getByLabelText("Máxima cantidad de jugadores *"), "9");
      fireEvent.click(screen.getByText("Crear"));
      expect(screen.queryByText("La cantidad de jugadores debe ser un número, entre 2 y 6")).toBeInTheDocument();
    });

    it("Se lanza error si no se ingresa un numero en la entrada 'Máxima cantidad de jugadores'", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      await userEvent.type(screen.getByLabelText("Máxima cantidad de jugadores *"), "a");
      fireEvent.click(screen.getByText("Crear"));
      expect(screen.queryByText("La cantidad de jugadores debe ser un número, entre 2 y 6")).toBeInTheDocument();
    });

    it("Se lanza error en las entradas 'Mínima cantidad de jugadores' y 'Máxima cantidad de jugadores' si la mínima supera la máxima", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      fireEvent.change(screen.getByLabelText("Mínima cantidad de jugadores *"), { target: { value: "4" } });
      fireEvent.change(screen.getByLabelText("Máxima cantidad de jugadores *"), { target: { value: "2" } });
      fireEvent.click(screen.getByText("Crear"));

      expect(screen.queryByText("La cantidad de jugadores mínima debe ser menor a la máxima")).toBeInTheDocument();
      expect(screen.queryByText("La cantidad de jugadores máxima debe ser mayor a la mínima")).toBeInTheDocument();
    });

    it("Se lanza error si no se completa la entrada 'Nombre de partida'", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      fireEvent.change(screen.getByLabelText("Mínima cantidad de jugadores *"), { target: { value: "3" } });
      fireEvent.change(screen.getByLabelText("Máxima cantidad de jugadores *"), { target: { value: "4" } });
      fireEvent.click(screen.getByText("Crear"));
      expect(screen.queryByText("El nombre es requerido")).toBeInTheDocument();
    });

    it("Se lanza error si no se completa la entrada 'Mínima cantidad de jugadores'", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      fireEvent.change(screen.getByLabelText("Nombre de partida *"), { target: { value: "hola mundo" } });
      fireEvent.change(screen.getByLabelText("Máxima cantidad de jugadores *"), { target: { value: "4" } });
      fireEvent.click(screen.getByText("Crear"));
      expect(screen.queryByText("La cantidad de jugadores mínima es requerida")).toBeInTheDocument();
    });

    it("Se lanza error si no se completa la entrada 'Máxima cantidad de jugadores'", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      await userEvent.type(screen.getByLabelText("Nombre de partida *"), "yo vi a River campeon de la libertadores");
      await userEvent.type(screen.getByLabelText("Mínima cantidad de jugadores *"), "4");
      await userEvent.click(screen.getByText("Crear"));
      expect(screen.queryByText("La cantidad de jugadores máxima es requerida")).toBeInTheDocument();
    });

    it("Se lanza error si se ingresa nombre de partida con mas de 15 carácteres", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      await userEvent.type(screen.getByLabelText("Nombre de partida *"), "Partida de JamafMeRendire");
      fireEvent.click(screen.getByText("Crear"));
      expect(screen.queryByText("El nombre debe contener 15 carácteres o menos")).toBeInTheDocument();
    });

    it("Se lanzan los correspondientes errores si no se completan ninguna de las entradas", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      await userEvent.click(screen.getByText("Crear"));
      expect(screen.queryByText("El nombre es requerido")).toBeInTheDocument();
      expect(screen.queryByText("La cantidad de jugadores mínima es requerida")).toBeInTheDocument();
      expect(screen.queryByText("La cantidad de jugadores máxima es requerida")).toBeInTheDocument();
    });

    it("No se lanzan errores si se completan todas las entradas correctamente", async () => {
      render(<GameForm initialPlayerCreated={true} />);
      await userEvent.type(screen.getByLabelText("Nombre de partida *"), "River papá de boca");
      await userEvent.type(screen.getByLabelText("Mínima cantidad de jugadores *"), "4");
      await userEvent.type(screen.getByLabelText("Máxima cantidad de jugadores *"), "6");
      await userEvent.click(screen.getByText("Crear"));

      expect(screen.queryByText("El nombre es requerido")).not.toBeInTheDocument();
      expect(screen.queryByText("La cantidad de jugadores mínima es requerida")).not.toBeInTheDocument();
      expect(screen.queryByText("La cantidad de jugadores máxima es requerida")).not.toBeInTheDocument();
    });
  });
});
