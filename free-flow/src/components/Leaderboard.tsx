import { useNavigate } from 'react-router-dom'
import { getPlayersByTime } from '../dataManager';
import { useEffect, useState } from 'react';
import { useGameContext } from '../GameContext';

function Leaderboard() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<any[]>([]);
  const { gameCode } = useGameContext();

  useEffect(() => {
      const fetchPlayers = (playerList: any[]) => {
      setPlayers(playerList);
    };
    
    getPlayersByTime(gameCode, fetchPlayers);
  }, []);
}

export default Leaderboard
