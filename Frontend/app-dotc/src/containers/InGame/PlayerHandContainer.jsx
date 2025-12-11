import { useState, useEffect } from 'react';
import PlayerHand from './components/PlayerHand';
import RestockChoiceModal from './components/RestockChoiceModal';
import { SelectCardsModal } from './components/SelectCardsModal';
import { createDetectiveSetService } from '../../services/detectiveSetService';
import GameDetectiveContainer from './GameDetectiveContainer'
import GameEventContainer from './GameEventContainer';
import { createCardService } from '../../services/cardService';
import { useEarlyTrainToPaddington } from './eventGame/useEarlyTrainToPaddington';

export default function PlayerHandContainer({
  cards,
  setCards,
  gameId,
  playerId,
  httpServicePlayerGame,
  areMySecrets,
  isMyTurn,
  draftCards = [],
  detectivesSet,
  wsInstance,
  playersData,
  isSocialDisgracee 
  }) {

  const [selectedCardId, setSelectedCardId] = useState(null);
  const [isRestocking, setIsRestocking] = useState(false);
  const [actionTaken, setActionTaken] = useState(false);
  const [animatedCards, setAnimatedCards] = useState([]);
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [isOpenSet, setIsOpenSet] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasRestocked, setHasRestocked] = useState(false);
  const [hasDiscarded, setHasDiscarded] = useState(false);
  const [hasOliver, setHasOliver] = useState(null);
  const [wasPlayedSet, setWasPlayedSet] = useState(false);
  const [httpServicesDetectiveSet] = useState(() => createDetectiveSetService());
  const [eventCardToPlay, setEventCardToPlay] = useState(null);
  const [detectiveToPlay, setDetectiveToPlay] = useState(null);
	const [httpServiceCard] = useState(() => createCardService());

  const handleSelect = (cardId) => {
    setSelectedCardId((prev) => {
      const newSelected = prev === cardId ? null : cardId;
      const selectedOliver = cards.find(
        (card) =>
          card.name?.toLowerCase() === "detective_oliver" && card.id === newSelected
      ) || null;

      setHasOliver(selectedOliver);

      return newSelected;
    });
  };

  const handlePlayDetective = () => {
    if (!selectedCardId) {
      alert("Seleccioná una carta primero");
      return;
    }
    const card = cards.find(c => c.id === selectedCardId);
    if (!card) return;

    if (!card.name.startsWith("detective_")) {
      alert("La carta seleccionada no es un Detective");
      return;
    }
    setDetectiveToPlay({ ...card, __uid: Date.now() });
  };

  const handlePlayEventTest = () => {
    if (!selectedCardId) {
      alert("Seleccioná una carta primero");
      return;
    }
    const card = cards.find(c => c.id === selectedCardId);
    if (card) {
      const isEvent = !!card.name && card.name.toLowerCase().startsWith('event_');
      if (isEvent) setActionTaken(true);
      setEventCardToPlay(card);
    }
  };

  const { playEarlyTrainToPaddington } = useEarlyTrainToPaddington(
    gameId,
    playerId
  );

  const handleDiscard = async () => {
    if (!selectedCardId || !isMyTurn) return;
    try {
      const card = await httpServiceCard.getCardById(selectedCardId)
      if (card.name !== "event_earlytrain") {
        await httpServicePlayerGame.discardCard(gameId, playerId, selectedCardId, { room_id: gameId });
        setCards((prev) => prev.filter((c) => c.id !== selectedCardId));
        setSelectedCardId(null);
        setHasDiscarded(true);
        if (!actionTaken) setActionTaken(true);
      }
      else {
        playEarlyTrainToPaddington(selectedCardId);
      }
    } catch (error) {
      console.error('Error al descartar carta:', error);
    }
  };

  const handleRestock = () => {
    if (isMyTurn) {
      setIsChoiceModalOpen(true);
    }
  };

  const handleRestockFromDeck = async () => {
    setIsRestocking(true);
    try {

      const queryParams = {
        cantidad_robo: 1,
        room_id: gameId,
      };

      const response = await httpServicePlayerGame.restockCard(gameId, playerId, {}, queryParams);
      setHasRestocked(true);
      const newCards = response.cards;

      if (newCards && newCards.length > 0) {
        setCards((prevCards) => [...prevCards, ...newCards]);
      }
      if (!actionTaken) setActionTaken(true);

    } catch (error) {

      if (error.response?.status === 400 && error.response?.data?.detail?.includes('6 cards')) {
        alert('Ya tienes 6 cartas en tu mano');
      } else {
        console.error('Error al reponer cartas:', error);
      }

    } finally {
      setIsRestocking(false);
    }
  };

  const handleSelectDraft = (cardId, close) => {
    setIsOpen(close);
    handleConfirmDraftSelection([cardId]);
  };

  const handleConfirmDraftSelection = async (selectedIds) => {
    setIsOpen(false);
    setIsRestocking(true);
    try {

      const payload = {
        cards_id: selectedIds,
      };

      const queryParams = {
        room_id: gameId,
      };

      const response = await httpServicePlayerGame.restockCard(gameId, playerId, payload, queryParams);
      setHasRestocked(true);
  if (!actionTaken) setActionTaken(true);

    } catch (error) {
      console.error('Error al reponer cartas del draft:', error.response?.data || error);

    } finally {
      setIsRestocking(false);
    }
  };

  const handleRestockChoice = (choice) => {
    setIsChoiceModalOpen(false);

    if (choice === 'deck') {
      handleRestockFromDeck();
    } else if (choice === 'draft') {
      if (draftCards && draftCards.length > 0) {
        setIsOpen(true);
      } else {
        alert("No hay cartas disponibles en el mazo de draft.");
      }
    }
  };

  const handlePassTurn = async () => {
    if (!isMyTurn) return;
    try {
      setActionTaken(true);
      setWasPlayedSet(false);
      await httpServicePlayerGame.passTurn(gameId, playerId, { room_id: gameId });
    } catch (error) {
      console.error('Error al intentar pasar el turno:', error);
    }
  };

  const handleShowDetectives = (close) => {
    setIsOpenSet(close);
  };

  useEffect(() => {
    if (isMyTurn) {
      setHasRestocked(false);
      setHasDiscarded(false);
      setActionTaken(false);
      setWasPlayedSet(false);
    }
  }, [isMyTurn]);

  const handleOnSetPlayed = () => {
    setActionTaken(true);
    setWasPlayedSet(true);
  };

  const totalNormalCards = cards.filter((c) => !c.name?.toLowerCase().includes('secret')).length;
  const canPerformPrimary = isMyTurn && !actionTaken;
  const canPlaySet = canPerformPrimary;
  const selectedCard = cards.find((c) => c.id === selectedCardId);
  const canLowerDetective = canPerformPrimary && !!selectedCard && selectedCard.name?.toLowerCase().startsWith('detective_');
  const isSelectedEvent = !!selectedCard && !!selectedCard.name && selectedCard.name.toLowerCase().startsWith('event_');
  const canPlayEvent = canPerformPrimary && isSelectedEvent;
  const effectiveCanPassTurn = isMyTurn && !actionTaken;
  
  let canDiscard = isMyTurn && !hasRestocked && (!!selectedCardId || totalNormalCards > 0);
  let canRestock = isMyTurn && totalNormalCards < 6 && !isRestocking;

  if (isSocialDisgracee && isMyTurn) {
    if (totalNormalCards >= 6) {
      canRestock = false;
      canDiscard = isMyTurn && !hasRestocked && !hasDiscarded && (!!selectedCardId || totalNormalCards > 0);
    } else {
      canRestock = isMyTurn && !isRestocking;
      canDiscard = isMyTurn && !hasRestocked && !hasDiscarded && (!!selectedCardId || totalNormalCards > 0);
    }
  }

  useEffect(() => {
    if (!isOpenSet) {
      setDetectiveToPlay(null);
    }
  }, [isOpenSet]);

  useEffect(() => {
    if (!isOpen) {
      setDetectiveToPlay(null);
    }
  }, [isOpen]);


  return (
    <>
      <PlayerHand
        cards={cards}
        onSelectCard={handleSelect}
        selectedCardId={selectedCardId}
        areMySecrets={areMySecrets}
        animatedCards={animatedCards}
        onDiscard={handleDiscard}
        canDiscard={canDiscard}
        onRestock={handleRestock}
        canRestock={canRestock}
        isRestocking={isRestocking}
        onPassTurn={handlePassTurn}
        isMyTurn={isMyTurn}
        canPassTurn={effectiveCanPassTurn}
        canPlaySet={canPlaySet}
        canLowerDetective={canLowerDetective}
        canPlayEvent={canPlayEvent}
        canPerformPrimary={canPerformPrimary}
        onDetectiveSet={handleShowDetectives}
        hasOliver={hasOliver}
        detectivesSet={detectivesSet}
        onPlayEventTest={handlePlayEventTest}
        onPlayDetective={handlePlayDetective}
        wasPlayedSet={wasPlayedSet}
        isSocialDisgracee = {isSocialDisgracee}
      />  
      
      <RestockChoiceModal
        isOpen={isChoiceModalOpen}
        onClose={() => setIsChoiceModalOpen(false)}
        onSelect={handleRestockChoice}
        draftCards={draftCards}
      />

      {isOpen &&
        <SelectCardsModal
          cards={draftCards}
          title={"Cartas del mazo de draft"}
          onSelect={handleSelectDraft}
        />
      }

      <GameDetectiveContainer
        playerId={playerId}
        gameId={gameId}
        cards={cards}
        isOpenSet={isOpenSet}
        setIsOpenSet={setIsOpenSet}
        playersData={playersData}
        detectiveToPlay={detectiveToPlay}
        setDetectiveToPlay={setDetectiveToPlay}
        wsInstance={wsInstance}
        onSetPlayed={handleOnSetPlayed}
        onCancelDetective={() => {
        setDetectiveToPlay(null);
        setActionTaken(false);
        }} />

      <GameEventContainer
        playerId={playerId}
        gameId={gameId}
        wsInstance={wsInstance}
        eventCardToPlay={eventCardToPlay}
        setEventCardToPlay={setEventCardToPlay}
        cards={cards}
        players={playersData}
      />
    </>
  );
}