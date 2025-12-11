import { useState, useEffect } from 'react'
import {createGameService}  from '../../../services/gameService';
import GameList from './components/GameList';

function GameListContainer({wsService}) {

    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [httpService] = useState(() => createGameService());

    useEffect(() => {
        const initGames = async () => {
          try {
            setLoading(true);
            
            // Load games
            const [gamesData] = await Promise.all([
              httpService.getGames().catch(() => [])
            ]);
    
            setGames(gamesData);            
            wsService.on('gameAdd', (newGame) => {
                setGames(prev => {
                    const exists = prev.some(game => game.id === newGame.id);
                    return exists ? prev : [...prev, newGame];
                });
            });
            
            wsService.on('gameRemove', (deleteGameId) => {
                setGames(prev => prev.filter(game => game.id !== deleteGameId));
            });

            wsService.on('gameUpdate', (updatedGame) => {
              setGames(prev => prev.map(game =>
                      game.id === updatedGame.id ? { ...game, ...updatedGame } : game));
            });

          } catch (error) {
            console.error('Failed to initialize app:', error);
          } finally {
            setLoading(false);
          }
        };
        initGames();

        return () => {
          wsService.off('gameAdd');
          wsService.off('gameDelete');
          wsService.off('gameUpdate');
        };

    }, [httpService, wsService]);

    return (
        <div>
            <GameList games={games}/>
        </div>
    )
}

export default GameListContainer