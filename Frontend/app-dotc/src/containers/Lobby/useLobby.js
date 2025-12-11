import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { createPlayerService } from "../../services/playerService";
import { createGameService } from "../../services/gameService";
import  createWSService  from "../../services/WSService";
import { createGamePlayerService} from "../../services/gamePlayerService";
import { useNavigate } from "react-router-dom";

const useLobby = () => {
    const { game_id, player_id } = useParams();
    const [game, setGame] = useState(null);
    const [connected, setConnected] = useState(false);
    const [isHost, setIsHost] = useState(false);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [players, setPlayers] = useState([]);
    const [wsInstance] = useState(() => createWSService(game_id));

    const navigate = useNavigate();
    const gameService = createGameService();
    const playerService = createPlayerService();
    const gameplayerService = createGamePlayerService();

    const startGame = async () => {
        try {
            const startGame = {...game, is_started:true}
            console.log(startGame)
            await gameService.startGame(game_id, startGame, {room_id: game_id});
        } catch (error) {
            console.error("Error iniciando partida:", error);
        }
    };

    useEffect(() =>{
        const init = async () => {
            try{
                const game = await gameService.getGameById(game_id, {room_id: game_id});
                const playersList = await gameplayerService.getGamePlayers(game_id, {room_id: game_id});
                const playerOwner = await playerService.getPlayerById(player_id, {room_id: game_id});
                
                setIsHost(playerOwner.is_Owner)
                setPlayers(playersList);
                setGame(game);

                wsInstance.connect();

                wsInstance.on("gamePlayerAdd", (data) => {
                    setPlayers(prev => {
                        const exists = prev.some(player => player.id === data.id);
                        return exists ? prev : [...prev, data];});
                });

                wsInstance.on("gameStartGame", (data) => {
                    if (data) {
                        navigate(`/in_game/${game_id}/${player_id}`);
                    }
                });

                wsInstance.on("connect", () => setConnected(true));
                wsInstance.on("disconnect", () => setConnected(false));

            }catch(error){
                console.error("Error inicializando lobby:", error);
            }
        };

        init();

        return () => wsInstance.disconnect();
    }, [wsInstance, game_id]);

    return { game, players, connected, isHost, currentPlayer, player_id, startGame};
};

export default useLobby;
