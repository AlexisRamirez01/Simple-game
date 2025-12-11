import { useState } from 'react';
import Avatar from './Avatar';
import GamePlayerFormContainer from '../containers/Forms/FormContainer';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import background from "../assets/Home-background.png";

const PlayerForm = ({ onCreate, isOw=false, createdShowAvatar=false, fromGameForm=false, onPlayerCreated }) => {
  const {handleCreate} = GamePlayerFormContainer();
  const {id} = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    birthdate: '',
    avatar: '',
    is_Owner: isOw,
    is_Social_Disgrace: false,
    is_Your_Turn: false,
    rol: 'innocent'
  });

  const onSubmit = async (payload, game_id) => {
    const {player_id} = await handleCreate({playerData: payload, game_id: game_id});
    navigate(`/lobby/${game_id}/${player_id}`);
  };
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAvatar, setShowAvatar] = useState(createdShowAvatar);

  const validateName = (name) => {
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    return regex.test(name);
  };

  const validateDateFormat = (date) => {
    const dateRegex = /^(0[1-9]|[1-9]|[12][0-9]|3[01])\/(0[1-9]|[1-9]|1[0-2])$/;
    return dateRegex.test(date);
  };
  
  const validateDateInMonth = (date) => {
    const [dayStr, monthStr] = date.split('/');
    const day = Number(dayStr);
    const month = Number(monthStr);

    const daysInMonth = {
      1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
      7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
    };

    if (day > daysInMonth[month]) return false;
    return true;
  };

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'name':
        if (!value.trim()) error = 'El nombre es requerido';
        else if (!validateName(value)) error = "El nombre solo debe contener letras";
        else if (value.length > 15) error = "El nombre debe contener 15 carácteres o menos"
        break;
      
      case 'birthdate':
        if (!value.trim()) error = "La fecha de cumpleaños es requerida";
        else if (!validateDateFormat(value)) {
          error = "La fecha ingresada no es válida";
          break;
        } else if (!validateDateInMonth(value)) error = "La fecha ingresada no es válida";
        break;

      case 'avatar':
        if(!value.trim()) error = "El avatar es requerido";
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
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

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      onCreate(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const avatarUrl = formData.avatar.startsWith("http")
        ? formData.avatar
        : `${window.location.origin}${formData.avatar.replace(/^\/?/, "/")}`;

      const [day, month] = formData.birthdate.split("/");
      const fixedYear = 2000;
      const formattedDate = `${fixedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      const payload = {
        ...formData,
        birthdate: formattedDate,
        avatar: avatarUrl,
      };


      if (!fromGameForm) {
        await onSubmit(payload, id);
      } else {
        onPlayerCreated?.(payload);
      }

      setFormData({
        name: '',
        birthdate: '',
        avatar: '',
        is_Owner: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to create contact. Please check your input and try again.');
    } finally {
      setIsSubmitting(false);
    }

    if (isOw) onCreate(true);
  };

  const handleSelect = (imgPath) => {
    setFormData(prev => ({
      ...prev,
      ['avatar']: imgPath
    }));

    if (errors['avatar']) {
      setErrors(prev => ({
        ...prev,
        ['avatar']: ''
      }));
    }

    setShowAvatar(false);
  };

  const getInputClassName = (fieldName) => {
    const baseClasses = "w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors";
    const errorClasses = errors[fieldName] 
      ? "border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400" 
      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400";
    return `${baseClasses} ${errorClasses}`;
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
        <h2 className="text-xl font-bold text-white mb-4 text-center">Crear jugador</h2>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium italic text-white mb-1"
            >
              Nombre *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
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
              htmlFor="birthdate"
              className="block text-sm font-medium italic text-white mb-1"
            >
              Fecha de cumpleaños *
            </label>
            <input
              type="text"
              id="birthdate"
              name="birthdate"
              value={formData.birthdate}
              onChange={handleChange}
              required
              className={`${getInputClassName("birthdate")} placeholder-black w-full`}
              placeholder="dd/mm"
            />
            {errors.birthdate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.birthdate}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { handleSubmit(); }}
              disabled={isSubmitting || Object.keys(errors).some((key) => errors[key])}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-800 dark:hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Creando..." : "Crear!"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {setShowAvatar(true)}}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Elegir avatar
            </button>

            {showAvatar && 
              <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                <Avatar onSelect={handleSelect} />
              </div>
            }

            {errors.avatar && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.avatar}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );  
};

export default PlayerForm;

