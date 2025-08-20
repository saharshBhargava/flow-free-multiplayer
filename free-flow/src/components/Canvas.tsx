import Sketch from "react-p5";
import p5Types from "p5";
import {Renderer} from "../game/Renderer"
import { gameState, resetGameState } from "../game/GameStateInstance";
import { useState, useEffect, useRef } from "react";
import { savePlayerMoves, saveGameState, getPlayersByTime, getGameDifficulty, deleteGame } from "../dataManager";
import { useGameContext } from '../GameContext';

const canvasWidth = 500;
const canvasHeight = 500;
let m : number; //width #cells
let n : number; //height #cells
let r : Renderer;
let level : number = 0;

let setBoardWidth : number;
let setBoardHeight : number;
let setLeftX : number;
let setUpY : number;
let puzzleList : number[];

function Canvas () {
    const { 
        gameCode, 
        playerName, 
        gameStarted, 
        difficulty,
        gameJoined,
        setMoves,
        setDifficulty
    } = useGameContext();
    
    const [moveCount, setMoveCount] = useState(0);
    const [difficultyFromDB, setDifficultyFromDB] = useState<number | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [allPlayersFinished, setAllPlayersFinished] = useState(false);
    const {gameEnded, setGameEnded} = useGameContext();
    const deletionTimerRef = useRef<NodeJS.Timeout | null>(null);
    const checkFinishedRef = useRef<NodeJS.Timeout | null>(null);
    const { startDisabled } = useGameContext();
    useEffect(() => {
        const fetchDifficulty = async () => {
            if (gameCode) {
                try {
                    const dbDifficulty = await getGameDifficulty(gameCode);
                    setDifficulty(dbDifficulty);
                    setDifficultyFromDB(dbDifficulty);
                    setIsLoaded(true);
                } catch (error) {
                    console.error("Error fetching game difficulty:", error);
                }
            }
        };
        
        fetchDifficulty();
    }, [gameCode, setDifficulty]);

    // Update the context moves whenever moveCount changes
    useEffect(() => {
        setMoves(moveCount);
    }, [moveCount, setMoves]);
    
    useEffect(() => {
        return () => {
            if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);
            if (checkFinishedRef.current) clearInterval(checkFinishedRef.current);
        };
    }, []);

    const setup = (p5: p5Types, canvasParentRef: Element) => {
        //sets up the black canvas
        p5.createCanvas(canvasWidth, canvasHeight).parent(canvasParentRef);
        p5.background(0);
        
        const difficultyToUse = difficultyFromDB !== null ? difficultyFromDB : difficulty;

        if(difficultyToUse != 0) {

            //the total number of puzzles in hard/medium/easy json, for randomizing
            let totalPuzzles : number = 10;
            if(difficultyToUse == 3) { //hard
                totalPuzzles = 17;
            } else if (difficultyToUse == 2) { //med
                totalPuzzles = 20;
            } else { //easy
                totalPuzzles = 40;
            }

            // sets up the random list of puzzles
            puzzleList = new Array<number>;
            for(let i = 0; i<5; i++) {
                let isRepeat : boolean = true;
                let randomInt = -1;
                while(isRepeat) {
                    randomInt = Math.floor(totalPuzzles*Math.random());
                    if(puzzleList.includes(randomInt)) {
                        isRepeat = true;
                    } else {
                        isRepeat = false;
                    }
                }
                puzzleList.push(randomInt);
            }
        
            console.log("Generated puzzles:", puzzleList);
            console.log(`Using difficulty level: ${difficultyToUse} (from DB: ${difficultyFromDB}, from context: ${difficulty})`);
            
            
            //sets up the game state with the current difficulty
            resetGameState(difficultyToUse, puzzleList[0]);

            m = gameState.m;
            n = gameState.n;

            gameState.moveCount = 0;
            setMoveCount(0); 

            //sizes
            let cellSide = canvasWidth*0.9/m;
            const boardWidth = cellSide*m;
            const boardHeight = cellSide*n;

            setBoardWidth = boardWidth;
            setBoardHeight = boardHeight;

            //coordinates for corners of grid
            const leftX = canvasWidth/2 - boardWidth/2;
            const upY = canvasHeight/2 - boardHeight/2;

            setLeftX = leftX;
            setUpY = upY;

            //sets up the renderer and draw starting state
            r = new Renderer(p5, gameState, cellSide, leftX, upY);
            if (checkFinishedRef.current) clearInterval(checkFinishedRef.current);
            checkFinishedRef.current = setInterval(checkAllPlayersFinished, 10000); // Check every 10 seconds    
        }
    };  

    const draw = (p5: p5Types) => {      
        if(gameStarted) {
            r.drawAll();
            if(gameState.isGameComplete()) {
                //darken the board
                p5.fill(0,150);
                p5.rect(0,0,canvasWidth, canvasHeight);
            } 
            //draws the highlighted circle
            if(p5.mouseIsPressed) {
                r.drawBigHighlightedCircle(p5.mouseX, p5.mouseY) 
            }
        } else {
            if (!gameJoined) {
                displayInstructions(p5);
            } else {
                r.drawGrid();
            }
        }
        
        if(gameState.isGameComplete()) {
            setTimeout(() => {onContButtonClick();}, 600);
            r.drawAll();
            p5.fill(0,150);
            p5.rect(0,0,canvasWidth, canvasHeight);
            if (level > puzzleList.length - 1) {
                console.log("puzzles completed");
                setGameEnded(true);
                displayLeaderboard(p5);
                return;
            }
        } 
    };

    //update game state when the mouse is pressed
    function mousePressed(p5: p5Types) {
        if (gameEnded) return;
        console.log("start status ", gameStarted);

        if (gameStarted) {
            console.log(gameState.isGameComplete());
            gameState.updateOnPress(r.findRowFromY(p5.mouseY), r.findColFromX(p5.mouseX)); //update game state with current mouse pos
            if (gameState.isGameComplete() == false) {
                if (p5.mouseY >= setUpY && p5.mouseX >= setLeftX && p5.mouseY <= setUpY + setBoardHeight && p5.mouseX <= setLeftX + setBoardHeight) {
                    gameState.moveCount = gameState.moveCount + 1;
                    setMoveCount(gameState.moveCount)
                }
            }
        }
    }

    //update game state when mouse is dragged
    function mouseDragged(p5: p5Types) {
        if (gameEnded) return;
        saveGameState(gameCode);
        if(gameState.curColor == 0) return;
        gameState.updateOnDrag(r.findRowFromY(p5.mouseY), r.findColFromX(p5.mouseX)); //update game state with current mouse pos
    }

    function mouseReleased(p5: p5Types) {
        if (gameEnded) return;

        if (gameState.isGameComplete()) {
            savePlayerMoves(moveCount);
        }
        gameState.updateOnRelease();
    }
    
    function onContButtonClick() {
        if (gameEnded) return;

        let isDone = gameState.isGameComplete();
        if(isDone) {
            savePlayerMoves(moveCount);
                        
            level++;
            gameState.moveCount = 0;
            setMoveCount(0);
            
            const difficultyToUse = difficultyFromDB !== null ? difficultyFromDB : difficulty;
            resetGameState(difficultyToUse, puzzleList[level]);
            
            let m = gameState.m;
            let cellSide = canvasWidth*0.9/m;
            r = new Renderer(r.p5, gameState, cellSide, setLeftX, setUpY);
            console.log("Loading puzzle:", puzzleList[level], "with difficulty:", difficultyToUse);
        } else {
            console.log("not done");
        }
    }

    function displayInstructions(p5: p5Types) {
        p5.background(0);
        p5.fill(255);


        p5.textSize(32);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text("Instructions", canvasWidth/2, 60);

        p5.textSize(18);
        p5.text("Connect all same-colored dots.", canvasWidth/2, 100);
        p5.text("Drag from one dot to another of the same color.", canvasWidth/2, 125);
        p5.text("Fill the entire grid to finish the level.", canvasWidth/2, 150);
        p5.text("Enter your username and game code to join a game.", canvasWidth/2, 175);
        p5.text("Start when everyone's ready!", canvasWidth/2, 200);
    }

    function displayLeaderboard(p5: p5Types) {
        p5.fill(0, 200);
        p5.rect(0, 0, canvasWidth, canvasHeight);
        p5.fill(255);

        p5.textSize(32);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text("All Puzzles Completed!", canvasWidth/2, 60);
    
        p5.textSize(24);
        p5.text("Leaderboard", canvasWidth/2, 100);
        
        //draws the leaderboard
        getPlayersByTime(gameCode, (players) => {
            p5.textSize(16);
            p5.textAlign(p5.LEFT, p5.CENTER);
            
            p5.fill(200);
            p5.text("Rank", 120, 140);
            p5.text("Name", 180, 140);
            p5.text("Time (seconds)", 300, 140);
            
            p5.stroke(200);
            p5.line(100, 155, 400, 155);
            p5.noStroke();
            
            let yPos = 175;
            if (level >= puzzleList.length - 1)
                players.slice(0, 5).forEach((player, index) => {
                    p5.fill(255);
                    p5.text(`${index + 1}`, 120, yPos);
                    p5.text(`${player.name}`, 180, yPos);
                        const timeText = player.time !== 999999 
                            ? `${parseFloat(player.time).toFixed(2)}` 
                            : 'Not Finished';
                        p5.text(timeText, 300, yPos);
                    yPos += 30;
            });
                
            if (players.length === 0) {
                p5.fill(255);
                p5.textAlign(p5.CENTER, p5.CENTER);
                p5.text("Game code has expired, start new game", canvasWidth/2, canvasHeight - 120);
            }
            
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.textSize(20);
            p5.fill(255, 255, 100);
            p5.text("Congratulations on completing all puzzles!", canvasWidth/2, canvasHeight - 80);
            
            p5.textSize(16);
            p5.fill(200);
            p5.text("Click below to play again.", canvasWidth/2, canvasHeight - 40);
        });
    }

    const checkAllPlayersFinished = () => {
        if (!gameCode || gameEnded) return;
        
        getPlayersByTime(gameCode, (players) => {
            if (players.length === 0) return;
            
            const allFinished = players.every(player => player.time !== 999999);
            
            if (allFinished && !allPlayersFinished) {
                console.log("All players have finished the game!");
                setAllPlayersFinished(true);
                
                if (deletionTimerRef.current) clearTimeout(deletionTimerRef.current);

                deletionTimerRef.current = setTimeout(() => {
                    console.log("Deleting game after 5 minute timeout");
                    deleteGame(gameCode);
                }, 8000); // 5 minutes in milliseconds
            }
        });
    };


    const getDifficultyText = () => {
        const currentDifficulty = difficultyFromDB !== null ? difficultyFromDB : difficulty;
        
        switch(currentDifficulty) {
            case 1: return "Easy";
            case 2: return "Medium";
            case 3: return "Hard";
            default: return "Medium";
        }
    };

    if (gameCode && !isLoaded) {
        return <div className="game-info">Loading game difficulty...</div>;
    }

    return <>
            <div className="game-info">
                {/* <h1>Moves: {moveCount}</h1> */}
                <h2>Difficulty: {getDifficultyText()}</h2>
            </div>
            <Sketch setup={setup} draw={draw} mousePressed={mousePressed} mouseDragged={mouseDragged} mouseReleased={mouseReleased} className="canvas"/>
    </>
};

export default Canvas