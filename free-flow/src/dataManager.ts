import { database } from './firebase';
import { ref, set, onValue, get, update, remove } from 'firebase/database';
import { gameState } from "./game/GameStateInstance";

var code = "00000";
var name = "playerName";
var lastSaveTime = 0;
// Generate a random game code
export const generateGameCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Check if game code exists
export const checkIfGameCodeExists = async (gameCode: string) => {
  const gameRef = ref(database, `games/${gameCode}`);
  const snapshot = await get(gameRef);
  return snapshot.exists();
};

export const checkGameStartedEveryone = async (gameCode: string) => {
  const gameRef = ref(database, `games/${gameCode}`);
  const snapshot = await get(gameRef);
  return snapshot.exists() && snapshot.val().gameStarted === true;
};

// Create a new game 
export const createGame = async (gameCode: string, puzzleId: string, difficulty: number = 2) => {
  await set(ref(database, `games/${gameCode}`), {
    puzzleId,
    active: true,
    gameStartedEveryone: false,
    difficulty: difficulty 
  });
  code = gameCode;
  return gameCode;
};

export const deleteGame = (gameCode: string) => {
  remove(ref(database, `games/${gameCode}`)), {};
};

export const startGameInDatabase = (gameCode: string) => {
  const gameRef = ref(database, `games/${gameCode}`);
  return update(gameRef, { gameStartedEveryone: true });
};

/* returnPlayers('gameCode')
  .then(players => {
    loop thru all the players
  })
  .catch(issue => {
    when no players or nonexistent game then throw console error
  });
*/
export const returnPlayers = (gameCode: string) => {
  const gameRef = ref(database, `games/${gameCode}`);
  
  return get(gameRef).then(snapshot => {
    if (!snapshot.exists()) {
      throw new Error("Game not found");
    }
    
    const gameData = snapshot.val();
    const players = gameData.players ? Object.keys(gameData.players) : [];
    return players;
  });
}

// Get game difficulty
export const getGameDifficulty = async (gameCode: string) => {
  const gameRef = ref(database, `games/${gameCode}`);
  const snapshot = await get(gameRef);
  
  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }
  
  return snapshot.val().difficulty || 2; // Default to medium difficulty if not specified
};

// Join a game
export const joinGame = async (gameCode: string, playerName: string) => {
  // Check if game exists
  const gameRef = ref(database, `games/${gameCode}`);
  const snapshot = await get(gameRef);
  
  if (!snapshot.exists()) {
    throw new Error("Game not found");
  }

  const gameData = snapshot.val();
  const players = gameData.players ? Object.keys(gameData.players) : [];

  let repeated = false;

  for (const value of players){
    if (value === playerName){
      repeated = true;
    }
  }
  if (players.length >= 4) {
    throw new Error("too many players");
  } 
  if (repeated === true){
    throw new Error("repeated username");
  }

  // Add player to game
  addPlayer(gameCode, playerName);
  name = playerName;
  return gameData; // Return the full game data including difficulty
};

export const addPlayer = (gameCode: string, playerName: string) => {
    set(ref(database, `games/${gameCode}/players/${playerName}`), {
      name: playerName,
      completed: false,
      time: 999999, //should replace with math max later on
      movesDone: 0,
      shapes: '',
      colors: ''
    });
}

// Get players ordered by time
export const getPlayersByTime = (gameCode: string, callback: (players: any[]) => void) => {
  const playersRef = ref(database, `games/${gameCode}/players`);
  
  onValue(playersRef, (snapshot) => {
    const players: any[] = [];
    
    snapshot.forEach((childSnapshot) => {
      const playerData = childSnapshot.val();
      players.push({
        name: playerData.name,
        time: playerData.time,
        completed: playerData.completed,
        movesDone: playerData.movesDone
      });
    });
    
    players.sort((a, b) => {
      if (a.completed && b.completed) {
        return a.time - b.time; 
      }
      if (a.completed && !b.completed) return -1;
      if (!a.completed && b.completed) return 1;
      
      return 0;
    });
    
    callback(players);
  });
};

// Listen for top 5 players with best times
export const listenForTopPlayers = (gameCode: string, limitCount = 5, callback: (players: any[]) => void) => {
  getPlayersByTime(gameCode, (allPlayers) => {
    const topPlayers = allPlayers.slice(0, limitCount);
    callback(topPlayers);
  });
};

export const saveGameState = (gameCode: string) => {
  const currentTime = Date.now();
  if (currentTime - lastSaveTime < 2000) {
    console.log("save skipped, < 2 seconds since last save");
    return;
  }

  update(ref(database, `games/${gameCode}/players/${name}`), {
    shapes: gameState.getStringShapeArray(),
    colors: gameState.getStringColorArray()
  });
  //console.log(`saving shape + color arrays`);
};

export const getShapesArray = async (playerName: string) => {
  const playerRef = ref(database, `games/${code}/players/${playerName}`);
  const snapshot = await get(playerRef);
  if (snapshot.exists()) {
    const playerData = snapshot.val();
    return playerData.shapes || "";
  }
  return "";
};

export const getColorsArray = async (playerName: string) => {
  const playerRef = ref(database, `games/${code}/players/${playerName}`);
  const snapshot = await get(playerRef);
  if (snapshot.exists()) {
    const playerData = snapshot.val();
    return playerData.colors || "";
  }
  return "";
};

// Update player completion time
export const savePlayerTime = async (gameCode: string, timeInSeconds: number) => {
  const playerRef = ref(database, `games/${gameCode}/players/${name}`);
  console.log(`saving time taken for ${name}`);

  try {
    const snapshot = await get(playerRef);
    if (snapshot.exists()) {
      const playerData = snapshot.val();
      if (playerData.time === 999999 || timeInSeconds < playerData.time) {
        await update(playerRef, {
          completed: true,
          time: timeInSeconds,
        });
        console.log(`time: ${timeInSeconds} seconds`);
      } 
    }
  } catch (error) {
    console.error(error);
  }

  listenForTopPlayers(code, 5, (topPlayers) => {
    console.log("Top players sorted by time:", topPlayers);
  });
};

export const savePlayerMoves = (moveCount: number) => {
  const playerRef = ref(database, `games/${code}/players/${name}`);
  update(playerRef, {
    movesDone: moveCount 
  });
};

export const listenForPlayer = (gameCode: string, callback: (player: any) => void) => {
  const gameRef = ref(database, `games/${gameCode}/players/`);
  return onValue(gameRef, (snapshot) => {
    const player = snapshot.val() || {};
    callback(player);
  });
};
