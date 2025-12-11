import React, { use, useEffect } from 'react'
import { useState, useCallback } from 'react';
import { detectiveSetValidator, addDetectiveSetValidator, validateOliverAddition } from './detectiveSetValidator'; 
import { createDetectiveSetService } from '../../../services/detectiveSetService'
import { createSecretCardService } from '../../../services/secretCardService'
import { useNotification } from '../../../components/NotificationContext';
import { SelectCardsModal } from '../components/SelectCardsModal';
import { useGameLock } from '../context/GameLogicContext';

export const useDetectiveGameLogic = (playerId, gameId, setDetectiveSetPlayed, wsInstance) => {
  const [isLoading, setIsLoading] = useState(false);
	const [lastValidationError, setLastValidationError] = useState(null);

  const [httpServiceDetectiveSet] = useState(() => createDetectiveSetService());
	const [httpServiceSecretcard] = useState(() => createSecretCardService());
	const {showNotification} = useNotification()
	const [showSecretModal, setShowSecretModal] = useState(false);
	const [secretCards, setSecretCards] = useState([]);
	const [areMySecrets, setareMySecrets] = useState(false);
	const [canBack, setcanBack] = useState(false)
	
	const {lockGame, unlockGame} = useGameLock()

	const validateDetectiveSet = useCallback((selectedCards) => {
		setLastValidationError(null);
		const validationResult = detectiveSetValidator(selectedCards);

		if (!validationResult.isValid) {
			setLastValidationError(validationResult.error);
			showNotification(<p>No es un set válido</p>, "Error", 2000, "error");
			return null;
		}

		const { detectiveName, action_secret, is_cancellable, wildcard_effects } = validationResult;
		const cardIds = selectedCards.map(c => c.id);
		return {
			id_owner: playerId,
			main_detective: detectiveName,
			action_secret,
			is_cancellable,
			wildcard_effects,
			detective_card_ids: cardIds
		};
	}, [playerId]);

	const validateAddToSet = useCallback(async (selectedCard, existingSetId) => {
		setLastValidationError(null);
		setIsLoading(true);
		try {
			const response = await httpServiceDetectiveSet.getDetectiveSetById(existingSetId, {room_id: gameId});
			const validationResult = addDetectiveSetValidator(selectedCard, response);
			return validationResult
		} catch (error) {
			setIsLoading(false);
			setLastValidationError(error);
			return error;
		}
	}, [playerId]);

  const newDetectiveSet = useCallback(async (detectiveSet) => {
      try {
        setIsLoading(true);
        const response = await httpServiceDetectiveSet.createDetectiveSet(detectiveSet, {room_id: gameId}); 
				setIsLoading(false);
        return response
      } catch (error) {
        setIsLoading(false);
        setLastValidationError(error);
        return error
      }
  }, []);

  const addOliverToExistingSet = useCallback(async (oliverCard, existingSetId) => {
		setLastValidationError(null);
		setIsLoading(true);

		let retrievedSet;
		try {
			const response = await httpServiceDetectiveSet.getDetectiveSetById(existingSetId, {room_id: gameId});
			retrievedSet = response.data;
		} catch (error) {
			setIsLoading(false);
			setLastValidationError(error);
			return error;
		}

		const validationResult = validateOliverAddition(oliverCard, retrievedSet);

		if (!validationResult.isValid) {
			setIsLoading(false);
			setLastValidationError(validationResult.error);
			return "Error de validación en el set"
		}

		const putPayload = {
			id_owner: retrievedSet.id_owner,
			action_secret: retrievedSet.action_secret, 
			is_cancellable: retrievedSet.is_cancellable, 
			wildcard_effects: validationResult.wildcard_effects, 
			detective_card_ids: [...retrievedSet.detective_card_ids, oliverCard.id] 
		};
		
		try {
			const response = await httpServiceDetectiveSet.updateDetectiveSet(existingSetId, putPayload, {room_id: gameId});
			setIsLoading(false);
			return response;
		} catch (error) {
			setIsLoading(false);
			setLastValidationError(error);
			return error;
		}
  }, []);

	const addToDetectiveSet = useCallback(async (detectiveToPlay, detectiveSet) => {
		try {
        setIsLoading(true);
        const response = await httpServiceDetectiveSet.addDetectiveCardToSet(
					detectiveSet.id, detectiveToPlay.id, 
					{room_id: gameId})
				setIsLoading(false);
        return response
      } catch (error) {
        setIsLoading(false);
        setLastValidationError(error);
        return error
      }
  }, []);

	const playDetectiveSet = useCallback(async (detectiveSet, targetPlayer) => {
		try {
        setIsLoading(true);
        const response = await httpServiceDetectiveSet.playDetectiveSet(detectiveSet, targetPlayer, {room_id: gameId}); 
				setIsLoading(false);
        return response
      } catch (error) {
        setIsLoading(false);
        setLastValidationError(error);
        return error}
		}, []);

	// EFECTOS

	useEffect(() => {

		wsInstance.on('revealTheirSecret', async (data) => {
			if (data.target_id === playerId) {
				setDetectiveSetPlayed(data);
				setSecretCards(data.secret_cards);
				setareMySecrets(true);
				setShowSecretModal(true);
			}
			if (data.secret_cards.length > 0) {
					setcanBack(false);
			}
			else {
				setcanBack(true);
			}
			lockGame("Un jugado está revelando un secreto");
	});


		wsInstance.on('revealYourSecret', (data) => {
			if (data.player_id == playerId) {
				setSecretCards(data.secret_cards);
				setareMySecrets(false);
				setShowSecretModal(true);
				if (data.secret_cards.length > 0) {
					setcanBack(false);
				}
				else {
					setcanBack(true);
				}
			} else if (data.target_id == playerId) {
				showNotification(
					<div></div>,
					"Te van a revelar un secreto",
					3000,
					"default"
				)
			}
			lockGame("Un jugado está revelando un secreto");
		})
		
		wsInstance.on('hideYourSecret', (data) => {
			if (data.player_id == playerId) {
				setSecretCards(data.secret_cards);
				setareMySecrets(true);
      	setShowSecretModal(true);
				if (data.secret_cards.length > 0) {
					setcanBack(false);
				}
				else {
					setcanBack(true);
				}
			} else if (data.target_id == playerId) {
				showNotification(
					<div></div>,
					"Te van a ocultar un secreto",
					3000,
					"default"
				)
			}
		})

		wsInstance.on('gameUnlock', (data) => {
			unlockGame()
		})

	}, [wsInstance]);

	return {
			isLoading,
			lastValidationError,
			validateDetectiveSet,
			validateAddToSet,
			newDetectiveSet,
			addToDetectiveSet,
			addOliverToExistingSet,
			playDetectiveSet,
			setShowSecretModal,
			showSecretModal,
			secretCards,
			areMySecrets,
			canBack
	};
};