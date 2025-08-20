import { GameState } from "./GameState";

export let gameState = new GameState(0, 0); 

export const resetGameState = (difficulty: number, levelID: number) => {
    gameState = new GameState(difficulty, levelID);
};