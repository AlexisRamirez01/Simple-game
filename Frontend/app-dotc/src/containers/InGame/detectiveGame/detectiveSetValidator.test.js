import { detectiveSetValidator, validateOliverAddition, addDetectiveSetValidator } from './detectiveSetValidator';

const POIROT = 'detective_poirot';
const MARPLE = 'detective_marple';
const TOMMY = 'detective_tommyberesford';
const TUPPENCE = 'detective_tuppenceberesford';
const BRENT = 'detective_brent';
const SATTY = 'detective_satterthwaite';
const PYNE = 'detective_pyne';
const QUIN = 'detective_quin';
const OLIVER = 'detective_oliver';

const existingSets = {
	POIRETT_BASE: { 
		detectiveName: 'HERCULE_POIROT',
		action_secret: 'reveal_your',
		is_cancellable: true,
		wildcard_effects: null
	},
	SATTY_QUAIN: { 
		detectiveName: 'MR_SATTERTHWAITE',
		action_secret: 'reveal_your',
		is_cancellable: true,
		wildcard_effects: 'Satterthwaite'
	},
};

const TOMMY_BASE = { 
    detectiveName: 'TOMMY_BERESFORD',
    action_secret: 'reveal_their',
    is_cancellable: true,
    wildcard_effects: null,
    main_detective: "TOMMY_BERESFORD",
    cards: [{ name: TOMMY }, { name: TOMMY }]
};

const BERESFORD_NON_CANCELABLE = { 
    detectiveName: 'TOMMY & TUPPENCE',
    action_secret: 'reveal_their',
    is_cancellable: false,
    wildcard_effects: null,
    main_detective: "TOMMY_BERESFORD",
    cards: [{ name: TOMMY }, { name: TUPPENCE }]
};

const POIROT_BASE_EXPANDABLE = { 
    detectiveName: 'HERCULE_POIROT',
    action_secret: 'reveal_your',
    is_cancellable: true,
    wildcard_effects: null,
    main_detective: "HERCULE_POIROT",
    cards: [{ name: POIROT }, { name: POIROT }, { name: POIROT }]
};


describe('detectiveSetValidator (Jugada Inicial)', () => {
	test('C1. Debe validar un set de Poirot (3 cartas)', () => {
		const set = [{ name: POIROT }, { name: POIROT }, { name: POIROT }];
		const result = detectiveSetValidator(set);
		expect(result.isValid).toBe(true);
		expect(result.detectiveName).toBe('HERCULE_POIROT');
		expect(result.action_secret).toBe('reveal_your');
		expect(result.wildcard_effects).toBe(null);
	});

	test('C3. Debe validar un set de Pyne (2 cartas) con acción "hide"', () => {
		const set = [{ name: PYNE }, { name: PYNE }];
		const result = detectiveSetValidator(set);
		expect(result.isValid).toBe(true);
		expect(result.detectiveName).toBe('PARKER_PYNE');
		expect(result.action_secret).toBe('hide');
	});

	test('C4. Debe fallar por cantidad incorrecta (Marple necesita 3, tiene 2)', () => {
		const set = [{ name: MARPLE }, { name: MARPLE }];
		const result = detectiveSetValidator(set);
		expect(result.isValid).toBe(false);
		expect(result.error).toContain('Se requieren 3 cartas, se seleccionaron 2.');
	});

	test('C5. Debe fallar por mezcla de detectives', () => {
		const set = [{ name: MARPLE }, { name: POIROT }, { name: POIROT }];
		const result = detectiveSetValidator(set);
		expect(result.isValid).toBe(false);
		expect(result.error).toContain('Todas las cartas deben ser del mismo detective principal.');
	});

	test('C2. Debe validar set con un comodín (Poirot + Quin)', () => {
		const set = [{ name: POIROT }, { name: POIROT }, { name: QUIN }];
		const result = detectiveSetValidator(set);
		expect(result.isValid).toBe(true);
		expect(result.detectiveName).toBe('HERCULE_POIROT');
	});

	test('C7. Debe fallar si solo se juega el comodín', () => {
		const set = [{ name: QUIN }, { name: QUIN }];
		const result = detectiveSetValidator(set);
		expect(result.isValid).toBe(false);
		expect(result.error).toContain('debe contener al menos una carta de detective principal.');
	});

	test('C9. Debe validar el set especial Tommy + Tuppence como NO cancelable', () => {
		const set = [{ name: TOMMY }, { name: TUPPENCE }];
		const result = detectiveSetValidator(set);
		expect(result.isValid).toBe(true);
		expect(result.detectiveName).toBe('TOMMY & TUPPENCE');
		expect(result.is_cancellable).toBe(false);
	});

	test('C10. Debe validar Satterthwaite + Quin y aplicar efecto', () => {
		const set = [{ name: SATTY }, { name: QUIN }];
		const result = detectiveSetValidator(set);
		expect(result.isValid).toBe(true);
		expect(result.detectiveName).toBe('MR_SATTERTHWAITE');
		expect(result.wildcard_effects).toBe('Satterthwaite');
	});
	
	test('C11. Debe ser cancelable si solo es Tommy x2', () => {
		const set = [{ name: TOMMY }, { name: TOMMY }];
		const result = detectiveSetValidator(set);
		expect(result.isValid).toBe(true);
		expect(result.detectiveName).toBe('TOMMY_BERESFORD');
		expect(result.is_cancellable).toBe(true);
	});

	test('C8. Debe fallar si se intenta jugar Oliver como set inicial', () => {
		const set = [{ name: POIROT }, { name: POIROT }, { name: OLIVER }];
		const result = detectiveSetValidator(set);
		expect(result.isValid).toBe(false);
		expect(result.error).toContain('Ariadne Oliver no puede jugarse como un set inicial.');
	});
});


