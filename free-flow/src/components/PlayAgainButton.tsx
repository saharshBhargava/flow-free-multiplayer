import { useGameContext } from '../GameContext';
import '../index.css'; 

const PlayAgainButton = () => {

  const { gameEnded } = useGameContext();

  if (!gameEnded) return null;

  return (
    <div>
      <button
        onClick={() => window.location.reload()}>
        Play Again
      </button>
    </div>
  );
};

export default PlayAgainButton;
