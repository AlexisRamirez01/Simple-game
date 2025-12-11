const CARD_MAP = {
	'detective_poirot': 'HERCULE_POIROT',
	'detective_marple': 'MISS_MARPLE',
	'detective_tommyberesford': 'TOMMY_BERESFORD',
	'detective_tuppenceberesford': 'TUPPENCE_BERESFORD',
	'detective_brent': 'LADY_EILEEN',
	'detective_satterthwaite': 'MR_SATTERTHWAITE',
	'detective_pyne': 'PARKER_PYNE',
	'detective_quin': 'HARLEY_QUIN_WILDCARD',
	'detective_oliver': 'ARIADNE_OLIVER',
};

const BASE_SET_EFFECTS = {
	'HERCULE_POIROT': { action_secret: 'reveal_your', is_cancellable: true },
	'MISS_MARPLE': { action_secret: 'reveal_your', is_cancellable: true },
	'TOMMY_BERESFORD': { action_secret: 'reveal_their', is_cancellable: true },
	'TUPPENCE_BERESFORD': { action_secret: 'reveal_their', is_cancellable: true },
	'LADY_EILEEN': { action_secret: 'reveal_their', is_cancellable: true }, 
	'MR_SATTERTHWAITE': { action_secret: 'reveal_their', is_cancellable: true },
	'PARKER_PYNE': { action_secret: 'hide', is_cancellable: true }
};

const REQUIRED_AMOUNTS = {
	'HERCULE_POIROT': 3, 'MISS_MARPLE': 3, 'TOMMY_BERESFORD': 2, 
	'TUPPENCE_BERESFORD': 2, 'LADY_EILEEN': 2, 
	'MR_SATTERTHWAITE': 2, 'PARKER_PYNE': 2
};

const QUIN_NAME = CARD_MAP['detective_quin'];
const OLIVER_NAME = CARD_MAP['detective_oliver'];
const TOMMY_NAME = CARD_MAP['detective_tommyberesford'];
const TUPPENCE_NAME = CARD_MAP['detective_tuppenceberesford'];

const initialResult = {
	isValid: false,
	detectiveName: null,
	action_secret: null,
	is_cancellable: null,
	wildcard_effects: null,
	error: null,
};

const getDetectiveName = (backendName) => CARD_MAP[backendName.toLowerCase()] || backendName.toUpperCase();

export function detectiveSetValidator(selectedCards) {
    
	if (!selectedCards || selectedCards.length === 0) {
		return { ...initialResult, error: 'No se seleccionaron cartas.' };
	}

	const cardNames = selectedCards.map(card => card.name);

	const principalNames = cardNames.map(getDetectiveName);
	const quinCount = principalNames.filter(name => name === QUIN_NAME).length;
	const oliverCount = principalNames.filter(name => name === OLIVER_NAME).length;
	const nonWildcards = principalNames.filter(name => name !== QUIN_NAME && name !== OLIVER_NAME);


	if (oliverCount > 0) {
		return { ...initialResult, error: 'Ariadne Oliver no puede jugarse como un set inicial.' };
	}
	
	if (nonWildcards.length === 0) {
		return { ...initialResult, error: 'El set debe contener al menos una carta de detective principal.' };
	}

	const principalName = nonWildcards[0];
	const isSpecialBeresfordSet = (
		nonWildcards.length === 2 && 
		principalNames.includes(TOMMY_NAME) && 
		principalNames.includes(TUPPENCE_NAME)
	);

	let hasDifferentDetective = nonWildcards.some(name => name !== principalName);

	if (isSpecialBeresfordSet) {
		hasDifferentDetective = false;
	}

	if (hasDifferentDetective) {
		return { ...initialResult, error: 'Todas las cartas deben ser del mismo detective principal.' };
	}
	
	const baseName = isSpecialBeresfordSet ? TOMMY_NAME : principalName;
	const required = REQUIRED_AMOUNTS[baseName];

	if (!required) {
		return { ...initialResult, error: `El detective ${baseName} no forma un set estándar.` };
	}

	const expectedTotal = required;
	const totalSelected = selectedCards.length;
	
	if (totalSelected !== expectedTotal) {
		return { ...initialResult, error: `Se requieren ${expectedTotal} cartas, se seleccionaron ${totalSelected}.` };
	}
	
	const detectiveKey = isSpecialBeresfordSet ? TOMMY_NAME : principalName;
	let finalEffects = BASE_SET_EFFECTS[detectiveKey] ? { ...BASE_SET_EFFECTS[detectiveKey] } : { ...initialResult };
	finalEffects.detectiveName = isSpecialBeresfordSet ? 'TOMMY & TUPPENCE' : principalName;
	finalEffects.isValid = true;
	
	
	if (isSpecialBeresfordSet) {
		finalEffects.is_cancellable = false;
	}
	
	if (quinCount === 1 && principalName === CARD_MAP['detective_satterthwaite']) {
		finalEffects.wildcard_effects = 'Satterthwaite';
	} else {
		finalEffects.wildcard_effects = null; 
	}

	return finalEffects;
}

export function addDetectiveSetValidator(cardToAdd, existingSet) {
	const cardName = getDetectiveName(cardToAdd.name);
	const mainDetective = existingSet.main_detective

	if (cardName === QUIN_NAME) {
		return { ok: false, error: "HARLEY QUIN no puede agregarse a un set existente." };
	}
	const isMainBeresford =
		mainDetective === TOMMY_NAME || mainDetective === TUPPENCE_NAME;

	const isCardBeresford =
		cardName === TOMMY_NAME || cardName === TUPPENCE_NAME;

	if (isMainBeresford) {
		if (!isCardBeresford) {
			return { ok: false, error: "Este set solo acepta TOMMY o TUPPENCE." };
		}

		const mixResult = shouldFlipToNonCancellable(existingSet.cards, cardName);

		return { 
			ok: true, 
			detectiveSet: existingSet,
			flipToNonCancellable: mixResult
		};
	}

	if (cardName !== mainDetective) {
		return { ok: false, error: `No podés agregar ${cardName} a un set de ${mainDetective}.` };
	}

	return { ok: true, detectiveSet: existingSet, flipToNonCancellable: false };
}

function shouldFlipToNonCancellable(currentCards, newCardName) {
	const names = currentCards.map(c => getDetectiveName(c.name));
	const tommyCount = names.filter(n => n === TOMMY_NAME).length + (newCardName === TOMMY_NAME ? 1 : 0);
	const tuppenceCount = names.filter(n => n === TUPPENCE_NAME).length + (newCardName === TUPPENCE_NAME ? 1 : 0);

	return (tommyCount > 0 && tuppenceCount > 0);
}


export function validateOliverAddition(oliverCard, existingSet) {
	if (getDetectiveName(oliverCard.name) !== OLIVER_NAME) {
		return { ...initialResult, error: 'La carta seleccionada para añadir no es Ariadne Oliver.' };
	}
	if (!existingSet) {
		return { ...initialResult, error: 'Debe seleccionar un set existente en la mesa para añadir a Ariadne Oliver.' };
	}
	const newEffects = {
		...existingSet,
		cards: [...(existingSet.cards || [])],
		isValid: true,
		action_secret: "reveal_their",
		is_cancellable: existingSet.is_cancellable,
	};

	if (newEffects && oliverCard) {
		newEffects.cards.push(oliverCard);
	}
    return newEffects;
}