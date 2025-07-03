
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.tsx';
import GameOutput from './components/GameOutput.tsx';
import UserInput from './components/UserInput.tsx';
import { GameState, GameLogEntry } from './types.ts';
import { initializeGame, processCommand } from './services/gameService.ts';
import GameOverOverlay from './components/GameOverOverlay.tsx';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const addToLog = useCallback((entry: Omit<GameLogEntry, 'id'>) => {
    setGameState(prevState => {
      if (!prevState) return null;
      const newEntry = { ...entry, id: prevState.log.length };
      return { ...prevState, log: [...prevState.log, newEntry] };
    });
  }, []);
  
  const initGame = useCallback(async () => {
    setIsLoading(true);
    try {
      const { state, message } = await initializeGame();
      // Start with the initial log message
      const initialState = {
          ...state,
          log: [{ id: 0, type: 'system' as const, text: message }]
      };
      setGameState(initialState);
    } catch (error) {
      console.error("Failed to initialize game:", error);
      const errorText = error instanceof Error ? error.message : "Un error desconocido ocurrió.";
      // Need a temporary state to show the error log
      setGameState({
          isInitialized: false,
          log: [{id: 0, type: 'error', text: `Error de inicialización: ${errorText}`}],
          // dummy values for the rest of the state
          currentLocationId: '',
          inventory: [],
          world: { locations: {}, items: {}, enemies: {} },
          playerHealth: 0,
          maxPlayerHealth: 0,
          currentEnemyId: null,
          equippedWeapon: null,
          isGameOver: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed addToLog dependency as it's now self-contained

  useEffect(() => {
    // We only want to initialize on the very first load when gameState is null.
    if (gameState === null) {
      initGame();
    }
  }, [gameState, initGame]);

  const handleUserInput = async (command: string) => {
    if (!gameState || gameState.isGameOver || isLoading) return;

    // Use a function for state update to ensure we have the latest state
    setGameState(prevState => {
        if (!prevState) return null;
        const newEntry = { type: 'player' as const, text: command, id: prevState.log.length };
        return { ...prevState, log: [...prevState.log, newEntry] };
    });

    setIsLoading(true);

    try {
      // We operate on a fresh copy of the latest state
      const stateForCommand = JSON.parse(JSON.stringify(gameState));
      const { newState, newLogs } = await processCommand(command, stateForCommand);
      
      // We directly set the new state, but append the new logs to its own log
      setGameState(currentState => {
          if (!currentState) return newState; // Should not happen
          const combinedLogs = [...currentState.log, ...newLogs.map((log, index) => ({...log, id: currentState.log.length + index}))];
          return {...newState, log: combinedLogs };
      });

    } catch (error) {
        console.error("Error processing command:", error);
        addToLog({ type: 'error', text: "El mundo se retuerce y el comando se pierde en el vacío." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = useCallback(() => {
    setGameState(null); // This will trigger the useEffect to re-initialize the game
  }, []);


  return (
    <div className="relative bg-black text-green-400 min-h-screen flex flex-col font-mono" style={{backgroundImage: 'radial-gradient(rgba(0, 255, 0, 0.05) 1px, transparent 1px)', backgroundSize: '15px 15px'}}>
      {gameState?.isGameOver && <GameOverOverlay onRestart={handleRestart} />}
      <Header 
        health={gameState?.playerHealth}
        maxHealth={gameState?.maxPlayerHealth}
      />
      <main className="flex-grow flex flex-col overflow-hidden">
        <GameOutput log={gameState?.log || []} isLoading={isLoading && gameState !== null} />
        <UserInput onSubmit={handleUserInput} disabled={isLoading || !gameState?.isInitialized || !!gameState?.isGameOver} />
      </main>
    </div>
  );
};

export default App;