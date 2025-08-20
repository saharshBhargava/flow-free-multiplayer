import { TextField, Alert, FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import React, { useState, useEffect } from "react";
import { joinGame, createGame, checkIfGameCodeExists } from '../dataManager';
import '../index.css';
import { useGameContext } from '../GameContext';
import { gameState } from '../game/GameStateInstance';

const UserLoginBoxes = () => {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [localDifficulty, setLocalDifficulty] = useState(2); // Default difficulty level
  const [showDifficultySelector, setShowDifficultySelector] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  
  const { 
    setGameCode, 
    setPlayerName, 
    setDifficulty, 
    setStartDisabled,
    setGameJoined,
    gameCode: contextGameCode 
  } = useGameContext();
  
  const [error, setError] = useState('');
  const [disableField, setDisableField] = useState(false);

  // check if the game code exists whenever it changes
  useEffect(() => {
    const checkGameExists = async () => {
      if (code.length > 0) {
        try {
          const exists = await checkIfGameCodeExists(code);
          setIsCreatingGame(!exists);
          setShowDifficultySelector(!exists);
        } catch (error) {
          console.error("Error checking game code:", error);
        }
      } else {
        setShowDifficultySelector(false);
      }
    };

    checkGameExists();
  }, [code]);

  // disable if game code is already set in context
  useEffect(() => {
    if (contextGameCode) {
      setDisableField(true);
    }
  }, [contextGameCode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (localDifficulty == 1) {
      gameState.m = 6;
      gameState.n = 6;
    }

    else if (localDifficulty == 2 ) {
      gameState.m = 8;
      gameState.n = 8;
    }

    else {
      gameState.m = 10;
      gameState.n = 10;
    }
        
    if (!username || !code) {
      setError("Username and game code are required.");
      return;
    }
    
    try {
      const codeExist = await checkIfGameCodeExists(code);
      if (codeExist) {
        const gameData = await joinGame(code, username);
        if (localDifficulty == 1) {
          gameState.m = 6;
          gameState.n = 6;
        }

        else if (localDifficulty == 2) {
          gameState.m = 8;
          gameState.n = 8;
        }

        else {
          gameState.m = 10;
          gameState.n = 10;
        }
        setGameJoined(true);
      } else {
        await createGame(code, "gameType", localDifficulty);
        await joinGame(code, username);

        setDifficulty(localDifficulty);
        console.log("Created new game with difficulty:", localDifficulty);
        setGameJoined(true);
      }
    
      setGameCode(code);
      setPlayerName(username);
      setCode('');
      setUsername('');
      setError('');
      setDisableField(true);
      setStartDisabled(false);


    } catch (error: any) {
      setGameJoined(false);
      if (error.message === "too many players") {
        setError("There's too many players in this game code.");
      } else if (error.message === "repeated username"){
        setError("There's already a user with that name in this game.")
      }
      else {
        setError("Error joining game. Try again.");
      }
    }    
  };

  const getDifficultyLabel = (difficultyValue: number) => {
    switch (difficultyValue) {
      case 1: return "Easy";
      case 2: return "Medium";
      case 3: return "Hard";
      default: return "Medium";
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <TextField 
          required
          id="username" 
          label="Username" 
          inputProps={{ maxLength: 10 }}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="textfield"
          disabled={disableField}
          fullWidth
          margin="normal"

          sx={{
            input: {
              color: 'white',
              '&.Mui-disabled': {
                color: 'white'
              }
            },
            label: {
              color: 'white',
              '&.Mui-disabled': {
                color: '#cccccc'
              }
            },
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: 'white'
            }
          }}
        />

        <TextField 
          required
          id="game-code" 
          label="Game Code" 
          inputProps={{ maxLength: 6 }}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="textfield"
          disabled={disableField}
          fullWidth
          margin="normal"
          sx={{
            input: {
              color: 'white',
              '&.Mui-disabled': {
                color: 'white'
              }
            },
            label: {
              color: 'white',
              '&.Mui-disabled': {
                color: '#cccccc'
              }
            },
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: 'white'
            }
          }}
        />
        
        {/*selector only shown when creating a new game */}
        {showDifficultySelector && (
          <Box mt={2} mb={1}>
            <FormControl fullWidth>
            <InputLabel id="difficulty-label" sx={{ color: 'white' }}> Difficulty</InputLabel>
              <Select
                labelId="difficulty-label"
                id="difficulty"
                value={localDifficulty}
                label="Difficulty"
                onChange={(event) => setLocalDifficulty(Number(event.target.value))}
                disabled={disableField}
                sx={{
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                      borderWidth: '3px',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                    '.MuiSvgIcon-root': {
                      color: 'white',
                    },
                  }}>
                <MenuItem value={1} sx={{ color: 'black' }}>Easy</MenuItem>
                <MenuItem value={2} sx={{ color: 'black' }}>Medium</MenuItem>
                <MenuItem value={3} sx={{ color: 'black' }}>Hard</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
        
        <button 
          type="submit" 
          disabled={disableField}
          className="join-button"
        >
          {isCreatingGame ? "Create & Join" : "Join"}
        </button>
      </form>
      
      {error && (
        <Box mt={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
    </div>
  );
};

export default UserLoginBoxes;