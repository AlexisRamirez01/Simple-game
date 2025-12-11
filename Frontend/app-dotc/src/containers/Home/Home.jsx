import background from "../../assets/Home-background.png";
import title from "../../assets/Home-title.png";
import { useNavigate } from "react-router-dom";
import GameListContainer from "./ListGames/GameListContainer";

function Home({wsService}) {
  const navigate = useNavigate(); 
  return (
    <div
      data-testid="home-bg"
      className="min-h-screen w-screen flex flex-col items-center justify-start"
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
        className="mt-9 w-2/3 md:w-1/2 lg:w-1/3 max-w-2xl object-contain"
      />

      {/* Contenedor principal */}
      <div className="mt-8 h-full w-full flex justify-center px-4 md:px-10">
        <div className="w-full max-w-3xl flex flex-col md:items-end md:justify-end">
          {/* Caja de partidas */}
          <div className="w-full h-[55vh] bg-gray-800/60 rounded-xl p-6 md:p-10 flex flex-col">
            {/* Contenedor scrollable */}
            <div className="flex-1 overflow-y-auto">
              <GameListContainer wsService={wsService}/>
            </div>
          </div>

          {/* Botón responsivo */}
          <button
            onClick={() => navigate("/FormGame")}
            className="
              mt-4 md:mt-6
              px-7 py-3 bg-red-600 hover:bg-red-800 rounded-2xl shadow-lg 
              text-lg font-semibold text-white
            "
          >
            Crear partida
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;