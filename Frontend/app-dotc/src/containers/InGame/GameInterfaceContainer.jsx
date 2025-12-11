import React from 'react'
import { useState, useEffect, useRef } from 'react';
import background from "../../assets/Home-background.png";
import GameInterface from './GameInterface'
import { useParams } from 'react-router-dom'
import createWSService from "../../services/WSService";
import { createPlayerCardService } from '../../services/playerCardService'
import { createGamePlayerService } from '../../services/gamePlayerService';
import { createPlayerService } from '../../services/playerService'
import { createSecretCardService } from '../../services/secretCardService';
import { createGameService } from '../../services/gameService';
import { createDetectiveSetService } from '../../services/detectiveSetService';
import { getAmountCardsOnDeck, getCardOnDiscardTop, getDraftCards } from './DeckInterfaceHandler';
import { useNotification } from '../../components/NotificationContext';
import card_back from "../../assets/card_back.png";
import secret_front from "../../assets/secret_front.png";
import GameOverModal from './components/GameOverModal';
import Card from './components/Card';
import Cards from './components/Cards';

function GameInterfaceContainer() {

	const { game_id, player_id } = useParams();
	const { showNotification } = useNotification()

	const [httpServicePlayerCard] = useState(() => createPlayerCardService());
	const [httpServicePlayerGame] = useState(() => createGamePlayerService());
	const [httpServicePlayer] = useState(() => createPlayerService())
	const [httpServiceSecretCards] = useState(() => createSecretCardService())
	const [httpServiceGame] = useState(() => createGameService());
	const [httpServiceSetDetective] = useState(() => createDetectiveSetService());
	const [turnPlayerId, setTurnPlayerId] = useState(0)
	const [playerRole, setPlayerRole] = useState([])
	const [cards, setCards] = useState([]);
	const [mySecrets, setMySecrets] = useState([]);
	const [draftCards, setDraftCards] = useState([]);
	const [playersData, setPlayersData] = useState({})
	const [players, setPlayers] = useState({})
	const [secretCards, setSecretCards] = useState([])
	const [viewingOpponentSets, setViewingOpponentSets] = useState([]);
	const [myPlayerSets, setMyPlayerSets] = useState([]);
	const [isSocialDisgracee, setIsSocialDisgracee] = useState(false);

	const [loading, setLoading] = useState(true);
	const [wsInstance] = useState(() => createWSService(game_id));

	const [drawCount, setDrawCount] = useState(0);
	const [discardCount, setDiscardCount] = useState(0);
	const [imageDiscardTop, setImageDiscardTop] = useState();
	const [victoryCondition, setVictoryCondition] = useState(null);
	const [stateModal, setStateModal] = useState("");

	const didInit = useRef(false);

	const handleSocialDisgraceStatus = async (player_id, game_id, setIsSocialDisgracee) => {
		const playerSecrets = await httpServiceSecretCards.getSecretCardByPlayer(player_id, { room_id: game_id });
		const allRevealed = playerSecrets.every(secret => secret.is_revealed);
		const player = await httpServicePlayer.getPlayerById(player_id, { room_id: game_id });

		const updatedPlayer = {
			name: player.name,
			birthdate: player.birthdate.split("T")[0],
			avatar: player.avatar,
			is_Social_Disgrace: allRevealed,
			is_Your_Turn: player.is_Your_Turn,
			is_Owner: player.is_Owner,
			rol: player.rol,
		};

		await httpServicePlayer.updatePlayer(player_id, updatedPlayer, { room_id: game_id });
		setIsSocialDisgracee(allRevealed);
	};

	useEffect(() => {
		if (didInit.current) return;
		didInit.current = true;

		const initCards = async () => {
			try {
				if (wsInstance.isConnected()) {
					console.warn('WebSocket is already connected. Reusing existing connection.');
				} else {
					wsInstance.connect();
				}
				setLoading(true);

				const game = await httpServiceGame.getGameById(game_id, { room_id: game_id })
				const myCards = await httpServicePlayerCard.getPlayerCards(player_id, { room_id: game_id });
				const playersInGame = await httpServicePlayerGame.getGamePlayers(game_id, { room_id: game_id })
				const playerRole = await httpServicePlayerGame.getPlayerRole(game_id, player_id, { room_id: game_id })
				const mySets = await httpServiceSetDetective.getDetectiveSetByPlayer(player_id, { room_id: game_id });
				const mySecrets = await httpServiceSecretCards.getSecretCardByPlayer(player_id, { room_id: game_id });
				const nonSecretCards = myCards.filter(card => !card.name.startsWith('secret_'));
				const updatedCards = [...nonSecretCards, ...mySecrets];

				const playersInfoArray = await Promise.all(
					playersInGame.map(async (p) => {
						const res = await httpServicePlayer.getPlayerById(p.player_id, { room_id: game_id });
						return { ...res, position: p.position_id_player };
					})
				);

				const playersInfoMap = Object.fromEntries(playersInfoArray.map(p => [p.id, p]));

				const currentPlayer = playersInfoMap[player_id];
					if (currentPlayer) {
					setIsSocialDisgracee(currentPlayer.is_Social_Disgrace);
				}

				setTurnPlayerId(game.turn_id_player)
				setPlayerRole(playerRole)
				setCards(updatedCards)
				setMySecrets(mySecrets)
				setPlayers(playersInGame)
				setPlayersData(playersInfoMap)
				setMyPlayerSets(mySets);

				const deckData = await getAmountCardsOnDeck(game_id);
				const cardImage = await getCardOnDiscardTop(game_id)
				const draftCardsData = await getDraftCards(game_id);
				if (deckData) {
					setDrawCount(deckData.drawTop);
					setDiscardCount(deckData.discardTop);
					setImageDiscardTop(cardImage);
					setDraftCards(draftCardsData);
				}
				wsInstance.on('gamePlayerDiscard', (data) => {
					setDiscardCount(prev => prev + 1);
					setImageDiscardTop(data.card_discard.image_url);
					setCards((prev) => prev.filter((c) => c.id !== data.card_discard.id));
				});

				wsInstance.on('gamePlayerTopDecks', (data) => {
					if (data.deck === "mazo_robo") {
						setDrawCount(prev => prev + data.amount)
					}
					else {
						setDiscardCount(prev => prev + data.amount)
					}
				});

				wsInstance.on('gamePlayerRecieveCard', (data) => {
					if (data.player_id == player_id) {
						setCards(prevCards => [...prevCards, data]);
					}
				});

				wsInstance.on('gamePlayerRestock', (data) => {

					if (data.draft_cards && data.draft_cards.length > 0) {
						setDraftCards(data.draft_cards);
					} else {
						console.log("WS [Restock]: Recibido, pero sin draft_cards válidas. Ignorando actualización de draft.");
					}

					if (data.cards && data.cards.length > 0) {
						setDrawCount(prev => prev - data.cards.length);
						if (data.player_id === Number(player_id)) {
							setCards(prevCards => [...prevCards, ...data.cards]);
						}
					}
				});

				wsInstance.on('gameNextTurn', (nextPlayerId) => {
					setTurnPlayerId(nextPlayerId);
				});

				wsInstance.on('gameMurdererEscapes', (data) => {
					setVictoryCondition(data);
					setStateModal("El asesino ha escapado");
				});

				wsInstance.on('playerCardUpdate', async (data) => {
					const { card, old_player, new_player } = data;
					showNotification(
						<Card image={card_back} />,
						`Una carta fue transferida de ${old_player.name} a ${new_player.name}`,
						4000,
						'default',
						{ disableOverflow: true, disableHover: true, noAnimation: true }
					);

					setCards(prevCards => {
						const myId = Number(player_id);

						if (old_player.id === new_player.id && new_player.id === myId) {
							return prevCards.map(c => c.id === card.id ? { ...c, is_revealed: false } : c);
						}

						if (old_player.id === myId && new_player.id !== myId) {
							return prevCards.filter(c => c.id !== card.id);
						}

						if (new_player.id === myId && old_player.id !== myId) {
							return [...prevCards, card];
						}

						return prevCards;
					});
					await handleSocialDisgraceStatus(player_id, game_id, setIsSocialDisgracee);
				});

			wsInstance.on('secretCardUpdate', async (data) => {
					const updatedCard = data;
					if (updatedCard.is_revealed) {
						showNotification(
							<Card image={updatedCard.image_url} />,
							`Una carta secreta del jugador ${updatedCard.owner} fue revelada`,
							4000,
							'default',
							{ disableOverflow: true, disableHover: true, noAnimation: true }
						);
					} else {
						showNotification(
							<Card image={secret_front} />,
							`Una carta secreta del jugador ${updatedCard.owner} fue oculta`,
							4000,
							'default',
							{ disableOverflow: true, disableHover: true, noAnimation: true }
						);
					}

					setCards(prevCards =>
						prevCards.map(card =>
							card.id === updatedCard.id ? updatedCard : card
						)
				);
				
				await handleSocialDisgraceStatus(player_id, game_id, setIsSocialDisgracee);
				}
			);

				wsInstance.on('detectiveSetAdd', (data) => {
					showNotification(
						<Cards cards={data.cards} />,
						`El jugador ${data.owner.name} ha jugado un set`,
						3000,
						'default',
						{ disableOverflow: true, disableHover: true, noAnimation: true }
					)
					if (player_id == data.owner.id) {
						setMyPlayerSets(prevSets => [
							...prevSets,
							data
						]);
						setCards(prevCards =>
							prevCards.filter(card => !data.cards.some(played => played.id === card.id))
						);
					}
				})

				wsInstance.on('detectiveAddToSet', (data) => {
					showNotification(
						<Cards cards={data.cards} />,
						`El jugador ${data.owner.name} ha re-jugado un set`,
						3000)
					if (player_id == data.owner.id) {
						setMyPlayerSets(prevSets =>
							prevSets.map(s =>
								s.id === data.id ? data : s
							)
						);
					}
					setCards(prevCards =>
							prevCards.filter(card => !data.cards.some(played => played.id === card.id))
						);
				})

				wsInstance.on('detectiveSetUpdate', (data) => {
					showNotification(
						<Cards cards={data.cards} />,
						`El jugador ${data.owner.name} ha robado un set`,
						3000,
						'default',
						{ disableOverflow: true, disableHover: true, noAnimation: true }
					);

					setMyPlayerSets(prevSets => {
						if (player_id == data.owner.id) {
							return [...prevSets, data];
						}
						else {
							return prevSets.filter(set => set.id !== data.id);
						}
					});

					if (player_id == data.owner.id) {
						setCards(prevCards =>
							prevCards.filter(card => !data.cards.some(played => played.id === card.id))
						);
					}
				});

				wsInstance.on('cardDelete', (data) => {
					setCards((prev) => prev.filter((c) => c.id !== data));
				});

				wsInstance.on('murdererReveled', (data) => {
					setVictoryCondition(data)
					setStateModal("El asesino ha sido revelado")
				})

			} catch (error) {
				console.error("Failed to load cards:", error);
			} finally {
				setLoading(false);
			}
		};
		initCards();
	}, [httpServicePlayerCard, wsInstance]);

	const fetchPlayerSecrets = async (playerId) => {
		try {
			const response = await httpServiceSecretCards.getSecretCardByPlayer(playerId, { room_id: game_id });
			setSecretCards(response);
		} catch (error) {
			console.error("Error fetching secrets:", error);
		}
	};

	const fetchPlayerSetDetective = async (playerId) => {
		try {
			const response = await httpServiceSetDetective.getDetectiveSetByPlayer(playerId, { room_id: game_id });
			setViewingOpponentSets(response);
		} catch (error) {
			console.error("Error fetching sets:", error);
		}
	};

	if (loading) {
		return (
			<div
				className="w-screen h-screen flex items-center justify-center text-white text-2xl font-bold"
				style={{
					backgroundImage: `url(${background})`,
					backgroundRepeat: "no-repeat",
					backgroundSize: "cover",
					backgroundPosition: "center",
					textShadow: "2px 2px 8px rgba(0,0,0,0.7)",
				}}
			>
				Cargando...
			</div>
		);
	}

	return (
		<div>
			<GameInterface
				turnPlayerId={turnPlayerId}
				cards={cards}
				setCards={setCards}
				secretCards={secretCards}
				onShowSecrets={fetchPlayerSecrets}
				httpServicePlayerGame={httpServicePlayerGame}
				gameId={game_id}
				players={players}
				playersData={playersData}
				myPlayerId={Number(player_id)}
				playerRole={playerRole}
				drawTop={drawCount}
				discardTop={discardCount}
				imageDiscardTop={imageDiscardTop}
				draftCards={draftCards}
				onShowDetectiveSet={fetchPlayerSetDetective}
				opponentSets={viewingOpponentSets}
				myPlayerSets={myPlayerSets}
				wsInstance={wsInstance}
				isSocialDisgracee = {isSocialDisgracee}
			/>
			{victoryCondition && (
				<GameOverModal
					murderer={victoryCondition.murderer}
					accomplice={victoryCondition.accomplice}
					state={stateModal}
				/>
			)}
		</div>
	);
}
export default GameInterfaceContainer

