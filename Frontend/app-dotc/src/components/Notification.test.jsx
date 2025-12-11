import { render, screen, act, cleanup, waitFor } from '@testing-library/react';
import { useNotification, NotificationProvider } from './NotificationContext';

describe('Componente de Notificación Reutilizable (Context & Timer)', () => {
	const TestChildren = (
		<div data-testid="test-content" className="flex flex-row gap-2">
			<span data-testid="card-1">Card A</span>
			<span data-testid="card-2">Card B</span>
		</div>
	);

	const TestConsumer = ({ childrenToPass = TestChildren, duration = 1000 }) => {
		const { showNotification } = useNotification();
		return (
			<button 
				data-testid="test-trigger" 
				onClick={() => showNotification(childrenToPass, 'Título del Test', duration)}
			>
				Mostrar Notificación
			</button>
		);
	};

	const renderTestRig = (duration) => {
		return render(
			<NotificationProvider>
				<TestConsumer duration={duration} />
			</NotificationProvider>
		);
	};

	afterEach(() => {
		cleanup();
	});

	it('1. No debería haber notificación visible al inicio', () => {
		renderTestRig();
		expect(screen.queryByText('Título del Test')).not.toBeInTheDocument();
		expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
	});

	it('2. Debería mostrar la notificación con el contenido JSX y título al ser disparada', () => {
		renderTestRig();
		act(() => {
				screen.getByTestId('test-trigger').click();
		});
		expect(screen.getByText('Título del Test')).toBeInTheDocument();
		expect(screen.getByTestId('test-content')).toBeInTheDocument();
		expect(screen.getByTestId('card-1')).toBeInTheDocument();
	});
	it('3. Debería desaparecer después de la duración especificada', async () => {
		const DURATION = 50;
		renderTestRig(DURATION);
		act(() => {
				screen.getByTestId('test-trigger').click();
		});
		expect(screen.getByText('Título del Test')).toBeInTheDocument();
		await waitFor(() => {
				expect(screen.queryByText('Título del Test')).not.toBeInTheDocument();
				expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
		}, { timeout: 1000 });
	}, 1500);

	it('4. Debería desaparecer más rápido cuando se le pasa una duración corta (10ms)', async () => {
		const DURATION = 10;
		renderTestRig(DURATION);
		act(() => {
				screen.getByTestId('test-trigger').click();
		});
		expect(screen.getByText('Título del Test')).toBeInTheDocument();
		await waitFor(() => {
				expect(screen.queryByText('Título del Test')).not.toBeInTheDocument();
		}, { timeout: 500 }); 
	});
	it('5. No debería renderizarse si showNotification se llama con children nulo (null)', () => {
		const TestNullConsumer = () => {
			const { showNotification } = useNotification();
			return (
				<button 
					data-testid="null-trigger" 
					onClick={() => showNotification(null, 'Título Nulo')}
				>
					Mostrar Nulo
				</button>
			);
		};
		render(
			<NotificationProvider>
				<TestNullConsumer />
			</NotificationProvider>
		);
		act(() => {
			screen.getByTestId('null-trigger').click();
		});
		expect(screen.queryByText('Título Nulo')).not.toBeInTheDocument();
	});
});
