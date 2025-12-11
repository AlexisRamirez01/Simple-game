import { useState } from "react";
import av1 from "../assets/av1.png";
import av2 from "../assets/av2.png";
import av3 from "../assets/av3.png";
import av4 from "../assets/av4.png";
import av5 from "../assets/av5.png";
import av6 from "../assets/av6.png";

const Avatar = ({onSelect}) => {

	const handleClick = (img) => {
		onSelect(img)
	}

	return (
		<>
			<div className="flex flex-col space-y-10 justify-center items-center min-h-screen">        
						
				<div className="flex space-x-10 justify-center items-center">
				 	<img
						alt="Avatar 1"
						src={av1}
						className="inline-block w-50 h-50 ring-2 ring-white outline -outline-offset-1 outline-black/5 hover:scale-110 hover:brightness-110 transition-transform duration-300"
						onClick={() => handleClick(av1)}
					/>
					<img
						alt="Avatar 2"
						src={av2}
						className="inline-block w-50 h-50 ring-2 ring-white outline -outline-offset-1 outline-black/5 hover:scale-110 hover:brightness-110 transition-transform duration-300"
						onClick={() => handleClick(av2)}
					/>
				</div>

				<div className="flex space-x-10 justify-center items-center">
					<img
						alt="Avatar 3"
						src={av3}
						className="inline-block w-50 h-50 ring-2 ring-white outline -outline-offset-1 outline-black/5 hover:scale-110 hover:brightness-110 transition-transform duration-300"
						onClick={() => handleClick(av3)}
					/>
					<img
						alt="Avatar 4"
						src={av4}
						className="inline-block w-50 h-50 ring-2 ring-white outline -outline-offset-1 outline-black/5 hover:scale-110 hover:brightness-110 transition-transform duration-300"
						onClick={() => handleClick(av4)}
					/>
				</div>

				<div className="flex space-x-10 justify-center items-center">
					<img
						alt="Avatar 5"
						src={av5}
						className="inline-block w-50 h-50 ring-2 ring-white outline -outline-offset-1 outline-black/5 hover:scale-110 hover:brightness-110 transition-transform duration-300"
						onClick={() => handleClick(av5)}
					/>
					<img
						alt="Avatar 6"
						src={av6}
						className="inline-block w-50 h-50 ring-2 ring-white outline -outline-offset-1 outline-black/5 hover:scale-110 hover:brightness-110 transition-transform duration-300"
						onClick={() => handleClick(av6)}
					/>
				</div>
			</div>
		</>
	)
}
	
	export default Avatar;