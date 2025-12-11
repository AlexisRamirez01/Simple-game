import GameItem from './GameItem';

function GameList({games}) {
	return (
		<div>
			<h2 className="text-xl md:text-2xl font-bold mb-4 text-white text-center md:text-left">
				{games.length > 0 ? "Partidas disponibles" : "No hay partidas disponibles"}
			</h2>
			<div className='flex flex-col w-full h-full gap-4'>
				{games.map(game => (
					<GameItem
						key={game.id}
						game={game}
					/>
				))}
			</div>
		</div>
	)
}

export default GameList