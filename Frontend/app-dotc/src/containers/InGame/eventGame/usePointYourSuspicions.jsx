import React, { useState, useEffect } from 'react';
import { createGamePlayerService } from '../../../services/gamePlayerService';
import { createEventService } from '../../../services/eventService';
import { createSecretCardService } from '../../../services/secretCardService';
import { useNotification } from '../../../components/NotificationContext';
import { useGameLock } from '../context/GameLogicContext';

export const usePointYourSuspicions = (
    gameId,
    playerId,
    setTitleModal,
    setOnSelectPlayer,
    setIsOpenSelectPlayer,
    setPlayersModal,
    wsInstance,
    setCardsModal,
	setIsOpenSelectCards,
    setOnSelectCardsModal,
    setAreMySecrets
) => {

    const [httpServiceEvent] = useState(() => createEventService());
    const [httpServicePlayerGame] = useState(() => createGamePlayerService());
    const [httpServiceSecretCard] = useState(() => createSecretCardService());
    const [playedCardId, setPlayedCardId] = useState(null);
    const [initiatorId, setInitiatorId] = useState(null);
    const [suspiciousPlayer, setSuspiciousPlayer] = useState(null);
	const [currentVoter, setCurrentVoter] = useState(null);
	const [endVotation, setEndVotation] = useState(false);
    const { showNotification } = useNotification();
    const {lockGame, unlockGame} = useGameLock()


    const handleSecrets = async (suspiciousPlayer) => {
        try{
            const response = await httpServiceSecretCard.getSecretCardByPlayer(suspiciousPlayer, { room_id: gameId});
            const filteredSecrets = response.filter(card => card.is_revealed !== true);
            setCardsModal(filteredSecrets);
            setAreMySecrets(true);
        } catch(error){
            console.error("Error al traer los secretos del jugador sospechoso: ", error);
            setCardsModal([]);
        }
    }

    const handleSelect = async (cardTargetId, close) => {
        try{
            const revealed = true;
            await httpServiceSecretCard.revealSecret(cardTargetId, revealed, { room_id: gameId});
            setIsOpenSelectCards(close);
        }catch(error){
            console.error("Error en seleccionar el secreto a revelar: ", error);
        }
    }

    const handleVote = async (targetId) => {
        try {
            if(Number(currentVoter) !== Number(playerId)){
                return;
            }
            const vote = [playerId, targetId];
            await httpServicePlayerGame.registerVotes(gameId, playerId, vote, { room_id: gameId });
            setIsOpenSelectPlayer(false);
        } catch (error){
            console.log("Error al enviar el voto al backend: ", error);
        }
    }


    const startingVote = async (playedCardId) => {
        try{
            setPlayedCardId(playedCardId);
            const response = await httpServicePlayerGame.startVotation(gameId, playerId, playedCardId, { room_id: gameId});
            setInitiatorId(response.initiator_id)
            lockGame("Se está realizando una votación.")
        } catch(error){
            console.error(error)
        }
        
    };

    // Eventos de Websocket
     useEffect(() => {
        wsInstance.on('playerSuspicious', async (data) => {
			setSuspiciousPlayer(data.suspicious_playerId);

            
            const response = await httpServiceSecretCard.getSecretCardByPlayer(
                    data.suspicious_playerId,
                    { room_id: gameId }
                );
            const filteredSecrets = response.filter(card => card.is_revealed !== true);
            if((Number(data.suspicious_playerId)===Number(playerId))){
                if(filteredSecrets.length > 0){
                    handleSecrets(data.suspicious_playerId);
                    setTitleModal("Selecciona uno de tus secretos para revelar");
                    setOnSelectCardsModal(() => (cardTargetId, close) =>
                        handleSelect(cardTargetId, close)
                    );
                    setIsOpenSelectCards(true);
                } else {
                    showNotification(
                        <p>El jugador sospechoso no tiene secretos para revelar</p>,
                        "Información",
                        2000,
                        "info"
                    );
                    unlockGame();
                }
            } 
            setCurrentVoter(null);
            setInitiatorId(null);
            setEndVotation(false);
		});

        wsInstance.on('startVotation', (data) => {
			setCurrentVoter(data.current_voter_id)
            const filteredPlayers = data.players.filter(
                (p) => Number(p.id) !== Number(playerId)
            )

            setPlayersModal(filteredPlayers)
            setPlayedCardId(data.card_id)
		})

		wsInstance.on('currentVoter', (data) => {
			setCurrentVoter(data)
		})

		wsInstance.on('RegisterVotes', (data) => {
			setEndVotation(data.end_votation)
		})

        wsInstance.on('gameUnlock', (data) => {
			unlockGame()
		})

    }, [wsInstance])

    useEffect(() => {
        const maybeStartVoting = async () => {
            if (endVotation) {
                setIsOpenSelectPlayer(false);
                return;
            }

            if (Number(currentVoter) === Number(playerId)) {
                setTitleModal("Selecciona al jugador sospechoso");
                setOnSelectPlayer(() => handleVote);
                setIsOpenSelectPlayer(true);
            } else {
                setIsOpenSelectPlayer(false);
            }
        };

        maybeStartVoting();
    }, [currentVoter, endVotation]);

    useEffect(() => {
        const playPointYourSuspicions = async () => {
            
            const payload = {
                game_id: gameId,
                player_id: playerId,
                end_votation: endVotation
            }
            if(endVotation && playedCardId && playerId == initiatorId){
                try{
                    await httpServiceEvent.playEventCard(playedCardId, payload, { room_id: gameId});
                }catch(error){
                    console.error(error)
                }
            }
        };
        playPointYourSuspicions();
    }, [endVotation, playedCardId]);

    return {
        startingVote,
        handleVote
    };

}
