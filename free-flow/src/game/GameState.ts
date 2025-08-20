import {Wire} from "./Wire"
import {Cell} from "./Cell"
import EasyMaps from './maps/6x6Maps.json';
import MedMaps from './maps/8x8Maps.json';
import HardMaps from './maps/10x10Maps.json';


export class GameState{
    private stringColorArray: string;
    private stringShapeArray: string;
    m: number;
    n: number;
    numWires: number;
    moveCount: number;
    gameStarted: boolean;
    gameEnded: boolean;
    difficulty: number;

    //stores the initial positions of all the terminals (colors 1 to numWires)
    private baseGameMap: number[][];
    mapsList: number[][][];
    
    //stores whether each cell is empty (0) terminal (colors -1 to -numWires) or wire (colors 1 to numWires)
    colorsGrid: number[][]; 
    //stores the state of each cell (for multiplayer rendering)
    segmentsGrid: number[][];

    wireList : Wire[] = new Array<Wire>; //stores all the wires
    curColor: number; //stores the current color of the wire

    //stores the wires we need to be checking for updates on this move
    private curMoveWires : number[] = new Array<number>;

   

    constructor(difficulty : number, levelID : number) {
        //set the difficulty maps
        this.difficulty = difficulty;
        if(difficulty == 1) {
            this.mapsList = EasyMaps;
        } else if (difficulty == 2) {
            this.mapsList = MedMaps;
        } else {
            this.mapsList = HardMaps;
        }
        this.baseGameMap = this.mapsList[levelID]; 

        this.n = this.baseGameMap.length;
        this.m = this.baseGameMap[0].length;
        this.moveCount = 0;
        this.gameStarted = false;
        this.gameEnded = false;
        this.baseGameMap = this.mapsList[levelID];
        this.segmentsGrid = new Array<Array<number>>;

        //count colors and initiallize the wire array
        let maxColor : number = 0;
        for(let i = 0; i < this.n; i++) {
            for(let j = 0; j<this.m; j++) {
                if(this.baseGameMap[i][j] > maxColor) {
                    maxColor = this.baseGameMap[i][j];
                }
            }
        }
        this.numWires = maxColor;

        this.curColor = 0;
        this.colorsGrid = [];

        //set the wire colors and populate aray
        for(let i = 1; i <= this.numWires; i++) {
            const curWire : Wire = new Wire(i);
            this.wireList.push(curWire);
        }

        for(let row = 0; row < this.n; row++) {
            let curRow : number[] = new Array<number>;
            let curEmptyRow : number[] = new Array<number>;
            for(let col = 0; col < this.m; col++) {
                //fill the current grid with negative colors
                let curColor = this.baseGameMap[row][col];
                curRow.push(-1*curColor);

                //if this is a color, set the terminals of that wire
                if(curColor > 0) {
                    let c :  Cell = new Cell(col, row);
                    let w : Wire = this.wireList[curColor-1];
                    w.setTerminal(c);
                }

                curEmptyRow.push(0);
            }
            this.colorsGrid.push(curRow);
            this.segmentsGrid.push(curEmptyRow);
        }
        this.stringColorArray = "";
        this.stringShapeArray = "";
        this.updateStringsFromArrays();
    }
    
    //updating game state when mouse is pressed
    updateOnPress(row: number, col: number) : void {
        //checks to see it's not out of bounds
        if(col < 0 || col >= this.m) return;
        if(row < 0 || row >= this.n) return;

        this.curColor = Math.abs(this.colorsGrid[row][col]);

        //if this is not an empty cell
        if(this.curColor > 0) {
            //have the wire process this addition and update grid
            this.wireList[this.curColor-1].isPressed = true;
            this.wireList[this.curColor-1].addOnDrag(new Cell(col, row));
            this.updatecolorsGrid();
        }

        this.updateSegmentsGrid();
        this.updateStringsFromArrays();
    }

    
    //updating game state when mouse is dragged
    updateOnDrag(row: number, col: number) : void {
        let prev : Cell | null = this.wireList[this.curColor-1].getLastCell(); //previous cell in wire's cell path

        /* the idea here is to find the closest valid cell to our mouse location 
        which will give user more flexibility when dragging */

        //the cells that we can consider right now: everything adjacent to the tail of current wire
        let possibleCurCells : Cell[]= [prev, new Cell(prev.col+1, prev.row), new Cell(prev.col, prev.row-1), 
                                               new Cell(prev.col-1, prev.row), new Cell(prev.col, prev.row+1)];
        
        //find the distances to all the valid cells, get rid of all the invalid ones             
        let distances : number[] = new Array<number>;                                       
        for(let i = 0; i<5; i++) {
            if(possibleCurCells[i].col < 0 || possibleCurCells[i].col >= this.m || possibleCurCells[i].row < 0 || possibleCurCells[i].row >= this.n){
                possibleCurCells[i] = new Cell(-1, -1); //invalidate cell
                distances.push(100000000); //very large number so it isn't chosen
                continue;
            }
            distances.push( (col - possibleCurCells[i].col)*(col - possibleCurCells[i].col) + (row - possibleCurCells[i].row)*(row - possibleCurCells[i].row));
        }

        //find the cell with the minimum distance
        let min = distances[0];
        let mindex = 0;
        for(let i = 0; i<5; i++) {
            if(min > distances[i]) {
                min = distances[i];
                mindex = i;
            }
        }
        
        //sets current to the nearest valid cell that's adjacent to previous tail of wire
        let cur = possibleCurCells[mindex];
        console.log(cur);

        /* Now we've decided what the current considered cell is, so we try to add it to the wire */

        // if we're in a new cell, do stuff
        if(!prev?.isEqual(cur) ) {
            console.log("in new cell");
            if(!cur.isAdjacent(prev)) return; //make sure we're adjacent

            //only proceed if it's not a terminal, or it's a terminal of the same color
            //this blocks us from trying to connect wires into another color terminal
            let cellColorBefore : number = this.colorsGrid[cur.row][cur.col];
            if(cellColorBefore >= 0 || cellColorBefore == -1*this.curColor) {
                let curWire : Wire = this.wireList[this.curColor-1];
         
                //have the wire process the new cell
                curWire.addOnDrag(cur);

                //if another wire was split by this, deal with the other wire here
                if(cellColorBefore > 0) {
                    //add it to the list of wires that we need to consider
                    //making sure it's not already there and not this current dragged wire
                    if(cellColorBefore != this.curColor && !this.curMoveWires.includes(cellColorBefore-1)) {
                        this.curMoveWires.push(cellColorBefore-1);
                    }
                }
                
                //deal with all the wires that this one has interacted with during the move
                for(let i = 0; i<this.curMoveWires.length; i++) {
                    this.wireList[this.curMoveWires[i]].updateOnCross(curWire);
                }

                //update cur filled grid because of the possible wire cuttings
                this.updatecolorsGrid();
                this.updateSegmentsGrid();

                this.updateStringsFromArrays();
            }
        }
    }

