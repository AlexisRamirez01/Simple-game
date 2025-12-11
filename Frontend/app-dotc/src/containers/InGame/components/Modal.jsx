import React from "react";

export default function FullScreenCardsModal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white/10 border border-white/20 backdrop-blur-md text-white 
                  rounded-2xl p-6 flex flex-col items-center 
                  w-11/12 max-w-3xl shadow-2xl transition-all duration-300">
        <h3 className="text-2xl font-bold mb-4 text-center">{title}</h3>
        <div className="flex flex-row gap-4 overflow-x-auto">
          {children}
        </div>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg 
                 text-white font-semibold shadow-md transition-colors duration-200"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

