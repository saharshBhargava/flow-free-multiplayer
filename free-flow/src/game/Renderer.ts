import {Cell} from "./Cell"
import {Wire} from "./Wire"
import {GameState} from "./GameState"

import p5Types from "p5"; //Import this for typechecking and intellisense

export class Renderer{
    //parameters of size of the grid, for drawing
    m: number;
    n: number;
    cellSize: number;
    leftX: number;
    upY: number;
    rightX: number;
    downY: number;
    p5: p5Types;
    gameState: GameState;

    terminalDiameter: number;
    wireDiameter: number;

    //color palletes
    colorPallete = new Array<p5Types.Color>;
    darkColorPallete = new Array<p5Types.Color>;
    

    constructor(p5: p5Types, gameState: GameState, cellSize: number, leftX: number, upY: number) {
        //set all the size/location parameters
        this.p5 = p5;
        this.gameState = gameState;
        this.m = this.gameState.m;
        this.n = this.gameState.n;
        this.cellSize = cellSize;
        this.leftX = leftX;
        this.upY = upY;
        this.rightX = leftX + cellSize*this.m;
        this.downY = upY + cellSize*this.n;
        this.terminalDiameter = 0.6*this.cellSize;
        this.wireDiameter = 0.45*this.terminalDiameter;

        this.initializeColors();
    }

    //draws the grid and the terminals
    drawBaseGameBoard() {
        this.drawGrid();
        this.p5.noStroke();
        const baseTerminals : number[][] = this.gameState.getBaseGameMap();
        for (let row = 0; row < this.m; row++) {
            for(let col = 0; col < this.n; col++) {
                if(baseTerminals[row][col] != 0) {
                    this.p5.fill(this.colorPallete[baseTerminals[row][col]]);
                    this.drawCircle(col, row);
                }  
            }
        }
    }

    //draws everything from the game state
    drawAll() {
        //clears the past stuff
        this.p5.clear(0,0,0,0);
        this.p5.background(0);

        //draw the base grid
        this.drawGrid();
        
        //draw all wires
        let wires = this.gameState.wireList;
        for(let i = 0; i<wires.length; i++) {
            if(!wires[i].isPressed) this.drawWireShading(wires[i]);
        }
        for(let i = 0; i<wires.length; i++) {
            this.drawWire(wires[i]);
        }
    }

    //draws a grid from the strings, for use in drawing other players' boards
    drawFromStrings(shapeArray : string, colorArray : string) {
        let segmentGrid  : number[][] = this.splitStringToArray(shapeArray);
        let colorGrid : number[][] = this.splitStringToArray(colorArray);

        //fills all the cells with correct segment and color
        for(let r = 0; r<segmentGrid.length; r++) {
            for(let c = 0; c<segmentGrid[r].length; c++) {
                if(colorGrid[r][c] != 0) this.p5.fill(this.colorPallete[Math.abs(colorGrid[r][c])]);
                if(colorGrid[r][c] < 0) {
                    this.drawCircle(c, r);
                }
                this.drawSegmentFromNum(c, r, segmentGrid[r][c]);
            }
        }
    }


    // ------------------- helper functions ---------------------------------

    //draws one wire (including the terminals)
    drawWire(w: Wire) {
        this.p5.noStroke();
        
        //draw terminals
        this.p5.fill(this.colorPallete[w.color]);
        this.drawCircle(w.terminal1.col, w.terminal1.row);
        this.drawCircle(w.terminal2.col, w.terminal2.row);

        //draw wire segments
        const path : Cell[] = w.cellPath;
        for(let i = 1; i<path.length; i++) {
            this.connectAdjacentCells(path[i-1], path[i]);
        }
    }
    
    //draws the transparent shading behind completed wires
    drawWireShading(w: Wire) {
        this.p5.fill(this.darkColorPallete[w.color]);
        //the shading is based by move, doesn't change during a move
        if(w.prevMoveCellPath.length > 1) {
            for(let i = 0; i<w.prevMoveCellPath.length; i++) {
                this.drawCellBackground(w.prevMoveCellPath[i]);
            }
        }
    }
    
    //draws a wire segment connecting two adjacent cells
    connectAdjacentCells(c1: Cell, c2: Cell) {
        this.p5.noStroke();
        if(!c1.isAdjacent(c2)) return;
        if(c1.col == c2.col-1 && c1.row == c2.row) {
            this.drawHorizontalSegment(c1.row, c1.col);
        } else if(c1.col == c2.col + 1 && c1.row == c2.row) {
            this.drawHorizontalSegment(c2.row, c2.col);
        } else if(c1.col == c2.col && c1.row == c2.row-1) {
            this.drawVerticalSegment(c1.row, c1.col);
        } else if(c1.col == c2.col && c1.row == c2.row+1) {
            this.drawVerticalSegment(c2.row, c2.col);
        }
    }

    //connects two adjacent cells horizontally, going from row,col to row,col+1
    drawHorizontalSegment(row: number, col: number) {
        this.p5.rect(
            this.findCellCenterX(col) - 0.5*this.wireDiameter, this.findCellCenterY(row) - 0.5*this.wireDiameter, 
            this.cellSize + this.wireDiameter, this.wireDiameter, this.wireDiameter/2
        )
    }

    //connects two adjacent cells vertically, going from row,col to row+1,col
    drawVerticalSegment(row: number, col: number) {
        this.p5.rect(
            this.findCellCenterX(col) - 0.5*this.wireDiameter, this.findCellCenterY(row) - 0.5*this.wireDiameter, 
            this.wireDiameter, this.cellSize+this.wireDiameter, this.wireDiameter/2 
        )
    }

