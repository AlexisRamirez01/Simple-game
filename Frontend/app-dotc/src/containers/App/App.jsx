import './App.css';
import Home from "../Home/Home";
import { useState, useEffect } from 'react';
import { Route, Routes, } from 'react-router-dom';

import Lobby from "../Lobby/Lobby"
import createWSService from '../../services/WSService';
import PlayerForm from '../../components/PlayerForm';
import GameForm from '../../components/GameForm';
import GameInterfaceContainer from '../InGame/GameInterfaceContainer';
import { NotificationProvider } from '../../components/NotificationContext';

function App() {

	const [loading, setLoading] = useState(true);
	const [wsService] = useState(() => createWSService());
	useEffect(() => {
		const init = async () => {
			try {
				setLoading(true);
				if (wsService.isConnected()) {
					console.warn('WebSocket is already connected. Reusing existing connection.');
				} else {
					wsService.connect();
				}
			} catch (error) {
			console.error('Failed to initialize app:', error);
			} finally {
			setLoading(false);
			}
		};
		init();
		return () => {
			wsService.disconnect();
		};
	}, [wsService]);

	return( 
		<div>
			<NotificationProvider>
				<Routes>
					<Route path='/' element={<Home wsService={wsService}/>}/>
					<Route path='/FormGame' element={<GameForm/>}/>
					<Route path='/FormPlayer/:id' element={<PlayerForm/>} />
					<Route path='/lobby/:game_id/:player_id' element={<Lobby />} />
					<Route path='/in_game/:game_id/:player_id' element={<GameInterfaceContainer />} />
				</Routes>
			</NotificationProvider>
		</div>
	)}

export default App;