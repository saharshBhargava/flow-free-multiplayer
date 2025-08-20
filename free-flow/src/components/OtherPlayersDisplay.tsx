import React, { useEffect, useState } from 'react';
import OtherPlayerCanvas from './OtherPlayerCanvas';
import { returnPlayers } from "../dataManager";
import { useGameContext } from '../GameContext';

let numPlayers:number;

const OtherPlayersDisplay: React.FC = () => {
  const { gameCode, playerName } = useGameContext();
  const [otherPlayers, setOtherPlayers] = useState<string[]>([]);
  
  useEffect(() => {
    const getPlayers = async () => {
      try {
        const allPlayers = await returnPlayers(gameCode);
        const players = allPlayers.filter(name => name !== playerName);
        numPlayers = players.length;
        setOtherPlayers(players);
        console.log(numPlayers);
      } catch (error) {
        console.error("Error getting players:", error);
      }
    };
    
    getPlayers();
    const interval = setInterval(getPlayers, 5000);
    
    return () => clearInterval(interval);
  }, [gameCode, playerName]);
  
  if (!gameCode || gameCode.length === 0) {
    return (
      <div>
        <p>Enter a game code to see other players.</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        {(numPlayers === 0) || (numPlayers > 4) ? (
          <p>No other players in the game yet</p>
        ) : (
          otherPlayers.map(player => (
            <div>
              <OtherPlayerCanvas playerName={player} canvasSize={200} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OtherPlayersDisplay;