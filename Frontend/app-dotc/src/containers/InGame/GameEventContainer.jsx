import React, { useState, useEffect } from 'react';
import { SelectCardsModal } from './components/SelectCardsModal';
import { SelectPlayer } from './components/SelectPlayerModal';
import FullScreenCardsModal from './components/Modal';
import SelectSetContent from './components/SelectSetContent';
import { createEventService } from '../../services/eventService';
import { useLookIntoTheAshes } from './eventGame/useLookIntoTheAshes';
import { useNotSoFast } from './eventGame/useNotSoFast';
import { useEarlyTrainToPaddington } from './eventGame/useEarlyTrainToPaddington';
import { useDelayTheMurderersEscape } from './eventGame/useDelayTheMurderersEscape';
import { useCardsOffTheTable } from './eventGame/useCardsOffTheTable';
import { useCardTrade } from './eventGame/useCardTrade';
import { useAnotherVictim } from './eventGame/useAnotherVictim';
import { usePointYourSuspicions } from './eventGame/usePointYourSuspicions';
import { useAndThenThereWasOneMore } from './eventGame/useAndThenThereWasOneMore';
import { useDeadCardFolly } from './eventGame/useDeadCardFolly';

function GameEventContainer({ playerId, gameId, wsInstance, eventCardToPlay, setEventCardToPlay, players, cards }) {
	const [isOpenSelectCards, setIsOpenSelectCards] = useState(false)
	const [cardsModal, setCardsModal] = useState([])
	const [titleModal, setTitleModal] = useState("")
	const [onSelectCardsModal, setOnSelectCardsModal] = useState(null)

	// NSF MODAL
	const [isOpenSelectNSFCards, setIsOpenSelectNSFCards] = useState(false)
	const [nsfCardsModal, setNSFCardsModal] = useState([])
	const [nsfTitleModal, setNSFTitleModal] = useState("")
	const [onSelectNSFCardsModal, setOnSelectNSFCardsModal] = useState(null)
	

	const [httpEventService] = useState(() => createEventService())
	const [areMySecrets, setAreMySecrets] = useState(false)
	const [onSelectSetModal, setOnSelectSetModal] = useState(null)
	const [showDetectivesSet, setShowDetectivesSet] = useState(false);
	const [anotherDetectiveSet, setAnotherDetectiveSet] = useState(null);
	const [isOpenMultipleCards, setIsOpenMultipleCards] = useState(null)
	const [onSelectMultipleCards, setOnSelectMultipleCards] = useState(null)
	const [isOpenSelectPlayer, setIsOpenSelectPlayer] = useState(false);
	const [onSelectPlayer, setOnSelectPlayer] = useState(null);
	const [playersModal, setPlayersModal] = useState([]);
	const [isOpenDirectionModal, setIsOpenDirectionModal] = useState(false);
	const [titleDirectionModal, setTitleDirectionModal] = useState("");
	const [onSelectDirection, setOnSelectDirection] = useState(null);

	const { playLookIntoTheAshes } = useLookIntoTheAshes(
		gameId,
		playerId,
		null,
		setCardsModal,
		setOnSelectCardsModal,
		setIsOpenSelectCards,
		setTitleModal
	);


	const { playEarlyTrainToPaddington } = useEarlyTrainToPaddington(
		gameId,
		playerId
	);

	const { playDelayTheMurderersEscape } = useDelayTheMurderersEscape(
		gameId,
		playerId,
		setIsOpenMultipleCards,
		setTitleModal,
		setCardsModal,
		setOnSelectMultipleCards
	)
	const { playCardsOffTheTable } = useCardsOffTheTable(
		gameId,
		playerId,
		null,
		setPlayersModal,
		setOnSelectPlayer,
		setIsOpenSelectPlayer
	);

	const { playCardTrade } = useCardTrade(
		gameId,
		playerId,
		null,
		setPlayersModal,
		setOnSelectPlayer,
		setIsOpenSelectPlayer,
		wsInstance,
		cards,
		setCardsModal,
		setIsOpenSelectCards,
		setOnSelectCardsModal,
		setTitleModal
	);

	const { playAnotherVictim } = useAnotherVictim(
		gameId,
		playerId,
		setIsOpenSelectPlayer,
		setOnSelectPlayer,
		setPlayersModal,
		setAnotherDetectiveSet,
		setOnSelectSetModal,
		setShowDetectivesSet,
	);

	const { startingVote } = usePointYourSuspicions(
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
	);

	const { playAndThenThereWasOneMore } = useAndThenThereWasOneMore(
		gameId,
		playerId,
		null,
		setPlayersModal,
		setOnSelectPlayer,
		setIsOpenSelectPlayer,
		setCardsModal,
		setOnSelectCardsModal,
		setIsOpenSelectCards,
		setTitleModal,
		setAreMySecrets
	);

	const { playDeadCardFolly } = useDeadCardFolly(
		gameId,
		playerId,
		setIsOpenDirectionModal,
		setOnSelectDirection,
		setTitleDirectionModal,
		wsInstance,
		cards,
		setCardsModal,
		setIsOpenSelectCards,
		setOnSelectCardsModal,
		setTitleModal
	);

	const handlePlayCard = async (eventCard, playerId) => {
		const { is_cancellable } = await httpEventService.isCancellabeCard(eventCard.id);
		if (!is_cancellable) {
			await playEventCard(eventCard);
		} else {
			startTimer(playerId, eventCard.id);
		}
	};

	const playEventCard = (eventCard) => {
		switch (eventCard.name) {
			case "event_lookashes":
				playLookIntoTheAshes(eventCard.id);
				break;
			case "event_pointsuspicions":
				startingVote(eventCard.id)
				break;
			case "event_anothervictim":
				playAnotherVictim(eventCard.id);
				break;
			case "event_earlytrain":
				playEarlyTrainToPaddington(eventCard.id);
				break;
			case "event_cardsonthetable":
				playCardsOffTheTable(eventCard.id);
				break;
			case "event_cardtrade":
				playCardTrade(eventCard.id);
				break;
			case "event_delayescape":
				playDelayTheMurderersEscape(eventCard.id);
				break;
			case "event_onemore":
				playAndThenThereWasOneMore(eventCard.id);
				break;
			case "event_deadcardfolly":
				playDeadCardFolly(eventCard.id);
				break;
			default:
				break;
		}
	};

	const { startTimer } = useNotSoFast(
		gameId,
		playerId,
		null,
		setNSFCardsModal,
		setOnSelectNSFCardsModal,
		setIsOpenSelectNSFCards,
		setNSFTitleModal,
		playEventCard,
		eventCardToPlay,
		false,
		null,
		null,
		null,
		wsInstance
	);

	useEffect(() => {
		if (eventCardToPlay) {
			handlePlayCard(eventCardToPlay, playerId);
			setEventCardToPlay(null);
		}
	}, [eventCardToPlay]);

	return (
		<div>
			{isOpenSelectCards &&
				<SelectCardsModal
					cards={cardsModal}
					title={titleModal}
					onSelect={onSelectCardsModal}
					areMySecrets={areMySecrets}
				/>
			}

			{isOpenSelectNSFCards &&
				<SelectCardsModal
					cards={nsfCardsModal}
					title={nsfTitleModal}
					onSelect={onSelectNSFCardsModal}
					areMySecrets={areMySecrets}
				/>
			}

			{isOpenSelectPlayer && (
				<SelectPlayer
					players={playersModal}
					isOpen={isOpenSelectPlayer}
					onSelectPlayer={onSelectPlayer}
				/>
			)}

			{showDetectivesSet &&
				<FullScreenCardsModal
					title={"Elige un set para robar"}
					onClose={() => setShowDetectivesSet(false)}
					showCloseButton={false}
				>
					<SelectSetContent
						setsData={anotherDetectiveSet}
						onSetSelected={onSelectSetModal}
						actionButton="Robar set"
					/>
				</FullScreenCardsModal>
			}

			{isOpenMultipleCards &&
				<SelectCardsModal
					cards={cardsModal}
					title={titleModal}
					onSelect={onSelectMultipleCards}
					multiple={true}
					delay={true}
				/>
			}
			{isOpenDirectionModal &&
				<FullScreenCardsModal
					title={titleDirectionModal}
					onClose={() => setIsOpenDirectionModal(false)}
				>
					<div className="flex justify-center gap-4 p-4 w-full max-w-md">
						<button
							className="flex-1 bg-red-600/90 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition-colors duration-200"
							onClick={() => onSelectDirection && onSelectDirection("left")}
						>
							Izquierda
						</button>
						<button
							className="flex-1 bg-red-600/90 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition-colors duration-200"
							onClick={() => onSelectDirection && onSelectDirection("right")}
						>
							Derecha
						</button>
					</div>
				</FullScreenCardsModal>
			}
		</div>
	)
}

export default GameEventContainer
