import {createPlayerService} from '../../services/playerService';
import { createGamePlayerService } from '../../services/gamePlayerService';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {createGameService} from '../../services/gameService';

function GamePlayerFormContainer() {
  const [httpServiceGame] = useState(() => createGameService());
  const [httpServicePlayer] = useState(() => createPlayerService());
  const [httpServiceGamePlayer] = useState(() => createGamePlayerService());

  const handleCreate = async ({ gameData, playerData, game_id }) => {
    try {
      let finalGameId = game_id;
      let is_Owner = false
      if (!finalGameId && gameData) {
        const game = await httpServiceGame.createGame(gameData);
        is_Owner = true;
        finalGameId = game.id;
      }


      const player = await httpServicePlayer.createPlayer({...playerData, is_Owner: is_Owner});
      const existingGameData = await httpServiceGame.getGameById(finalGameId);

      await httpServiceGame.updateGame(
                            finalGameId, {...existingGameData, 
                            current_players: existingGameData.current_players + 1 })
                            
      await httpServiceGamePlayer.createGamePlayer(finalGameId, player.id, {room_id: finalGameId});
      return { game_id: finalGameId, player_id: player.id };
    } catch (err) {
      console.error("Error creando game/player:", err);
      throw err;
    }
  };

  return { handleCreate };
}

export default GamePlayerFormContainer