import React, { useEffect, useRef, useState } from 'react';
import p5Types from "p5";
import Sketch from "react-p5";
import { Renderer } from "../game/Renderer";
import { gameState } from "../game/GameStateInstance";
import { getShapesArray, getColorsArray, listenForPlayer } from "../dataManager";
import { useGameContext } from '../GameContext';

    
let cellSide = 0;
let boardWidth = 0;
let boardHeight = 0;
let leftX = 0;
let upY = 0;

interface OtherPlayerCanvasProperties {
  playerName: string;
  canvasSize: number;
}


const OtherPlayerCanvas: React.FC<OtherPlayerCanvasProperties> = ({ playerName, canvasSize = 200 }) => {
  const { gameCode } = useGameContext();
  const rendererRef = useRef<Renderer | null>(null);
  const [shapeArray, setShapeArray] = useState<string>("");
  const [colorArray, setColorArray] = useState<string>("");

  const canvasWidth = canvasSize;
  const canvasHeight = canvasSize;
  
  const getCellSize = () => {
    const m = gameState.m;
    return canvasWidth * 0.9 / m;
  };

  useEffect(() => {
    const getPlayerData = async () => {
      try {
        const shapes = await getShapesArray(playerName);
        const colors = await getColorsArray(playerName);
        
        if (shapes && colors) {
          setShapeArray(shapes);
          setColorArray(colors);
        }
      } catch (error) {
        console.error(`Error getting player data for ${playerName}:`, error);
      }
    };

    getPlayerData();

    const unsubscribe = listenForPlayer(gameCode, (players) => {
      if (players[playerName]) {
        const playerData = players[playerName];
        setShapeArray(playerData.shapes || "");
        setColorArray(playerData.colors || "");
      }
    });
    return () => unsubscribe();
  }, [playerName, gameCode]);

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    p5.createCanvas(canvasWidth, canvasHeight).parent(canvasParentRef);
    p5.background(0);
    
    cellSide = getCellSize();
    boardWidth = cellSide * gameState.m;
    boardHeight = cellSide * gameState.n;
    leftX = canvasWidth / 2 - boardWidth / 2;
    upY = canvasHeight / 2 - boardHeight / 2;
    
    rendererRef.current = new Renderer(p5, gameState, cellSide, leftX, upY);
    //rendererRef.current.drawBaseGameBoard();
  };

  const draw = (p5: p5Types) => {
    if (gameCode != '') {
        p5.clear(0, 0, 0, 0);
        p5.background(0);

        cellSide = getCellSize();
        boardWidth = cellSide * gameState.m;
        boardHeight = cellSide * gameState.n;
        leftX = canvasWidth / 2 - boardWidth / 2;
        upY = canvasHeight / 2 - boardHeight / 2;
    
        rendererRef.current = new Renderer(p5, gameState, cellSide, leftX, upY);

        if (rendererRef.current) {
          rendererRef.current.drawGrid();
          if (shapeArray && colorArray) {
            rendererRef.current.drawFromStrings(shapeArray, colorArray);
          }
        }
    }
  };

  return (
    <div>
      <p>{playerName}</p>
      <Sketch setup={setup} draw={draw} className="other-player-canvas"/>
    </div>
  );
};

export default OtherPlayerCanvas;