describe('validateOliverAddition (Añadir a Set Existente)', () => {
	test('O1. Debe añadir el efecto Oliver a un set base de Poirot', () => {
		const result = validateOliverAddition({ name: OLIVER }, existingSets.POIRETT_BASE);
		expect(result.isValid).toBe(true);
		expect(result.action_secret).toBe('reveal_their');
	});

	test('O2. Debe añadir Oliver y mantener el efecto Satterthwaite (doble efecto)', () => {
		const result = validateOliverAddition({ name: OLIVER }, existingSets.SATTY_QUAIN);
		expect(result.isValid).toBe(true);
	});

	test('O3. Debe fallar si la carta añadida no es Oliver', () => {
		const result = validateOliverAddition({ name: POIROT }, existingSets.POIRETT_BASE);
		expect(result.isValid).toBe(false);
		expect(result.error).toContain('La carta seleccionada para añadir no es Ariadne Oliver.');
	});
	
	test('O4. Debe fallar si no hay set existente en la mesa', () => {
		const result = validateOliverAddition({ name: OLIVER }, null);
		expect(result.isValid).toBe(false);
		expect(result.error).toContain('Debe seleccionar un set existente');
	});
});

describe('addDetectiveSetValidator (Añadir a Set Existente - Carta Principal)', () => {
    test('A1. Debe permitir añadir una carta del mismo detective principal (Poirot)', () => {
        const result = addDetectiveSetValidator({ name: POIROT }, POIROT_BASE_EXPANDABLE);
        expect(result.ok).toBe(true);
        expect(result.flipToNonCancellable).toBe(false);
    });

    test('A2. Debe fallar si la carta añadida no coincide con el set principal', () => {
        const marpleBase = { 
            ...POIROT_BASE_EXPANDABLE, 
            main_detective: "MISS_MARPLE"
        };
        const result = addDetectiveSetValidator({ name: POIROT }, marpleBase);
        expect(result.ok).toBe(false);
        expect(result.error).toContain('No podés agregar HERCULE_POIROT a un set de MISS_MARPLE.');
    });

    test('A3. Debe fallar si se intenta añadir un comodín QUIN', () => {
        const result = addDetectiveSetValidator({ name: QUIN }, POIROT_BASE_EXPANDABLE);
        expect(result.ok).toBe(false);
        expect(result.error).toContain('HARLEY QUIN no puede agregarse a un set existente.');
    });
});

describe('addDetectiveSetValidator (Añadir a Set Beresford)', () => {
    test('B1. Debe permitir añadir Tuppence a un set de Tommy (debe volverse NO cancelable)', () => {
        const result = addDetectiveSetValidator({ name: TUPPENCE }, TOMMY_BASE);

        expect(result.flipToNonCancellable).toBe(true); 
    });
    
    test('B2. Debe permitir añadir Tommy a un set de Tommy & Tuppence (debe seguir NO cancelable)', () => {
        const result = addDetectiveSetValidator({ name: TOMMY }, BERESFORD_NON_CANCELABLE);
        expect(result.ok).toBe(true);
        expect(result.flipToNonCancellable).toBe(true); 
    });

    test('B3. Debe permitir añadir Tommy a un set de Tommy (debe seguir cancelable)', () => {
        const result = addDetectiveSetValidator({ name: TOMMY }, TOMMY_BASE);
        expect(result.ok).toBe(true);
        expect(result.flipToNonCancellable).toBe(false); 
    });

    test('B4. Debe fallar si se intenta añadir otro detective a un set Beresford', () => {
        const result = addDetectiveSetValidator({ name: POIROT }, TOMMY_BASE);
        expect(result.ok).toBe(false);
        expect(result.error).toContain('Este set solo acepta TOMMY o TUPPENCE.');
    });
});