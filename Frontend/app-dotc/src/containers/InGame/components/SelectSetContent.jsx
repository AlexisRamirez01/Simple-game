import React, { useState } from 'react';
import Cards from './Cards';

function SelectSetContent({ setsData = [], onSetSelected, actionButton }) {
	const [selectedSetId, setSelectedSetId] = useState(null);

	const selectionClass = "outline-4 outline-yellow-400 outline-offset-[-4px]";

	return (
		<div className="flex flex-col items-center w-full">

			<div className="flex flex-wrap justify-center gap-4">
				{setsData.length > 0 ? (
					setsData.map((set) => (
						<div
							key={set.id}
							data-testid={`set-container-${set.id}`}
							onClick={() => setSelectedSetId(set.id)}
							className={`p-2 rounded-lg cursor-pointer transition-all duration-200 ${selectedSetId === set.id ? selectionClass : 'outline-4 outline-transparent'
								}`}
						>
							<Cards cards={set.cards} isModalView />
						</div>
					))
				) : (
					<p className="text-white/70">Este jugador no tiene sets.</p>
				)}
			</div>

			<button
				onClick={() => onSetSelected(selectedSetId)}
				disabled={selectedSetId === null || setsData.length === 0}
				className={`mt-6 px-6 py-2 rounded-lg text-black font-semibold shadow-md transition-colors duration-200 ${selectedSetId !== null
					? 'bg-yellow-500 hover:bg-yellow-600'
					: 'bg-gray-500 cursor-not-allowed'
					}`}
			>
				{actionButton}
			</button>
		</div>
	);
}

export default SelectSetContent;