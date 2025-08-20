import { useState, useEffect, useRef } from "react";
import { savePlayerTime, startGameInDatabase } from "../dataManager";
import '../index.css'; 
import { useGameContext } from "../GameContext";
import { gameState } from "../game/GameStateInstance";
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';

const Timer = () => {
    const [running, setRunning] = useState(false);
    const { time, setTime } = useGameContext() as { time: number, setTime: React.Dispatch<React.SetStateAction<number>> };
    const { gameCode } = useGameContext();
    const { setGameStarted} = useGameContext();
    const { startDisabled } = useGameContext();
    const intervalRef = useRef<number | null>(null);
    const msRef = useRef(time);

    const [gameComplete, setGameComplete] = useState(gameState.isGameComplete());
    const [gameStartedEveryone, setGameStartedEveryone] = useState(false);
    const [gamesCompleted, setGamesCompleted] = useState(0);

    useEffect(() => {
        msRef.current = time;
    }, [time]);

    useEffect(() => {
        if (!gameCode) return;
        
        const gameRef = ref(database, `games/${gameCode}`);
        const unsubscribe = onValue(gameRef, (snapshot) => {
            if (snapshot.exists()) {
                const gameData = snapshot.val();
                const isGameStarted = gameData.gameStartedEveryone === true;
                setGameStartedEveryone(isGameStarted);
                
                if (isGameStarted && !running) {
                    setRunning(true);
                    setGameStarted(true);
                    gameState.gameStarted = true;
                }
            }
        });
        
        return () => unsubscribe();
    }, [gameCode, running, setGameStarted]);

      useEffect(() => {
        console.log("disabled", startDisabled);
        if (gameStartedEveryone && !gameComplete) {
            intervalRef.current = window.setInterval(() => {
                setTime((prev) => prev + 0.01);
            }, 10);
        } else {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                if (gameComplete && gameStartedEveryone && gamesCompleted == 4) {
                    savePlayerTime(gameCode, msRef.current);
                }
            }
        }
        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [gameStartedEveryone, setTime, gameComplete, gameCode]);  

    // poll for game completion 
    useEffect(() => {
        const checkGameComplete = setInterval(() => {
            if (gameComplete) {
                setGamesCompleted(gamesCompleted + 1);
                console.log("games completed" , gamesCompleted);
            }
            if (gameState.isGameComplete() !== gameComplete) {
                setGameComplete(gameState.isGameComplete());
            }


        }, 100);

        return () => clearInterval(checkGameComplete);
    }, [gameComplete]);

    return (
        <div>
            <h1>{Math.round(time * 10) / 10}</h1>
            <button disabled = { startDisabled } onClick={() => {
                startGameInDatabase(gameCode);
                setRunning(true);
            }}>Start</button>
        </div>
    );
};

export default Timer;
