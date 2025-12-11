import { useState } from 'react';
import GamePlayerFormContainer from '../containers/Forms/FormContainer';
import background from "../assets/Home-background.png";
import PlayerForm from './PlayerForm';
import { useNavigate } from 'react-router-dom';

const GameForm = ({ initialPlayerCreated = false }) => {
  const {handleCreate} = GamePlayerFormContainer();
  const navigate = useNavigate()

  const [formGameData, setFormGameData] = useState({
    name: '',
    min_players: '',
    max_players: '',
    current_players: 0,
    is_started: false,
    current_turn: 0,
    turn_id_player: 0
  });

  const onSubmitGame = async () => {
    const {game_id, player_id } = await handleCreate({gameData: formGameData, playerData: playerData})
    navigate(`/lobby/${game_id}/${player_id}`);
  };
  
  const [showPlayer, setShowPlayer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [playerCreated, setPlayerCreated] = useState(initialPlayerCreated);
  const [gameCreated, setGameCreated] = useState(false);
  const [playerData, setPlayerData] = useState();

  const validateName = (name) => {
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    return regex.test(name);
  };

  const validateNum = (num) => {
    const regex = /^[2-6]$/;
    return regex.test(num);
  };

  const validateMaxIsEqualOrBiggerThanMin = (name, value) => {
    const num = Number(value);
    if(name === "min_players"){
      return (num <= Number(formGameData.max_players))
    } else {
      return (num >= Number(formGameData.min_players))
    }
  };
  
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'name':
        if (!value.trim()) error = 'El nombre es requerido';
        else if (!validateName(value)) error = "El nombre solo debe contener letras";
        else if (value.length > 15) error = "El nombre debe contener 15 carácteres o menos"
        break;
      
      case 'min_players':
        if (!value.trim()) error = 'La cantidad de jugadores mínima es requerida';
        else if (!validateNum(value)) error = "La cantidad de jugadores debe ser un número, entre 2 y 6";
        else {
          if (formGameData.max_players.trim() && !validateMaxIsEqualOrBiggerThanMin(name, value)) {
            error = "La cantidad de jugadores mínima debe ser menor a la máxima"
          }
        }
        break;  

      case 'max_players':
        if (!value.trim()) error = 'La cantidad de jugadores máxima es requerida';
        else if (!validateNum(value)) error = "La cantidad de jugadores debe ser un número, entre 2 y 6";
        else {
          if (formGameData.min_players.trim() && !validateMaxIsEqualOrBiggerThanMin(name, value)) {
            error = "La cantidad de jugadores máxima debe ser mayor a la mínima"
          }
        } 
        break;
      
      default:
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
      
    setFormGameData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    Object.keys(formGameData).forEach(key => {
      const error = validateField(key, formGameData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitGame = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      await onSubmitGame(formGameData);
      setFormGameData({
        name: '',
        min_players: '',
        max_players: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to create contact. Please check your input and try again.');
    } finally {
      setIsSubmitting(false);
      setGameCreated(true);
    }
  };

  const handleCreatePlayer = (bool) => {
    if(bool){
      setShowPlayer(false);
      setPlayerCreated(true);
    }
  }; 

  const getInputClassName = (fieldName) => {
    const baseClasses = "w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors";
    return `${baseClasses}`;
  };

  return (
    <div
      data-testid="home-bg"
      className="min-h-screen min-w-screen flex items-center justify-center"
      style={{
        backgroundImage: `url(${background})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-black rounded-lg shadow-lg p-8 m-6 border-4 border-black w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4 text-center">Crear partida</h2>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium italic text-white mb-1"
            >
              Nombre de partida *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formGameData.name}
              onChange={handleChange}
              required
              className={`${getInputClassName("name")} placeholder-black w-full`}
              placeholder="Ingresar nombre"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}  
          </div>

          <div>
            <label
              htmlFor="min_players"
              className="block text-sm font-medium italic text-white mb-1"
            >
              Mínima cantidad de jugadores *
            </label>
            <input
              type="text"
              id="min_players"
              name="min_players"
              value={formGameData.min_players}
              onChange={handleChange}
              required
              className={`${getInputClassName("min_players")} placeholder-black w-full`}
              placeholder="Ingresar número"
            />
            {errors.min_players && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.min_players}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="max_players"
              className="block text-sm font-medium italic text-white mb-1"
            >
              Máxima cantidad de jugadores *
            </label>
            <input
              type="text"
              id="max_players"
              name="max_players"
              value={formGameData.max_players}
              onChange={handleChange}
              required
              className={`${getInputClassName("max_players")} placeholder-black w-full`}
              placeholder="Ingresar número"
            />
            {errors.max_players && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.max_players}
              </p>
            )}
          </div>                  

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSubmitGame}
              disabled={!playerCreated || gameCreated ||
                isSubmitting || Object.keys(errors).some((key) => errors[key])
              }
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-800 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Creando..." : "Crear"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {setShowPlayer(true)}}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={playerCreated}
            >
              Crear jugador
            </button>

            {showPlayer && 
              <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"> 
                <PlayerForm 
                  onCreate={handleCreatePlayer} 
                  isOw={true} 
                  fromGameForm={true}
                  onPlayerCreated={(playerPayload) => {setPlayerData(playerPayload)}}
                />
              </div>
            }
          </div>

          <p className="text-white italic"> 
            Debes crear el jugador antes de crear la partida.
          </p> 
        </div> 
      </div> 
    </div>  
  );  
};

export default GameForm;
