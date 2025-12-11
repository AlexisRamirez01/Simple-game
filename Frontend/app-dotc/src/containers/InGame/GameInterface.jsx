import React from "react";
import { useState, useEffect } from "react";
import background from "../../assets/Home-background.png";
import Cards from "./components/Cards";
import Card from "./components/Card";
import PlayerAvatar from "./components/PlayerAvatar";
import card_back from "../../assets/card_back.png";
import FullScreenCardsModal from "./components/Modal";
import PlayerHandContainer from "./PlayerHandContainer";
import DeckInterface from "./components/DeckInterface";
import { GameLockProvider } from "./context/GameLogicContext";

function GameInterface({
  turnPlayerId,
  cards,
  setCards,
  secretCards,
  players,
  playersData,
  myPlayerId,
  onShowSecrets,
  onShowDetectiveSet,
  playerRole,
  httpServicePlayerGame,
  gameId,
  drawTop,
  discardTop,
  imageDiscardTop,
  draftCards,
  opponentSets,
  myPlayerSets,
  wsInstance,
  isSocialDisgracee
}) {

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerForSets, setPlayerForSets] = useState(null);
  
  const isMyTurn = turnPlayerId === myPlayerId;
  const me = players.find((p) => p.player_id === myPlayerId);
  const myPos = me.position_id_player;
  const orderedPlayers = players
    .map((p) => {
      let relativePos =
        (p.position_id_player - myPos + players.length) % players.length;
      return { ...p, relativePos };
    })
    .sort((a, b) => a.relativePos - b.relativePos);

  const getRoleText = () => {
    if (!playerRole) return null;

    const { player, partner } = playerRole;
    if (player.rol === "murderer") {
      return partner
        ? `Sos el asesino. Tu cómplice es ${partner.name}`
        : "Sos el asesino. No hay cómplice";
    } else if (player.rol === "accomplice") {
      return `Sos el cómplice. Tu asesino es ${partner?.name || "desconocido"}`;
    } else {
      return "Sos inocente. Descrubre al asesino";
    }
  };


  return (
    <GameLockProvider>
      <div
        className="h-screen w-screen relative text-white"
        style={{
          backgroundImage: `url(${background})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div>
          <DeckInterface
            drawCount={drawTop}
            discardCount={discardTop}
            imageDiscardTop={imageDiscardTop}
            draftCards={draftCards}
          />
        </div>

        {orderedPlayers.map((player) => {
          const isMe = player.player_id === myPlayerId;

          if (isMe) {
              return (
                <div
                  key={player.player_id}
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-[265px]"
                  data-testid="player-hand"
                >
                  <div className="mb-2 flex flex-col items-center justify-center gap-y-1 bg-gray-900/50 rounded-lg shadow-md p-2 px-3">
                    <div
                      className={`flex items-center gap-x-2 font-bold text-lg drop-shadow-md 
                        ${isMyTurn ? "text-green-400 animate-pulse" : "text-gray-400"}`}
                    >
                      {isMyTurn ? "¡Es tu turno!" : "No es tu turno"} - {getRoleText()}

                      {isSocialDisgracee && (
                        <span className="text-red-600 font-semibold text-lg drop-shadow-md ml-2">
                          Estas en desgracia social
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

          
          // posiciones en sentido horario a partir de mí
          const style = (() => {
            switch (player.relativePos) {
              case 1: // derecha
                return { top: "50%", right: 0, transform: "translateY(-50%)" };
              case 2: // arriba-derecha
                return { top: "5%", left: "75%", transform: "translateX(-50%)" };
              case 3: // arriba
                return { top: "5%", left: "50%", transform: "translateX(-50%)" };
              case 4: // arriba-izquierda
                return { top: "5%", left: "25%", transform: "translateX(-50%)" };
              case 5: // izquierda
                return { top: "50%", left: 0, transform: "translateY(-50%)" };
              default:
                return {};
            }
          })();

          return (
            <div
              key={player.player_id}
              className="absolute w-32 h-16 rounded flex items-center justify-center"
              style={style}
            >
              <PlayerAvatar
                player={playersData[player.player_id]}
                turnPlayerId={turnPlayerId}
              />
              <button
                onClick={() =>
                  setSelectedPlayer(
                    playersData[player.player_id],
                    onShowSecrets(player.player_id)
                  )
                }
                className="w-10 h-10 ml-2 rounded-full bg-red-600/90 text-white 
                  flex items-center justify-center shadow-md 
                  hover:bg-red-700 transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 text-sm"
              >
                🔒
              </button>
              <button
                onClick={() => {
                  setPlayerForSets(playersData[player.player_id]);
                  onShowDetectiveSet(player.player_id);
                }}
                className="w-10 h-10 ml-2 rounded-full bg-red-600/90 text-white 
                    flex items-center justify-center shadow-md 
                    hover:bg-red-700 transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 text-sm"
              >
                🔎
              </button>
            </div>
          );
        })}

        {selectedPlayer && (
          <FullScreenCardsModal
            title={`Secretos de ${selectedPlayer.name}`}
            onClose={() => setSelectedPlayer(null)}
          >
            <Cards cards={secretCards} />
          </FullScreenCardsModal>
        )}

         {playerForSets && (
          <FullScreenCardsModal
            title={`Sets de ${playerForSets.name}`}
            onClose={() => setPlayerForSets(null)}
          >
            <div className="flex flex-wrap justify-center gap-2 max-h-[80vh] overflow-y-auto p-4">
              {opponentSets.map((set, index) => (
                <div
                  key={index}
                  className={`flex gap-2 ${index < opponentSets.length - 1 ? "mr-4" : ""
                    }`}
                >
                  <Cards cards={set.cards} isModalView />
                </div>
              ))}
            </div>
          </FullScreenCardsModal>
        )}

        <PlayerHandContainer 
          cards={cards}
          setCards = {setCards}
          gameId={gameId}
          playerId={myPlayerId}
          httpServicePlayerGame={httpServicePlayerGame}
          areMySecrets={true}
          isMyTurn={isMyTurn}
          draftCards={draftCards}
          detectivesSet={myPlayerSets}
          wsInstance={wsInstance}
          playersData={playersData}
          isSocialDisgracee = {isSocialDisgracee}
        />
      </div>
    </GameLockProvider>
  );
}

export default GameInterface;