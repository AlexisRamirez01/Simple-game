import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import winnerCardImage from '../../../assets/murder_escapes.png';
import secretMurderer from '../../../assets/secret_murderer.png';

function GameOverModal({ murderer, accomplice, state}) {
	const navigate = useNavigate();
	const [visible, setVisible] = useState(state !== "El asesino ha sido revelado");

	useEffect(() => {
		if(state === "El asesino ha sido revelado"){
			const timer = setTimeout(() => setVisible(true), 4010);
			return () => clearTimeout(timer);
		}
	}, [state]);

	const handleGoHome = () => {
		navigate('/');
	};

	const renderContent = () => {
    switch (state) {
      case "El asesino ha escapado":
        return (
          <>
            <h1 className="text-4xl font-bold text-red-600 mb-6">
              ¡El Asesino, "{murderer.name}", ha ganado!
            </h1>

            <div className="bg-red-800 p-1 rounded-lg mx-auto w-1/3">
              <img
                src={winnerCardImage}
                alt="Carta de victoria"
                className="w-full h-auto object-contain rounded-sm"
              />
            </div>
          </>
        );

      case "El asesino ha sido revelado":
        return (
          <>
            <h1 className="text-4xl font-bold text-blue-400 mb-6">
              ¡El Asesino "{murderer.name}" ha sido revelado, ganan los detectives!
            </h1>

            <div className="bg-blue-800 p-1 rounded-lg mx-auto w-1/3">
              <img
                src={secretMurderer}
                alt="Carta del asesino revelado"
                className="w-full h-auto object-contain rounded-sm"
              />
            </div>
          </>
        );

      case "El asesino gana por desgracia social":
        return (
          <>
            <h1 className="text-4xl font-bold text-blue-400 mb-6">
              ¡Todos los jugadores inocentes entraron en desgracia social, el asesino "{murderer.name}" ha ganado!
            </h1>

            <div className="bg-blue-800 p-1 rounded-lg mx-auto w-1/3">
              <img
                src={winnerCardImage}
                alt="Carta de victoria"
                className="w-full h-auto object-contain rounded-sm"
              />
            </div>
          </>
        );

      default:
        return (
          <h1 className="text-3xl font-bold text-gray-300 mb-6">
            Estado desconocido del juego.
          </h1>
        );
    }
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-50"
      style={{ backgroundColor: 'rgba(17, 24, 39, 0.75)' }}
    >
      <div className="bg-gray-900 rounded-lg shadow-xl p-8 max-w-2xl w-[70vw] text-center border-2 border-red-800">

        {renderContent()}

        <button
          onClick={handleGoHome}
          className="mt-6 px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}

export default GameOverModal;