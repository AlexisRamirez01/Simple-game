import ClockSVG from "../../components/ClockSVG.jsx";
import background from "../../assets/Home-background.png";
import title from "../../assets/Home-title.png";
import useLobby from "./useLobby.js";


function Lobby( { setGameContextValue }) {
  const { game, players, isHost, startGame} = useLobby(setGameContextValue);

  return (
    <div
      className="h-screen w-screen relative flex flex-col items-center justify-center text-white"
      style={{
        backgroundImage: `url(${background})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Imagen del título */}
      <img
        src={title}
        alt="Title"
        className="absolute top-9 w-3/4 sm:w-3/4 md:w-1/2 lg:w-2/4 max-w-3xl object-contain"
      />
      {/* Contenedor central del lobby */}
      <div className="mt-28 w-full flex justify-center px-4 md:px-10 z-10">
        <div className="relative w-full max-w-3xl flex flex-col items-center">
          {/* Recuadro gris con contador de jugadores */}
          <div className="w-full min-h-[50vh] md:min-h-[40vh] bg-gray-800/60 rounded-xl p-6 md:p-10 flex flex-col items-center justify-center">
            {/* Contador de jugadores */}
            <p className="text-2xl md:text-3xl font-semibold text-center text-white mb-4">
              Jugadores en la sala: {players.length}
            </p>

            {players.length < game?.max_players ? (
              <p className="mt-2 text-lg md:text-xl text-yellow-300 animate-pulse">
                Esperando a más jugadores...
              </p>
            ) : (
              <p className="mt-2 text-lg md:text-xl text-green-400">
                ¡Todo Listo!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reloj */}
      <div className="absolute bottom-28 right-330 w-40 h-40 md:w-36 md:h-36 scale-85">
        <ClockSVG
          players={players.length || 0}
          maxPlayers={game?.max_players || 6}
        />
      </div>

      {/* Botón del host */}
      {isHost ? (
        <button
          disabled={players.length < game?.min_players}
          onClick={() => startGame()}
          className={`
            absolute bottom-20 right-20 px-6 py-6 rounded-2xl shadow-lg text-lg font-semibold text-white
            ${players.length >= game?.min_players
              ? "bg-red-600 hover:bg-red-600 cursor-pointer"
              : "bg-red-800 cursor-not-allowed"
            }
          `}
        >
          Iniciar partida
        </button>
      ) : (
        <p className="absolute bottom-20 right-20 text-lg font-semibold text-white animate-pulse">
          Esperando a que el anfitrión inicie la partida
        </p>
      )}
      
    </div>
  );
}

export default Lobby;

