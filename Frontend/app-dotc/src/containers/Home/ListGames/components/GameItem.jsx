import { useNavigate } from "react-router-dom";

function GameItem({game}) {
    const navigate = useNavigate()
    return (
        <div
            key={game.id}
            className="flex flex-col justify-between bg-gray-800/70 hover:bg-gray-700/70 transition-colors rounded-xl p-4 md:p-6 shadow-md">
            <div className="flex justify-between items-start">
                <h3 className="text-white font-bold text-lg md:text-xl">{game.name}</h3>
                <span className="text-gray-300 text-sm md:text-base">
                    {game.current_players}/{game.max_players} jugadores
                </span>
            </div>
            <div className="flex justify-between items-center mt-4">
                <span
                    className={`font-semibold text-sm md:text-base ${
                    game.is_started ? "text-red-500" : "text-green-500"
                    }`}
                >
                    {game.is_started ? "En curso" : "Disponible"}
                </span>
                <button
                    onClick={() => navigate(`/FormPlayer/${game.id}`)}
                    disabled={game.is_started || game.current_players >= game.max_players}
                    className={`px-4 py-2 rounded-2xl text-white font-medium text-sm md:text-base
                        ${(game.is_started || game.current_players >= game.max_players)
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-800"}`}
                    >
                    Unirse
                </button>
            </div>
        </div>
  )
}

export default GameItem