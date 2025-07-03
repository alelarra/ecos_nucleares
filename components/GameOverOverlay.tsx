
import React from 'react';

interface GameOverOverlayProps {
    onRestart: () => void;
}

const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ onRestart }) => {
    return (
        <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center z-20">
            <h2 className="text-8xl font-extrabold text-red-600 tracking-widest animate-pulse">
                HAS MUERTO
            </h2>
            <p className="text-gray-300 text-2xl mt-4">El páramo te ha reclamado.</p>
            <button
                onClick={onRestart}
                className="mt-8 px-8 py-4 bg-red-700 text-white font-bold text-xl uppercase tracking-wider rounded-md border-2 border-red-500 hover:bg-red-600 transition-colors duration-300"
            >
                Volver a Intentar
            </button>
        </div>
    );
};

export default GameOverOverlay;
