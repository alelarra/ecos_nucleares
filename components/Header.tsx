
import React from 'react';

interface HeaderProps {
  health?: number;
  maxHealth?: number;
}

const Header: React.FC<HeaderProps> = ({ health, maxHealth }) => {
  const healthPercentage = (health !== undefined && maxHealth !== undefined && maxHealth > 0) 
    ? (health / maxHealth) * 100 
    : 0;

  return (
    <header className="w-full bg-black/70 backdrop-blur-sm border-b-2 border-green-500 p-4 text-center shadow-lg shadow-green-500/20 sticky top-0 z-10">
      <h1 className="text-4xl md:text-5xl font-bold text-green-400 tracking-widest">
        ECOS NUCLEARES
      </h1>
      {health !== undefined && maxHealth !== undefined && (
        <div className="mt-3 text-lg text-green-300">
          <span className="mb-1 block tracking-wider text-base">{`ESTADO: ${health} / ${maxHealth}`}</span>
          <div className="w-full max-w-xs mx-auto bg-green-900/50 rounded-full border-2 border-green-700 h-4 overflow-hidden">
            <div
              className="bg-green-500 h-full rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${healthPercentage}%` }}
              role="progressbar"
              aria-valuenow={health}
              aria-valuemin={0}
              aria-valuemax={maxHealth}
              aria-label="Barra de salud"
            ></div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
