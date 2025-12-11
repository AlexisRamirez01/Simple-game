import React from 'react';

function Card({ image, isActive, onActivate, onDeactivate, className, onClick, 
                activeClass = "scale-200 -translate-y-16 z-50", disableScale = false }) {

    const baseClasses = `
        w-32 h-40 rounded-2xl shadow-lg 
        overflow-hidden transition-all duration-300 ease-in-out
        ${className}`;

    const scaleClasses = disableScale
      ? "hover:scale-110"
      : isActive
        ? activeClass
        : "hover:scale-110";

    return (
        <div
        className={`${baseClasses} ${scaleClasses}`}
        style={{ transformOrigin: "center bottom" }}
        onMouseDown={disableScale ? undefined : onActivate}
        onMouseUp={disableScale ? undefined : onDeactivate}
        onMouseLeave={disableScale ? undefined : onDeactivate}
        onTouchStart={disableScale ? undefined : onActivate}
        onTouchEnd={disableScale ? undefined : onDeactivate}
        onClick={onClick}
        >
        <img
            src={image}
            alt="carta"
            className="w-full h-full object-cover bg-white"
        />
        </div>
    );
}

export default Card;