    //update wires on release
    updateOnRelease() {
        this.wireList[this.curColor-1].isPressed = false;
        for(let i = 0; i<this.wireList.length; i++) {
            this.wireList[i].updateAfterMove();
        }
        this.curColor = 0;
        this.curMoveWires = new Array<number>;
    }

    //updates the cur filled grid based on the wires
    updatecolorsGrid() {
        //write the terminals values 
        for(let i = 0; i<this.n; i++) {
            for(let j = 0; j<this.m; j++) {
                this.colorsGrid[i][j] = -1*this.baseGameMap[i][j];
            }
        }

        //over all the wires, input -1*color for the cells in their path
        for(let i = 0; i<this.wireList.length; i++) {
            let curWire : Wire = this.wireList[i];
            for(let j = 0; j<curWire.cellPath.length; j++) {
                let curCell : Cell = curWire.cellPath[j];
                if(!curWire.isTerminal(curCell)) {
                    this.colorsGrid[curCell.row][curCell.col] = (i+1);
                }
            }
        }
    }

    //update the grid that goes by segment
    updateSegmentsGrid() {

        // in the grids
        // > : 1    ^ : 2   < : 4   v : 8
        // horiz line: 5    vert line : 10
        // Q1 : 3   Q2: 6   Q3: 12  Q4: 9

        //reset everything
        for(let i = 0; i<this.segmentsGrid.length; i++) {
            for(let j = 0; j<this.segmentsGrid[i].length; j++) {
                this.segmentsGrid[i][j] = 0;
            }
        }
        
        //do the updates per wire
        for(let i = 0; i<this.wireList.length; i++) {
            let curWire : Wire = this.wireList[i];
            //check every cell on the wire
            for(let j = 0; j<curWire.cellPath.length-1; j++) {
                //using direction between next and current cell
                let curCell = curWire.cellPath[j];
                let nextCell = curWire.cellPath[j+1];
                let dir : string = curCell.relativeDirection(nextCell);
                if(dir == "L") {
                    this.segmentsGrid[curCell.row][curCell.col] += 4;
                    this.segmentsGrid[nextCell.row][nextCell.col] += 1;
                } else if (dir == "R") {
                    this.segmentsGrid[curCell.row][curCell.col] += 1;
                    this.segmentsGrid[nextCell.row][nextCell.col] += 4;
                } else if(dir == "U") {
                    this.segmentsGrid[curCell.row][curCell.col] += 2;
                    this.segmentsGrid[nextCell.row][nextCell.col] += 8;
                } else if(dir == "D") {
                    this.segmentsGrid[curCell.row][curCell.col] += 8;
                    this.segmentsGrid[nextCell.row][nextCell.col] += 2;
                }
            }
        }
    }

    //checks if the game is complete
    isGameComplete() : boolean {
        for(let i = 0; i<this.wireList.length; i++) {
            if(!this.wireList[i].isWireComplete()) {
                return false;
            }
        }
        return true; //only reached if every wire is complete
    }

    //returns the current array of segment codes
    getStringShapeArray() {
        return this.stringShapeArray;
    }

    //returns the current array of color codes
    getStringColorArray() {
        return this.stringColorArray;
    }

    //helper method to convert the array to a string, for returning strings
    squareArrayToString (a : number[][]) : string {
        let s : string = "";
        for(let i = 0; i<a.length; i++) {
            for(let j = 0; j<a[i].length; j++) {
                s += a[i][j];
                if(j!= a[i].length-1) s += ",";
            }
            if(i!=a.length-1) s += "/";
        }
        return s;
    } 

    //update the returning strings from the updating arrays
    updateStringsFromArrays () {
        this.stringShapeArray = this.squareArrayToString(this.segmentsGrid);
        this.stringColorArray = this.squareArrayToString(this.colorsGrid);
        console.log("shapes " +  this.stringShapeArray);
        console.log("colors " + this.stringColorArray);
    }


    //access the base game map
    getBaseGameMap () : number[][] {
        return this.baseGameMap;
    }

    
}