    //draws the segment from the segment code number
    drawSegmentFromNum(col: number, row: number, shape: number) {
        this.p5.noStroke();

        // in the grid
        // > : 1    ^ : 2   < : 4   v : 8
        // horiz line: 5    vert line : 10
        // Q1 : 3   Q2: 6   Q3: 12  Q4: 9

        if(shape >= 8) { //is there a segment pointing down?
            this.p5.rect(
                this.findCellCenterX(col) - this.wireDiameter/2, this.findCellCenterY(row) - this.wireDiameter/2,
                this.wireDiameter, this.cellSize/2 + this.wireDiameter, this.wireDiameter/2
            );
            shape -= 8;
        }
        if(shape >= 4) { //is there a segment pointing to the left?
            this.p5.rect(
                this.findCellCenterX(col) - this.cellSize/2 - this.wireDiameter/2, this.findCellCenterY(row) - this.wireDiameter/2, 
                this.cellSize/2 + this.wireDiameter, this.wireDiameter, this.wireDiameter/2  
            )
            shape -= 4;
        }
        if(shape >= 2) { //is there a segment pointing up?
            this.p5.rect(
                this.findCellCenterX(col) - this.wireDiameter/2, this.findCellCenterY(row) - this.cellSize/2 - this.wireDiameter/2,
                this.wireDiameter, this.cellSize/2 + this.wireDiameter, this.wireDiameter/2
            )
            shape -= 2;
        }
        if(shape >= 1) { //is there a segment pointing to the right?
            this.p5.rect(
                this.findCellCenterX(col) - this.wireDiameter/2, this.findCellCenterY(row) - this.wireDiameter/2,
                this.cellSize/2 + this.wireDiameter, this.wireDiameter, this.wireDiameter/2
            )
            shape -= 1;
        }
    }

    //m is width # of cells, n is height # of cells
    drawGrid() {
        this.p5.stroke('white');
        for(let i = 0; i <= this.n; i++) {
            this.p5.line(this.leftX, this.upY + this.cellSize*i, this.rightX, this.upY + this.cellSize*i);   
        }
        for(let i = 0; i <= this.m; i++) {
            this.p5.line(this.leftX + this.cellSize*i, this.upY, this.leftX + this.cellSize*i, this.downY);
        }
    }

    //draws the highlighted background that shows up when terminals connected
    drawCellBackground(c: Cell) {
        this.p5.stroke('white');
        this.p5.rect(this.findCellCenterX(c.col) - this.cellSize*0.5, this.findCellCenterY(c.row) - this.cellSize*0.5, this.cellSize, this.cellSize);
    }

    //draws the highlighted circle that follows the mouse
    drawBigHighlightedCircle(x: number, y: number) {
        if(this.gameState.curColor == 0) return; //don't draw this if it's nothing
        this.p5.fill(this.darkColorPallete[this.gameState.curColor]);
        this.p5.ellipse(x, y, 90, 90);
    }

    //draws a terminal circle in a cell
    drawCircle(col: number, row: number) {
        this.p5.noStroke();
        this.p5.ellipse(this.findCellCenterX(col), this.findCellCenterY(row), this.terminalDiameter, this.terminalDiameter);
    }

    //finds the col number from the x coordinate
    findColFromX(x: number) : number {
        return Math.floor( (x-this.leftX) / this.cellSize );
    }

    //finds the row number from the y coordinate
    findRowFromY(y: number) : number {
        return Math.floor( (y-this.upY) / this.cellSize );
    }

    //converts cell X coordinate to X location on the board
    findCellCenterX(col: number) {
        if(col < 0) throw new Error("X out of bounds");
        if(col >= this.m) throw new Error("X out of bounds");
        return this.leftX + this.cellSize*0.5 + col*this.cellSize;
    }
    //converts cell Y coordinate to Y location on the board
    findCellCenterY(row: number) {
        if(row < 0) throw new Error("Y out of bounds");
        if(row >= this.n) throw new Error("Y out of bounds");
        return this.upY + this.cellSize*0.5 + row*this.cellSize;
    }

    //parses string to a 2d array
    splitStringToArray(s : string) : number[][] {
        let grid = new Array<Array<number>>;

        let stringRows = s.split("/");
    
        for(let i = 0; i<stringRows.length; i++) {
            let curRowAsStrings = stringRows[i].split(",");
            let curRowAsNums = new Array<number>;
            for(let j = 0; j<curRowAsStrings.length; j++) {
                curRowAsNums.push(parseInt(curRowAsStrings[j]));
            }
            grid.push(curRowAsNums);
        }

        return grid;
    }

    initializeColors() {
        //creates colors
        let black = this.p5.color(0,0,0);
        let red  = this.p5.color(255,0,0);
        let yellow = this.p5.color(255,255,0);
        let blue = this.p5.color(10,40,255);
        let green = this.p5.color(0,150,0);
        let orange = this.p5.color(255,140,0);
        let cyan = this.p5.color(0,255,255);
        let pink = this.p5.color(255,10,200);
        let brick = this.p5.color(160,40,40);
        let purple = this.p5.color(130,0,130);
        let white = this.p5.color(255, 255, 255);

        
        this.colorPallete.push(black, red, blue, green, yellow, orange, cyan, pink, brick, purple, white);

        //creates the dimmed color pallete with opacity
        for(let i = 0; i<this.colorPallete.length; i++) {
            let c = this.colorPallete[i]; 
            this.darkColorPallete.push(this.p5.color(this.p5.red(c), this.p5.green(c), this.p5.blue(c), 80));
        }
    }

}