
import React, { useState } from 'react';
import { GameEngine } from './components/GameEngine';
import { MainMenu } from './components/MainMenu';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      {!gameStarted ? (
        <MainMenu onStart={() => setGameStarted(true)} />
      ) : (
        <GameEngine />
      )}
    </div>
  );
}
