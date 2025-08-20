import React, { createContext, useState, useContext, ReactNode } from 'react';

// current game state
interface GameState {
  gameCode: string;
  playerName: string;
  time: number;
  moves: number;
  gameStarted: boolean;
  gameEnded: boolean;
  gameJoined: boolean;
  shapes: string;
  colors: string;
  difficulty: number;
  startDisabled: boolean;
  setGameCode: (code: string) => void;
  setPlayerName: (name: string) => void;
  setTime: (time: number) => void;
  setMoves: (moves: number) => void;
  setGameStarted: (gameStarted: boolean) => void;
  setGameEnded: (gameEnded: boolean) => void;
  setGameJoined: (gameJoined: boolean) => void;
  setShapes: (code: string) => void;
  setColors: (code: string) => void;
  setDifficulty: (difficulty: number) => void;
  setStartDisabled: (startDisabled: boolean) => void;
}

// creating game context with default values: https://legacy.reactjs.org/docs/context.html
const GameContext = createContext<GameState>({
  gameCode: '',
  playerName: '',
  time: 0,
  moves: 0,
  gameStarted: false,
  gameEnded: false,
  gameJoined: false,
  shapes: '',
  colors: '',
  difficulty: 0,
  startDisabled: true,
  setGameCode: () => {},
  setPlayerName: () => {},
  setTime: () => {},
  setMoves: () => {},
  setGameStarted: () => {},
  setGameEnded: () => {},
  setGameJoined: () => {},
  setShapes: () => {},
  setColors: () => {},
  setDifficulty: () => {},
  setStartDisabled: () => {}
});

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameCode, setGameCode] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [time, setTime] = useState<number>(0);
  const [moves, setMoves] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [gameJoined, setGameJoined] = useState<boolean>(false);
  const [shapes, setShapes] = useState<string>('');
  const [colors, setColors] = useState<string>('');
  const [difficulty, setDifficulty] = useState<number>(0);
  const [startDisabled, setStartDisabled] = useState<boolean>(true);


  return (
    <GameContext.Provider value={{
      gameCode,
      playerName,
      time,
      moves,
      gameStarted,
      gameEnded,
      gameJoined,
      shapes,
      colors,
      difficulty,
      startDisabled,
      setGameCode,
      setPlayerName,
      setTime,
      setMoves,
      setGameStarted,
      setGameEnded,
      setGameJoined,
      setShapes,
      setColors,
      setDifficulty,
      setStartDisabled
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => useContext(GameContext);