import React, { useRef, useEffect, useState } from 'react'
import { useDetectiveGameLogic } from './detectiveGame/useDetectiveGameLogic';
import { SelectCardsModal } from './components/SelectCardsModal';
import { SelectPlayer } from './components/SelectPlayerModal';
import { createSecretCardService } from '../../services/secretCardService';
import { createPlayerCardService } from '../../services/playerCardService'
import { createDetectiveSetService } from '../../services/detectiveSetService';
import FullScreenCardsModal from './components/Modal';
import SelectSetContent from './components/SelectSetContent';
import { validateOliverAddition } from './detectiveGame/detectiveSetValidator';
import { useNotification } from '../../components/NotificationContext';
import { useNotSoFast } from './eventGame/useNotSoFast';

function GameDetectiveContainer({ playerId, gameId, cards, isOpenSet, setIsOpenSet, playersData, detectiveToPlay, setDetectiveToPlay, wsInstance, onSetPlayed, onCancelDetective }) {

	const [httpServicesSecretCard] = useState(() => createSecretCardService());
	const [httpServicesPlayerCard] = useState(() => createPlayerCardService());
	const [httpServicesDetectiveSet] = useState(() => createDetectiveSetService());
	
	const [isOpenCurrentSets, setIsOpenCurrentSets] = useState(false);
	const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
	const [playersWithSets, setPlayersWithSets] = useState(null)

	const [detectivePayload, setDetectivePayload] = useState(null);
	const [detectiveSetPlayed, setDetectiveSetPlayed] = useState([]);
	const [detectiveId, setDetectiveId] = useState(null)
	const [showDetectivesSet, setShowDetectivesSet] = useState(false);

	const [setsTitle, setSetsTitles] = useState("")
	const [setsData, setSetsData] = useState(null)
	const [isAddingOliver, setIsAddingOliver] = useState(false)
	const [isAddingDetective, setIsAddingDetective] = useState(false)

	const [isPlayerSetsModalOpen, setIsPlayerSetsModalOpen] = useState(false);
	const { showNotification } = useNotification();

	const [reveal, setReveal] = useState(null)
	const [targetId, setTargetId] = useState(null)
	
	const detectivePayloadRef = useRef(null)
	// NSF MODAL
	const [isOpenSelectNSFCards, setIsOpenSelectNSFCards] = useState(false)
	const [nsfCardsModal, setNSFCardsModal] = useState([])
	const [nsfTitleModal, setNSFTitleModal] = useState("")
	const [onSelectNSFCardsModal, setOnSelectNSFCardsModal] = useState(null)

	const targetPlayers = Object.values(playersData).filter(p => p.id !== playerId);
	const detectiveCards = cards.filter(card => card.name.startsWith("detective_"));
	const { validateDetectiveSet, validateAddToSet, newDetectiveSet, addToDetectiveSet, playDetectiveSet, setShowSecretModal, showSecretModal, secretCards, areMySecrets, canBack} = useDetectiveGameLogic(playerId, gameId, setDetectiveSetPlayed, wsInstance)

	const handleShowCurrentSets = async (close) => {
    const playersWithSets = await httpServicesDetectiveSet.getPlayersWithAtLeastOneSet(gameId);
    const filteredPlayers = Object.values(playersData).filter(player => playersWithSets.includes(player.id) && player.id !== playerId)
    setIsAddingOliver(true);
		setPlayersWithSets(filteredPlayers)
    setIsOpenCurrentSets(close);
  };

	const handleSetDetective = (detectiveCards, close) => {
		const payload = validateDetectiveSet(detectiveCards);
		if (!payload) {
			setDetectivePayload(null)
			if (onCancelDetective) onCancelDetective();
			return;
		}
		setIsOpenSet(close);
		setDetectivePayload(payload);
		setIsPlayerModalOpen(true);
	};

  
	const playDetectiveSetEffect = async (detectiveSetId, targetPlayerId) => {
		await playDetectiveSet(detectiveSetId, targetPlayerId);
    if (onSetPlayed) onSetPlayed();
		const { action_secret } = detectivePayloadRef.current
		if (action_secret === "reveal_their" || action_secret === "reveal_your") {
			setReveal(true);
		} else if (action_secret === "hide") {
			setReveal(false);
		}
		
	}
		
	const handlePlayerSelectionLogic = async (selectedPlayerId) => {
		if (!detectivePayload) return;
		setTargetId(selectedPlayerId)
		let response;
		try {
      if (isAddingDetective) {
        response = await addToDetectiveSet(detectiveToPlay, detectivePayload, { room_id: gameId });
        setIsAddingDetective(false)
      } else {
        response = await newDetectiveSet(detectivePayload, { room_id: gameId });
      }
			detectivePayloadRef.current = response
      setDetectivePayload(response)
      setDetectiveId(response.id)
      setIsPlayerModalOpen(false);

			if (response.is_cancellable) {
				if (onSetPlayed) onSetPlayed();
				startTimer(playerId)
			} else {
				playDetectiveSetEffect(response.id, selectedPlayerId)
			}
    } catch (err) {
      console.error('Error playing detective set:', err);
			if (onCancelDetective) onCancelDetective();
			setIsPlayerModalOpen(false);
			setIsAddingDetective(false);
    }
  };


	const handlePlayerSelectionSets = async (selectedPlayerId) => {
		const setsFromPlayer = await httpServicesDetectiveSet.getDetectiveSetByPlayer(selectedPlayerId);
		setSetsData(setsFromPlayer)
		if (isAddingOliver) {
			setIsOpenCurrentSets(false);
			setSetsTitles("Elige un set para añadir a Oliver")
		} else {
			setSetsTitles("Elige un set para añadir el detective")
		}
		setShowDetectivesSet(true);
	};

	const handleSelectSecret = (cardId, close) => {
		setShowSecretModal(close);
		httpServicesSecretCard.revealSecret(cardId, reveal, { room_id: gameId })
		const { wildcard_effects, target_id, player_id } = detectiveSetPlayed
		if (wildcard_effects === "Satterthwaite") {
			httpServicesPlayerCard.transferPlayerCard(target_id, cardId, player_id, { room_id: gameId })
		}
	};

	const handleAddToDetectiveSet = async (detectiveSetId) => {
		const response = await validateAddToSet(detectiveToPlay, detectiveSetId)
		if (response.ok) {
			setDetectivePayload(response.detectiveSet)
			setShowDetectivesSet(false);
			setIsAddingDetective(true)
			setIsPlayerModalOpen(true)
		} else {
			showNotification(<p>No se puede bajar ese detective a este set</p>, "Error", 2000, "error");
			return null;
		}
	}

	const handleChooseDetectivePlay = (detectiveCard) => {
		if (detectiveCard.name === "detective_oliver") {
			handleShowCurrentSets(true)
		} else {
			handlePlayerSelectionSets(playerId)
		}
	}

	const handlePlayerOliverSet = async (detectiveSetId) => {
      const filteredSet = setsData.find(set => set.id === detectiveSetId);
      if (!filteredSet) {
        if (onCancelDetective) onCancelDetective();
        return;
      }
      const payload = validateOliverAddition(detectiveToPlay, filteredSet);
      if (!payload) {
        if (onCancelDetective) onCancelDetective();
        return;
      }
      
      try {
        await httpServicesDetectiveSet.addDetectiveCardToSet(payload.id, detectiveToPlay.id, { room_id: gameId })
        setShowDetectivesSet(false)
        const update = {
          "id_owner": payload.id_owner,
          "main_detective": payload.main_detective,
          "action_secret": payload.action_secret,
          "is_cancellable": payload.is_cancellable,
          "wildcard_effects": payload.wildcard_effects,
          "detective_card_ids": []
        }
        setTargetId(payload.id_owner)
        setDetectiveId(payload.id)
        await httpServicesDetectiveSet.updateDetectiveSet(payload.id, update, { room_id: gameId })

				if (payload.is_cancellable) {
					if (onSetPlayed) onSetPlayed();
					startTimer(playerId)
				} else {
					playDetectiveSetEffect(payload.id, payload.id_owner)
				}
      } catch (error) {
        console.error('Error handling Oliver add to set:', err);
        if (onCancelDetective) onCancelDetective();
        setShowDetectivesSet(false);
        setIsPlayerModalOpen(false);
        setIsAddingOliver(false);
      }
      
    }

	const { startTimer } = useNotSoFast(
		gameId,
		playerId,
		null,
		setNSFCardsModal,
		setOnSelectNSFCardsModal,
		setIsOpenSelectNSFCards,
		setNSFTitleModal,
		() => {},
		null,
		true,
		playDetectiveSetEffect,
		detectiveId,
		targetId,
		wsInstance
	);


	useEffect(() => {
			if (detectiveToPlay) {
				handleChooseDetectivePlay(detectiveToPlay, playerId);
			}
		}, [detectiveToPlay]);

	const handleBack = (close) => {
		setIsOpenSet(close);
		setIsAddingOliver(false);
		setIsAddingDetective(false);
		setDetectivePayload(null);
		if (onCancelDetective) onCancelDetective();
	};

	return (
		<div>

			{isOpenSet &&
				<SelectCardsModal
					cards={detectiveCards}
					title={"Tus cartas de detective"}
					onSelect={handleSetDetective}
					multiple={true}
					goBack={true}
					onBack={handleBack}
				/>
			}

			<SelectPlayer
				isOpen={isPlayerModalOpen}
				onClose={() => setIsPlayerModalOpen(false)}
				players={targetPlayers}
				onSelectPlayer={handlePlayerSelectionLogic}
			/>

			{showSecretModal &&
				<SelectCardsModal
					cards={secretCards}
					title="Debes seleccionar un secreto"
					areMySecrets = {areMySecrets}
					onSelect={handleSelectSecret}
					goBack = {canBack}
					onBack={() => setShowSecretModal(false)}
				/>
			}

			<SelectPlayer
				isOpen={isOpenCurrentSets}
				onClose={() => setIsPlayerSetsModalOpen(false)}
				players={playersWithSets}
				onSelectPlayer={handlePlayerSelectionSets}
			/>

			{showDetectivesSet &&
				<FullScreenCardsModal
					title={setsTitle}
					onClose={() => setShowDetectivesSet(false)}
					showCloseButton={false}
				>
					<SelectSetContent
						setsData={setsData}
						onSetSelected={isAddingOliver ? handlePlayerOliverSet : handleAddToDetectiveSet}
						actionButton="Jugar Set"
					/>
				</FullScreenCardsModal>
			}

			{isOpenSelectNSFCards &&
				<SelectCardsModal
					cards={nsfCardsModal}
					title={nsfTitleModal}
					onSelect={onSelectNSFCardsModal}
					areMySecrets={areMySecrets}
				/>
			}
		</div>
	)
}

export default GameDetectiveContainer